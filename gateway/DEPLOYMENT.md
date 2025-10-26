# Deployment Guide for FastAPI Gateway

This guide provides detailed instructions for deploying the FastAPI Gateway to various platforms.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Google Cloud Run Deployment](#google-cloud-run-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Monitoring and Logging](#monitoring-and-logging)
6. [Scaling and Performance](#scaling-and-performance)

---

## Local Development

### Prerequisites
- Python 3.11 or higher
- pip or pipenv

### Setup

1. **Navigate to gateway directory**
   ```bash
   cd gateway
   ```

2. **Create virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run the application**
   ```bash
   python gateway.py
   # Or using uvicorn directly:
   uvicorn gateway:app --reload --port 8080
   ```

6. **Access the API**
   - API: http://localhost:8080
   - Interactive docs: http://localhost:8080/docs
   - Alternative docs: http://localhost:8080/redoc
   - Health check: http://localhost:8080/health

---

## Docker Deployment

### Build Docker Image

```bash
cd gateway
docker build -t html-tool-gateway:latest .
```

### Run Container Locally

**Basic run:**
```bash
docker run -p 8080:8080 html-tool-gateway:latest
```

**With environment variables:**
```bash
docker run -p 8080:8080 \
  -e API_SECRET_KEY=your-secret-key \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=secure-password \
  -e UPLOAD_SERVICE_URL=http://host.docker.internal:3000/api/analyze-images \
  -e ALLOWED_ORIGINS=http://localhost:3000 \
  html-tool-gateway:latest
```

**With environment file:**
```bash
docker run -p 8080:8080 --env-file .env html-tool-gateway:latest
```

**Background mode with restart policy:**
```bash
docker run -d \
  --name gateway \
  --restart unless-stopped \
  -p 8080:8080 \
  --env-file .env \
  html-tool-gateway:latest
```

### Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  gateway:
    build: .
    ports:
      - "8080:8080"
    environment:
      - ENVIRONMENT=production
      - API_SECRET_KEY=${API_SECRET_KEY}
      - ADMIN_USERNAME=${ADMIN_USERNAME}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - UPLOAD_SERVICE_URL=${UPLOAD_SERVICE_URL}
      - GENERATE_LISTING_SERVICE_URL=${GENERATE_LISTING_SERVICE_URL}
      - SYNDICATE_SERVICE_URL=${SYNDICATE_SERVICE_URL}
      - RESEARCH_SERVICE_URL=${RESEARCH_SERVICE_URL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s
```

Run with Docker Compose:
```bash
docker-compose up -d
```

---

## Google Cloud Run Deployment

### Prerequisites
- Google Cloud SDK installed
- GCP project created
- Billing enabled
- APIs enabled: Cloud Run, Artifact Registry, Secret Manager

### Step-by-Step Deployment

#### 1. Set up environment

```bash
# Set your GCP project ID
export PROJECT_ID=your-project-id
export REGION=us-central1
export SERVICE_NAME=html-tool-gateway

# Set project
gcloud config set project $PROJECT_ID
```

#### 2. Enable required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

#### 3. Create Artifact Registry repository

```bash
gcloud artifacts repositories create html-tool-repo \
  --repository-format=docker \
  --location=$REGION \
  --description="html-tool containers"
```

#### 4. Configure Docker authentication

```bash
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

#### 5. Build and push Docker image

```bash
cd gateway

# Build image
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/html-tool-repo/gateway:latest .

# Push image
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/html-tool-repo/gateway:latest
```

#### 6. Create secrets in Secret Manager

```bash
# Create API secret key
echo -n "your-super-secret-key-here" | \
  gcloud secrets create api-secret-key --data-file=-

# Create admin credentials
echo -n "admin" | gcloud secrets create admin-username --data-file=-
echo -n "your-admin-password" | gcloud secrets create admin-password --data-file=-

# Create API keys
echo -n "api-key-1,api-key-2" | gcloud secrets create valid-api-keys --data-file=-
```

#### 7. Deploy to Cloud Run

```bash
gcloud run deploy $SERVICE_NAME \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/html-tool-repo/gateway:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "ENVIRONMENT=production" \
  --set-secrets "API_SECRET_KEY=api-secret-key:latest,ADMIN_USERNAME=admin-username:latest,ADMIN_PASSWORD=admin-password:latest,VALID_API_KEYS=valid-api-keys:latest" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80 \
  --timeout 60 \
  --port 8080
```

#### 8. Configure service URLs

After deploying the backend microservices, update the gateway with their URLs:

```bash
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --update-env-vars \
    UPLOAD_SERVICE_URL=https://upload-service-xxxxx-uc.a.run.app/api/analyze-images,\
    GENERATE_LISTING_SERVICE_URL=https://listing-service-xxxxx-uc.a.run.app/api/insights,\
    SYNDICATE_SERVICE_URL=https://syndicate-service-xxxxx-uc.a.run.app/api/bulk-upload-ebay,\
    RESEARCH_SERVICE_URL=https://research-service-xxxxx-uc.a.run.app/api/ebay/str
```

#### 9. Get the service URL

```bash
gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(status.url)'
```

### Advanced Cloud Run Configuration

#### Custom domain mapping

```bash
gcloud run domain-mappings create \
  --service $SERVICE_NAME \
  --domain api.yourdomain.com \
  --region $REGION
```

#### Set up CORS for specific domains

```bash
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --update-env-vars ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Configure Cloud Armor (DDoS protection)

```bash
# Create security policy
gcloud compute security-policies create gateway-security-policy \
  --description "Security policy for gateway"

# Add rate limiting rule
gcloud compute security-policies rules create 1000 \
  --security-policy gateway-security-policy \
  --expression "true" \
  --action "rate-based-ban" \
  --rate-limit-threshold-count 100 \
  --rate-limit-threshold-interval-sec 60 \
  --ban-duration-sec 300
```

---

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ENVIRONMENT` | Deployment environment | `production` |
| `PORT` | Server port | `8080` |
| `API_SECRET_KEY` | JWT signing secret | `your-random-secret-key` |
| `ADMIN_USERNAME` | Admin username | `admin` |
| `ADMIN_PASSWORD` | Admin password | `SecureP@ssw0rd` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VALID_API_KEYS` | Comma-separated API keys | `dev-api-key-1,dev-api-key-2` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `*` |
| `REQUEST_TIMEOUT` | Proxy timeout in seconds | `30` |
| `UPLOAD_SERVICE_URL` | Upload service endpoint | - |
| `GENERATE_LISTING_SERVICE_URL` | Listing service endpoint | - |
| `SYNDICATE_SERVICE_URL` | Syndication service endpoint | - |
| `RESEARCH_SERVICE_URL` | Research service endpoint | - |

---

## Monitoring and Logging

### Cloud Run Logging

View logs:
```bash
gcloud run services logs read $SERVICE_NAME \
  --region $REGION \
  --limit 50
```

Stream logs:
```bash
gcloud run services logs tail $SERVICE_NAME \
  --region $REGION
```

### Log-based Metrics

Create a log-based metric for failed requests:

```bash
gcloud logging metrics create gateway_errors \
  --description="Count of gateway error responses" \
  --log-filter='resource.type="cloud_run_revision"
    resource.labels.service_name="html-tool-gateway"
    jsonPayload.status_code>=400'
```

### Alerting

Create an alert policy:

```bash
gcloud alpha monitoring policies create \
  --notification-channels=$CHANNEL_ID \
  --display-name="Gateway High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=60s
```

### Cloud Trace

Enable request tracing for performance monitoring:

```bash
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --update-labels tracing=enabled
```

---

## Scaling and Performance

### Recommended Settings by Workload

#### Light Traffic (< 1000 req/hour)
```bash
--min-instances 0
--max-instances 5
--memory 256Mi
--cpu 1
--concurrency 80
```

#### Medium Traffic (1000-10000 req/hour)
```bash
--min-instances 1
--max-instances 20
--memory 512Mi
--cpu 1
--concurrency 100
```

#### High Traffic (> 10000 req/hour)
```bash
--min-instances 3
--max-instances 50
--memory 1Gi
--cpu 2
--concurrency 100
```

### Performance Tuning

1. **Adjust concurrency** based on request characteristics:
   - CPU-intensive: 50-80
   - I/O-intensive: 100-200
   - Mixed: 80-100

2. **Memory allocation**:
   - Start with 512Mi
   - Monitor usage and adjust
   - Consider 1Gi for heavy workloads

3. **CPU allocation**:
   - 1 vCPU sufficient for most cases
   - 2 vCPUs for CPU-intensive operations

4. **Startup optimization**:
   - Use min-instances > 0 to keep instances warm
   - Implement caching where appropriate
   - Minimize startup dependencies

### Cost Optimization

```bash
# Enable CPU throttling when idle
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --cpu-throttling

# Set minimum instances to 0 for cost savings
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --min-instances 0
```

---

## Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy-gateway.yml`:

```yaml
name: Deploy Gateway to Cloud Run

on:
  push:
    branches:
      - main
    paths:
      - 'gateway/**'

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: us-central1
  SERVICE_NAME: html-tool-gateway

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Google Auth
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1

      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build and Push
        run: |
          cd gateway
          docker build -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/html-tool-repo/gateway:${{ github.sha }} .
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/html-tool-repo/gateway:${{ github.sha }}

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy ${{ env.SERVICE_NAME }} \
            --image ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/html-tool-repo/gateway:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed
```

---

## Troubleshooting

### Common Issues

#### 1. Service not starting
```bash
# Check logs
gcloud run services logs read $SERVICE_NAME --region $REGION --limit 50

# Check service status
gcloud run services describe $SERVICE_NAME --region $REGION
```

#### 2. Authentication errors
```bash
# Verify secrets are accessible
gcloud secrets versions access latest --secret=api-secret-key

# Check service account permissions
gcloud run services get-iam-policy $SERVICE_NAME --region $REGION
```

#### 3. High latency
```bash
# Check Cloud Trace
gcloud trace list --limit 10

# Review Cloud Monitoring metrics
gcloud monitoring dashboards list
```

#### 4. Connection issues to backend services
```bash
# Test from Cloud Shell
curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  https://your-service-url/health
```

---

## Security Best Practices

1. **Use Secret Manager** for all sensitive data
2. **Enable VPC Connector** for private service communication
3. **Implement rate limiting** to prevent abuse
4. **Use Cloud Armor** for DDoS protection
5. **Enable Cloud Identity-Aware Proxy** for additional security layer
6. **Regular security audits** using Cloud Security Command Center
7. **Keep dependencies updated** to patch vulnerabilities
8. **Use least privilege IAM roles** for service accounts

---

## Support

For issues and questions:
- Check the main [README.md](README.md)
- Review Cloud Run documentation: https://cloud.google.com/run/docs
- Check application logs for error messages
