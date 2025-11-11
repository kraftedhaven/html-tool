# Copilot Instructions for HTML Tool (Neural Listing Engine)

## Project Overview

This is a Neural Listing Engine designed for product analysis and eBay listing automation. The application uses AI to analyze product data and generate optimized eBay listings.

### Purpose
- Analyze product images and data using AI (OpenAI)
- Generate optimized eBay listings
- Manage product inventory
- Provide analytics and insights for listings

### Architecture
This is a full-stack application with:
- **Frontend**: React + TypeScript + Vite (SPA)
- **Backend API**: Node.js + Express.js
- **Cloud Deployments**: Azure Functions, Azure Static Web Apps, Vercel
- **Databases**: Redis (for production inventory), JSON file fallback (for local dev)
- **Analytics**: Mixpanel, Customer.io

## Technology Stack

### Frontend (`/frontend`)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7.x
- **Routing**: React Router DOM v6
- **Styling**: CSS3, HTML5
- **Payment**: Stripe React integration
- **File Upload**: react-dropzone
- **Linting**: ESLint 9 with TypeScript ESLint

### Backend (`/api`)
- **Runtime**: Node.js (ES modules)
- **Framework**: Express.js 4.x
- **AI Integration**: OpenAI API
- **File Uploads**: Multer
- **Validation**: Zod schemas
- **Rate Limiting**: express-rate-limit
- **Storage**: Redis (production) or JSON file (development)

### Cloud Functions
- **Azure Functions** (`/azure-functions`): Serverless backend deployment
- **Firebase Functions** (`/functions`): Alternative serverless deployment

## Project Structure

```
/
├── api/                    # Main Express API server
│   ├── index.js           # Main API routes and server logic
│   ├── inventory-store.js # Inventory persistence (Redis/JSON)
│   ├── analytics.js       # Mixpanel integration
│   ├── customerio.js      # Customer.io integration
│   └── validation.js      # Zod validation schemas
├── frontend/              # React frontend application
│   ├── src/              # React components and logic
│   ├── public/           # Static assets
│   ├── site/             # Additional site components/MCP agent
│   └── vite.config.ts    # Vite configuration
├── azure-functions/       # Azure Functions deployment
├── functions/             # Firebase Functions deployment
├── gateway/               # API gateway configuration
├── infrastructure/        # Infrastructure as Code (Azure Bicep)
├── .github/
│   ├── workflows/        # CI/CD pipelines
│   └── DEPLOYMENT.md     # Deployment instructions
├── package.json          # Root package configuration
└── server.js            # Alternative server entry point
```

## Build, Lint, and Test Instructions

### Prerequisites
- Node.js 18.x or higher
- npm (comes with Node.js)

### Root Level
```bash
# Install dependencies
npm install

# Start the API server
npm start

# Start alternative server
npm run start:server

# Build the entire project (includes frontend)
npm run build
```

### Frontend (`/frontend`)
```bash
cd frontend

# Install dependencies
npm ci

# Start development server (with HMR)
npm run dev

# Build for production
npm run build

# Type-check TypeScript
tsc -b

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Azure Functions (`/azure-functions`)
```bash
cd azure-functions

# Install dependencies
npm ci

# Build if build script exists
npm run build

# Test (unit tests available)
npm test
```

### Linting
- Frontend uses ESLint 9 with TypeScript ESLint plugin
- Run `npm run lint` in the `/frontend` directory before committing
- ESLint configuration is in `eslint.config.js`

### Testing
- Limited test infrastructure currently exists
- One test file found: `azure-functions/src/functions/analytics.test.js`
- When adding tests, follow existing patterns in the codebase

## Coding Standards

### General Guidelines
1. **Language**: Use JavaScript ES modules (ESM) for backend, TypeScript for frontend
2. **Module System**: All files use ES6 import/export syntax (`type: "module"`)
3. **Code Style**: Follow existing patterns in the codebase
4. **Comments**: Add comments only when necessary to explain complex logic

### TypeScript (Frontend)
- Use strict TypeScript configuration
- Define proper types for props, state, and API responses
- Avoid using `any` type unless absolutely necessary
- Follow React best practices (hooks, functional components)

### JavaScript (Backend)
- Use async/await for asynchronous operations
- Implement proper error handling with try/catch blocks
- Use environment variables for configuration (via dotenv)
- Validate all user inputs using Zod schemas

### Security
- Never commit secrets or API keys to the repository
- Use environment variables for sensitive data (`.env` file, not tracked in git)
- Implement rate limiting on API endpoints
- Validate and sanitize all user inputs
- Use proper authentication for admin routes

### API Development
- All admin routes must use `authenticateAdmin` middleware
- Implement rate limiting for public endpoints
- Use Zod schemas for request validation (see `api/validation.js`)
- Return consistent JSON error responses
- Use appropriate HTTP status codes

### File Uploads
- Maximum file size: 4 MB per file
- Use Multer for file handling
- Store files in memory buffer for processing
- Validate file types before processing

## Environment Variables

### Required for API
- `ADMIN_USERNAME`: Admin authentication username
- `ADMIN_PASSWORD`: Admin authentication password
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `REDIS_URL` (optional): Redis connection URL for production
- `MIXPANEL_TOKEN` (optional): Mixpanel analytics token
- `CUSTOMERIO_SITE_ID` (optional): Customer.io site ID
- `CUSTOMERIO_API_KEY` (optional): Customer.io API key

### Required for Frontend Build
- `VITE_API_BASE_URL`: Base URL for API calls
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key

## Deployment

### Available Deployment Targets
1. **Azure Static Web Apps** + **Azure Functions**
2. **Vercel**
3. **Firebase**

### CI/CD Workflows
The repository includes GitHub Actions workflows:
- `azure-functions.yml`: Deploy Azure Functions
- `azure-static-web-apps.yml`: Deploy Static Web App
- `frontend-ci.yml`: Frontend CI pipeline
- `fullstack-deploy.yml`: Full-stack deployment
- `vercel-deploy.yml`: Vercel deployment

See `.github/DEPLOYMENT.md` for detailed deployment instructions.

## Key Constraints and Requirements

### When Making Changes

1. **Minimal Changes**: Make the smallest possible changes to achieve the goal
2. **Don't Break Existing Functionality**: 
   - Test changes locally before committing
   - Run linters and builds
   - Verify API endpoints still work
3. **Security First**:
   - Never expose secrets or credentials
   - Always validate user inputs
   - Maintain rate limiting on public endpoints
4. **Documentation**: Update relevant README files when changing functionality
5. **Dependencies**: Only add new dependencies when absolutely necessary
6. **Type Safety**: Maintain TypeScript type safety in frontend code

### Files to Avoid Modifying (Unless Specifically Tasked)
- `package-lock.json` files (except when adding/updating dependencies)
- `.github/workflows/*.yml` (CI/CD pipelines)
- `infrastructure/main.bicep` (Infrastructure as Code)
- Build output directories (`dist/`, `node_modules/`)

### Critical Business Logic
- **Product Analysis**: Uses OpenAI Vision API for image analysis
- **Inventory Management**: Supports Redis (production) and JSON file (dev)
- **Authentication**: Simple username/password for admin routes
- **Rate Limiting**: Configured at 300 requests per 15 minutes globally

## Testing Your Changes

### Before Committing
1. **Frontend Changes**:
   ```bash
   cd frontend
   npm run lint
   npm run build
   ```

2. **Backend Changes**:
   - Start the API server: `npm start`
   - Test affected endpoints manually or with curl/Postman
   - Verify environment variables are properly configured

3. **Full Stack Changes**:
   - Test end-to-end workflows
   - Verify frontend can communicate with backend
   - Check browser console for errors

### Manual Testing
- Use the development server (`npm run dev` in frontend)
- Test with real product images if working on AI features
- Verify API responses match expected formats
- Check rate limiting behavior on public endpoints

## Common Tasks

### Adding a New API Endpoint
1. Add route handler in `api/index.js`
2. Create Zod validation schema in `api/validation.js` if needed
3. Add rate limiting if it's a public endpoint
4. Use `authenticateAdmin` middleware for admin-only routes
5. Update frontend to call the new endpoint
6. Test the endpoint manually

### Adding a New Frontend Component
1. Create component in `frontend/src/`
2. Use TypeScript with proper type definitions
3. Follow existing component patterns (functional components with hooks)
4. Import and use in the appropriate parent component
5. Test in development mode with `npm run dev`
6. Lint with `npm run lint`

### Updating Dependencies
1. Update `package.json` with the new version
2. Run `npm install` to update `package-lock.json`
3. Test that the application still builds and runs
4. Check for breaking changes in dependency documentation

## Additional Notes

- The project uses multiple deployment strategies (Azure, Vercel, Firebase)
- Analytics are tracked through Mixpanel and Customer.io
- The frontend has a secondary `site/` subdirectory with MCP agent components
- Server logs are written to `server.out.log` and `server.err.log`

## Getting Help

For deployment issues, refer to:
- `.github/DEPLOYMENT.md` - Azure deployment guide
- `AZURE_DEPLOYMENT.md` - Detailed Azure deployment steps
- `DEPLOYMENT.md` - General deployment guide

For security concerns, refer to:
- `SECURITY.md` - Security policies and reporting
