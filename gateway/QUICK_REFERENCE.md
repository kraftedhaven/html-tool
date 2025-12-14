# FastAPI Gateway - Quick Reference

## Quick Start

```bash
# Install and run
cd gateway
pip install -r requirements.txt
python gateway.py
```

## Authentication

### Get JWT Token
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Using JWT Token
```bash
curl -X POST http://localhost:8080/ENDPOINT \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### Using API Key
```bash
curl -X POST http://localhost:8080/ENDPOINT \
  -H "X-API-Key: dev-api-key-1" \
  -H "Content-Type: application/json"
```

## Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | No | API information |
| `/health` | GET | No | Health check |
| `/status` | GET | No | Service status |
| `/docs` | GET | No | Interactive API docs |
| `/auth/login` | POST | No | Get JWT token |
| `/auth/verify` | POST | Yes | Verify auth |
| `/upload` | POST | Yes | Upload images |
| `/generate-listing` | POST | Yes | Generate listing |
| `/syndicate` | POST | Yes | Syndicate to marketplaces |
| `/research` | POST | Yes | Market research |

## Example Requests

### Upload Images
```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:8080/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@product1.jpg" \
  -F "files=@product2.jpg"
```

### Generate Listing
```bash
curl -X POST http://localhost:8080/generate-listing \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Vintage Nike Sneakers Size 10",
    "description": "Excellent condition, original box",
    "categoryName": "Athletic Shoes"
  }'
```

### Syndicate to eBay
```bash
curl -X POST http://localhost:8080/syndicate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listings": [
      {
        "sku": "SKU001",
        "title": "Product Title",
        "description": "Product description",
        "price": "29.99",
        "categoryId": "12345",
        "brand": "Nike",
        "size": "10",
        "color": "Black",
        "imageUrls": ["https://..."]
      }
    ]
  }'
```

### Market Research
```bash
curl -X POST http://localhost:8080/research \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "vintage nike sneakers",
    "categoryId": "12345"
  }'
```

## Environment Variables

```bash
# Required
export API_SECRET_KEY="your-secret-key"
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="secure-password"

# Optional
export VALID_API_KEYS="key1,key2,key3"
export ALLOWED_ORIGINS="http://localhost:3000"
export UPLOAD_SERVICE_URL="http://localhost:3000/api/analyze-images"
export GENERATE_LISTING_SERVICE_URL="http://localhost:3000/api/insights"
export SYNDICATE_SERVICE_URL="http://localhost:3000/api/bulk-upload-ebay"
export RESEARCH_SERVICE_URL="http://localhost:3000/api/ebay/str"
```

## Docker

```bash
# Build
docker build -t gateway .

# Run
docker run -p 8080:8080 \
  -e API_SECRET_KEY=secret \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=pass \
  gateway
```

## Cloud Run

```bash
# Deploy
gcloud run deploy gateway \
  --image gcr.io/PROJECT/gateway \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets "API_SECRET_KEY=api-secret:latest"
```

## Common Issues

### 401 Unauthorized
- Check token is valid and not expired
- Verify API key is in VALID_API_KEYS
- Ensure Authorization header is correct

### 502 Bad Gateway
- Verify microservice URLs are accessible
- Check REQUEST_TIMEOUT setting
- Ensure backend services are running

### CORS Errors
- Update ALLOWED_ORIGINS environment variable
- Check browser console for details

## Links

- **Full Documentation**: [README.md](README.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Interactive API Docs**: http://localhost:8080/docs
- **Alternative Docs**: http://localhost:8080/redoc
