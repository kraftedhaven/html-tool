# FastAPI Gateway Microservice

A production-ready API gateway for the html-tool microservices ecosystem. This gateway provides unified authentication, request logging, and intelligent routing to internal services.

## Features

- **Authentication**: Supports both JWT Bearer tokens and API keys
- **Request Logging**: Comprehensive audit trail of all requests and responses
- **Service Proxy**: Routes requests to appropriate microservices
- **Health Checks**: Built-in health endpoints for monitoring
- **CORS Support**: Configurable cross-origin resource sharing
- **Cloud-Ready**: Optimized for Google Cloud Run deployment

## Endpoints

### Authentication
- `POST /auth/login` - Authenticate and receive JWT token
- `POST /auth/verify` - Verify authentication credentials

### Gateway Services
- `POST /upload` - Upload and analyze product images
- `POST /generate-listing` - Generate optimized product listings
- `POST /syndicate` - Syndicate listings to marketplaces
- `POST /research` - Perform market research
- `GET /status` - Get service health status

### Documentation
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)
- `GET /health` - Health check endpoint

## Quick Start

### Local Development

1. **Install Dependencies**
   ```bash
   cd gateway
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run the Gateway**
   ```bash
   python gateway.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn gateway:app --reload --port 8080
   ```

4. **Access the API**
   - API: http://localhost:8080
   - Docs: http://localhost:8080/docs
   - Health: http://localhost:8080/health

### Docker Deployment

1. **Build Docker Image**
   ```bash
   docker build -t html-tool-gateway .
   ```

2. **Run Container**
   ```bash
   docker run -p 8080:8080 \
     -e API_SECRET_KEY=your-secret-key \
     -e ADMIN_USERNAME=admin \
     -e ADMIN_PASSWORD=admin123 \
     html-tool-gateway
   ```

### Google Cloud Run Deployment

1. **Build and Push to Container Registry**
   ```bash
   # Set your project ID
   export PROJECT_ID=your-gcp-project-id
   export REGION=us-central1
   
   # Build and push to Artifact Registry
   gcloud builds submit --tag gcr.io/${PROJECT_ID}/html-tool-gateway
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy html-tool-gateway \
     --image gcr.io/${PROJECT_ID}/html-tool-gateway \
     --platform managed \
     --region ${REGION} \
     --allow-unauthenticated \
     --set-env-vars "ENVIRONMENT=production" \
     --set-secrets "API_SECRET_KEY=api-secret-key:latest" \
     --memory 512Mi \
     --cpu 1 \
     --min-instances 0 \
     --max-instances 10 \
     --concurrency 80
   ```

3. **Configure Environment Variables**
   ```bash
   gcloud run services update html-tool-gateway \
     --update-env-vars UPLOAD_SERVICE_URL=https://upload-service-url,GENERATE_LISTING_SERVICE_URL=https://listing-service-url
   ```

## Authentication

The gateway supports two authentication methods:

### 1. JWT Bearer Token

First, obtain a token:
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

Use the token in subsequent requests:
```bash
curl -X POST http://localhost:8080/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "files=@image1.jpg"
```

### 2. API Key

Use an API key in the `X-API-Key` header:
```bash
curl -X POST http://localhost:8080/upload \
  -H "X-API-Key: dev-api-key-1" \
  -F "files=@image1.jpg"
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Deployment environment | `development` |
| `PORT` | Server port | `8080` |
| `API_SECRET_KEY` | JWT signing secret | `dev-secret-key-change-in-production` |
| `ADMIN_USERNAME` | Admin username | `admin` |
| `ADMIN_PASSWORD` | Admin password | `admin123` |
| `VALID_API_KEYS` | Comma-separated API keys | `dev-api-key-1,dev-api-key-2` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `*` |
| `REQUEST_TIMEOUT` | Proxy request timeout (seconds) | `30` |
| `UPLOAD_SERVICE_URL` | Upload microservice URL | - |
| `GENERATE_LISTING_SERVICE_URL` | Listing generation service URL | - |
| `SYNDICATE_SERVICE_URL` | Syndication service URL | - |
| `RESEARCH_SERVICE_URL` | Research service URL | - |

## Example Usage

### Upload and Analyze Images

```bash
# Using JWT token
curl -X POST http://localhost:8080/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@product1.jpg" \
  -F "files=@product2.jpg"
```

### Generate Listing

```bash
curl -X POST http://localhost:8080/generate-listing \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Vintage Nike Sneakers",
    "description": "Size 10, excellent condition",
    "categoryName": "Shoes"
  }'
```

### Syndicate to eBay

```bash
curl -X POST http://localhost:8080/syndicate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listings": [
      {
        "sku": "SKU001",
        "title": "Product Title",
        "description": "Product description",
        "price": "29.99",
        "categoryId": "12345"
      }
    ]
  }'
```

### Market Research

```bash
curl -X POST http://localhost:8080/research \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "vintage nike sneakers",
    "categoryId": "12345"
  }'
```

### Check Status

```bash
curl http://localhost:8080/status
```

## Monitoring & Logging

### Request Logging

All requests and responses are logged in JSON format for easy parsing and analysis:

```json
{
  "timestamp": "2025-10-26T00:00:00.000Z",
  "level": "INFO",
  "message": "REQUEST: {\"request_id\": \"...\", \"method\": \"POST\", \"url\": \"...\", ...}"
}
```

### Cloud Run Monitoring

When deployed to Cloud Run, logs are automatically sent to Cloud Logging where you can:
- View real-time logs
- Set up log-based metrics
- Create alerts for errors
- Export logs to BigQuery for analysis

## Scaling Considerations

The gateway is designed for horizontal scaling:

- **Stateless**: No session state stored in memory
- **Fast Startup**: Minimal initialization time
- **Graceful Shutdown**: Handles in-flight requests during shutdown
- **Health Checks**: Supports Cloud Run liveness probes
- **Configurable Concurrency**: Adjust based on workload

### Recommended Cloud Run Settings

- **Min Instances**: 0 (scale to zero for cost savings)
- **Max Instances**: 10+ (based on expected load)
- **Memory**: 512Mi - 1Gi
- **CPU**: 1 vCPU
- **Concurrency**: 80-100 requests per instance
- **Timeout**: 60 seconds (adjust based on backend services)

## Security Best Practices

1. **Change Default Secrets**: Update `API_SECRET_KEY`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD`
2. **Use Secret Manager**: Store secrets in Cloud Secret Manager (production)
3. **Rotate API Keys**: Implement regular API key rotation
4. **Restrict CORS**: Configure `ALLOWED_ORIGINS` to specific domains
5. **Use HTTPS**: Always use SSL/TLS in production (Cloud Run provides this)
6. **Rate Limiting**: Consider implementing rate limiting for public endpoints
7. **Input Validation**: All inputs are validated via Pydantic models

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Code Quality

```bash
# Format code
black gateway.py

# Lint code
flake8 gateway.py
pylint gateway.py

# Type checking
mypy gateway.py
```

## Troubleshooting

### Common Issues

1. **Connection Refused to Microservices**
   - Verify microservice URLs in environment variables
   - Check network connectivity
   - Ensure microservices are running

2. **Authentication Errors**
   - Verify JWT secret key matches across services
   - Check token expiration
   - Validate API keys in environment

3. **Timeout Errors**
   - Increase `REQUEST_TIMEOUT` for slow services
   - Check microservice health
   - Consider async processing for long operations

4. **CORS Errors**
   - Update `ALLOWED_ORIGINS` environment variable
   - Check browser console for specific CORS issues

## Contributing

1. Follow PEP 8 style guidelines
2. Add tests for new features
3. Update documentation
4. Use type hints for function signatures

## License

Part of the html-tool project.
