"""
FastAPI Gateway Microservice for html-tool

This gateway service provides a unified API entry point for all microservices in the html-tool ecosystem.
It handles authentication, request logging, and proxying to internal services.

CLOUD SCALING NOTES (Google Cloud Run):
- This app is stateless and horizontally scalable
- Set environment variables via Cloud Run configuration
- Use Cloud Secret Manager for sensitive credentials
- Configure auto-scaling: min instances=0, max instances=10+ based on load
- Set concurrency to 80-100 requests per instance
- Use Cloud Load Balancer for SSL termination and routing
- Enable Cloud Logging for request/response audit trails
- Consider Cloud Armor for DDoS protection
- Use Cloud CDN for static assets if needed
"""

import os
import time
import logging
import json
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

from fastapi import FastAPI, Request, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
from jose import JWTError, jwt
from pydantic import BaseModel, Field

# ============================================================================
# CONFIGURATION
# ============================================================================

# Load configuration from environment variables
# In production (Cloud Run), set these via environment configuration
API_SECRET_KEY = os.getenv("API_SECRET_KEY", "dev-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Internal microservice endpoints (composable structure)
# CLOUD SCALING NOTE: In production, these should point to:
# - Internal service URLs within the same VPC/network
# - Cloud Run service URLs with authentication
# - Load balancer endpoints for multi-instance services
MICROSERVICE_ENDPOINTS = {
    "upload": os.getenv("UPLOAD_SERVICE_URL", "http://localhost:3000/api/analyze-images"),
    "generate_listing": os.getenv("GENERATE_LISTING_SERVICE_URL", "http://localhost:3000/api/insights"),
    "syndicate": os.getenv("SYNDICATE_SERVICE_URL", "http://localhost:3000/api/bulk-upload-ebay"),
    "research": os.getenv("RESEARCH_SERVICE_URL", "http://localhost:3000/api/ebay/str"),
    "status": "internal",  # Status endpoint is handled internally
}

# Timeout for proxied requests
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

# Configure structured logging for auditability
# CLOUD SCALING NOTE: In Cloud Run, logs are automatically sent to Cloud Logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger(__name__)

# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================

app = FastAPI(
    title="html-tool Gateway API",
    description="API Gateway for html-tool microservices",
    version="1.0.0",
)

# CORS Configuration
# CLOUD SCALING NOTE: In production, restrict origins to your actual domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# AUTHENTICATION MODELS & DEPENDENCIES
# ============================================================================

security_bearer = HTTPBearer(auto_error=False)
security_api_key = APIKeyHeader(name="X-API-Key", auto_error=False)


class TokenData(BaseModel):
    """JWT Token data model"""
    username: Optional[str] = None
    expires: Optional[datetime] = None


class LoginRequest(BaseModel):
    """Login request model"""
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    """Token response model"""
    access_token: str
    token_type: str = "bearer"


def create_access_token(data: dict) -> str:
    """
    Create a JWT access token
    
    CLOUD SCALING NOTE: For multi-region deployments, consider using
    a shared secret management service (Cloud Secret Manager)
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, API_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security_bearer)) -> TokenData:
    """
    Verify JWT token from Authorization header
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, API_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )
        return TokenData(username=username)
    except JWTError as e:
        logger.error(f"JWT verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def verify_api_key(api_key: str = Depends(security_api_key)) -> bool:
    """
    Verify API key from X-API-Key header
    
    CLOUD SCALING NOTE: In production, store valid API keys in a database
    or use Cloud Secret Manager for key rotation
    """
    valid_api_keys = os.getenv("VALID_API_KEYS", "dev-api-key-1,dev-api-key-2").split(",")
    if api_key and api_key in valid_api_keys:
        return True
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid API key",
    )


async def authenticate(
    bearer_token: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    api_key: Optional[str] = Depends(security_api_key),
) -> Dict[str, Any]:
    """
    Flexible authentication: accepts either JWT Bearer token or API key
    """
    # Try API key first
    if api_key:
        try:
            verify_api_key(api_key)
            return {"auth_type": "api_key", "api_key": api_key}
        except HTTPException:
            pass
    
    # Try bearer token
    if bearer_token:
        token_data = verify_token(bearer_token)
        return {"auth_type": "jwt", "username": token_data.username}
    
    # No valid authentication provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required: provide Bearer token or X-API-Key header",
    )


def get_auth_identifier(auth: Dict[str, Any]) -> str:
    """
    Get a safe authentication identifier for logging (without exposing API keys)
    
    SECURITY NOTE: This function redacts sensitive authentication data for logging.
    - JWT auth: only logs username (no password)
    - API key auth: redacts all but first 4 chars
    - The 'auth' dict never contains passwords at this point (already authenticated)
    
    CodeQL may flag this as logging sensitive data, but it's a false positive
    because sensitive data is redacted before logging.
    """
    if auth.get('auth_type') == 'jwt':
        return f"user:{auth.get('username', 'unknown')}"
    elif auth.get('auth_type') == 'api_key':
        # Only show first few characters of API key for security
        api_key = auth.get('api_key', '')
        if len(api_key) > 4:
            return f"api_key:{api_key[:4]}***"
        return "api_key:***"
    return "unknown"


# ============================================================================
# MIDDLEWARE FOR REQUEST/RESPONSE LOGGING
# ============================================================================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Middleware to log all requests and responses for auditability
    
    CLOUD SCALING NOTE: In Cloud Run, these logs appear in Cloud Logging
    and can be exported to BigQuery for analysis
    """
    request_id = f"{time.time()}-{id(request)}"
    start_time = time.time()
    
    # Log request
    request_log = {
        "request_id": request_id,
        "timestamp": datetime.utcnow().isoformat(),
        "method": request.method,
        "url": str(request.url),
        "client_ip": request.client.host if request.client else "unknown",
        "headers": dict(request.headers),
    }
    logger.info(f"REQUEST: {json.dumps(request_log)}")
    
    # Process request
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        
        # Log response
        response_log = {
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat(),
            "status_code": response.status_code,
            "duration_seconds": round(duration, 3),
        }
        logger.info(f"RESPONSE: {json.dumps(response_log)}")
        
        return response
    
    except Exception as e:
        duration = time.time() - start_time
        
        # Log error
        error_log = {
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
            "duration_seconds": round(duration, 3),
        }
        logger.error(f"ERROR: {json.dumps(error_log)}")
        
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "request_id": request_id}
        )


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.post("/auth/login", response_model=TokenResponse, tags=["Authentication"])
async def login(login_data: LoginRequest):
    """
    Authenticate user and return JWT token
    
    CLOUD SCALING NOTE: In production, validate against a user database
    or identity provider (Cloud Identity Platform, Firebase Auth, etc.)
    """
    # Simple validation (replace with real authentication in production)
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    
    if login_data.username == admin_username and login_data.password == admin_password:
        access_token = create_access_token({"sub": login_data.username})
        logger.info(f"Successful login for user: {login_data.username}")
        return TokenResponse(access_token=access_token)
    
    logger.warning(f"Failed login attempt for user: {login_data.username}")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
    )


@app.post("/auth/verify", tags=["Authentication"])
async def verify_auth(auth: Dict = Depends(authenticate)):
    """
    Verify authentication token or API key
    """
    return {"authenticated": True, "auth_info": auth}


# ============================================================================
# GATEWAY ENDPOINTS
# ============================================================================

@app.post("/upload", tags=["Gateway"])
async def upload_endpoint(
    files: list[UploadFile] = File(...),
    auth: Dict = Depends(authenticate)
):
    """
    Upload and analyze product images
    
    Proxies to the upload/image analysis microservice
    
    CLOUD SCALING NOTE: For large file uploads, consider:
    - Streaming uploads to Cloud Storage
    - Using signed URLs for direct client-to-storage uploads
    - Implementing resumable uploads for reliability
    """
    try:
        logger.info(f"Upload request from {get_auth_identifier(auth)}")
        
        # Prepare multipart form data for proxying
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            files_payload = []
            for file in files:
                file_content = await file.read()
                files_payload.append(
                    ("images", (file.filename, file_content, file.content_type))
                )
                await file.seek(0)  # Reset file pointer
            
            # Proxy request to upload service
            response = await client.post(
                MICROSERVICE_ENDPOINTS["upload"],
                files=files_payload
            )
            
            response.raise_for_status()
            return response.json()
    
    except httpx.HTTPError as e:
        logger.error(f"Upload service error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Upload service error: {str(e)}"
        )


@app.post("/generate-listing", tags=["Gateway"])
async def generate_listing_endpoint(
    request: Request,
    auth: Dict = Depends(authenticate)
):
    """
    Generate optimized product listing with AI insights
    
    Proxies to the listing generation microservice
    
    CLOUD SCALING NOTE: This endpoint may be CPU/AI-intensive.
    Consider:
    - Dedicated service instances with higher CPU allocation
    - Async processing with job queues (Cloud Tasks, Pub/Sub)
    - Caching frequent requests
    """
    try:
        logger.info(f"Generate listing request from {get_auth_identifier(auth)}")
        
        body = await request.json()
        
        # Proxy request to listing generation service
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.post(
                MICROSERVICE_ENDPOINTS["generate_listing"],
                json=body
            )
            response.raise_for_status()
            return response.json()
    
    except httpx.HTTPError as e:
        logger.error(f"Listing generation service error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Listing generation service error: {str(e)}"
        )


@app.post("/syndicate", tags=["Gateway"])
async def syndicate_endpoint(
    request: Request,
    auth: Dict = Depends(authenticate)
):
    """
    Syndicate listings to marketplaces (e.g., eBay)
    
    Proxies to the syndication microservice
    
    CLOUD SCALING NOTE: Syndication may involve third-party API rate limits.
    Consider:
    - Rate limiting at gateway level
    - Queue-based processing for bulk operations
    - Retry logic with exponential backoff
    - Circuit breaker pattern for external service failures
    """
    try:
        logger.info(f"Syndication request from {get_auth_identifier(auth)}")
        
        body = await request.json()
        
        # Proxy request to syndication service
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT * 2) as client:  # Longer timeout
            response = await client.post(
                MICROSERVICE_ENDPOINTS["syndicate"],
                json=body
            )
            response.raise_for_status()
            return response.json()
    
    except httpx.HTTPError as e:
        logger.error(f"Syndication service error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Syndication service error: {str(e)}"
        )


@app.post("/research", tags=["Gateway"])
async def research_endpoint(
    request: Request,
    auth: Dict = Depends(authenticate)
):
    """
    Perform market research and competitive analysis
    
    Proxies to the market research microservice
    
    CLOUD SCALING NOTE: Research may involve web scraping or API calls.
    Consider:
    - Caching research results (Cloud Memorystore/Redis)
    - Background processing for deep research
    - Result pagination for large datasets
    """
    try:
        logger.info(f"Research request from {get_auth_identifier(auth)}")
        
        body = await request.json()
        
        # Proxy request to research service
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.post(
                MICROSERVICE_ENDPOINTS["research"],
                json=body
            )
            response.raise_for_status()
            return response.json()
    
    except httpx.HTTPError as e:
        logger.error(f"Research service error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Research service error: {str(e)}"
        )


@app.get("/status", tags=["Gateway"])
async def status_endpoint():
    """
    Get gateway and microservices health status
    
    This endpoint is public (no authentication required) for health checks
    
    CLOUD SCALING NOTE: Cloud Run uses this for health checks.
    - Should respond quickly (< 1 second)
    - Return 200 OK if service is healthy
    - Can include basic service dependency checks
    """
    service_status = {
        "gateway": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
    }
    
    # Optional: Check microservice health (comment out for faster response)
    # microservice_health = {}
    # for service_name, url in MICROSERVICE_ENDPOINTS.items():
    #     if url != "internal":
    #         try:
    #             async with httpx.AsyncClient(timeout=2) as client:
    #                 response = await client.get(url.replace("/api/", "/health"))
    #                 microservice_health[service_name] = "healthy"
    #         except:
    #             microservice_health[service_name] = "unhealthy"
    # 
    # service_status["microservices"] = microservice_health
    
    return service_status


# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint with API information
    """
    return {
        "service": "html-tool Gateway API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "authentication": ["/auth/login", "/auth/verify"],
            "gateway": ["/upload", "/generate-listing", "/syndicate", "/research", "/status"],
            "documentation": ["/docs", "/redoc"],
        }
    }


# ============================================================================
# HEALTH CHECK ENDPOINT (for Cloud Run)
# ============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for Cloud Run startup/liveness probes
    
    CLOUD SCALING NOTE: This is crucial for Cloud Run health monitoring
    """
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# ============================================================================
# APPLICATION STARTUP/SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """
    Actions to perform on application startup
    
    CLOUD SCALING NOTE: Keep startup fast for quick scaling
    """
    logger.info("Gateway service starting up...")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"Configured microservices: {list(MICROSERVICE_ENDPOINTS.keys())}")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Actions to perform on application shutdown
    
    CLOUD SCALING NOTE: Graceful shutdown is important for Cloud Run
    """
    logger.info("Gateway service shutting down...")


# ============================================================================
# RUN APPLICATION (for local development)
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    # CLOUD SCALING NOTE: In Cloud Run, uvicorn is started by the container
    # with optimized settings. This is only for local development.
    uvicorn.run(
        "gateway:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8080")),
        reload=True,  # Disable in production
        log_level="info",
    )
