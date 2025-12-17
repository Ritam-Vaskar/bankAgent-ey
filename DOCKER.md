# Docker Deployment Guide

## Prerequisites

- Docker installed (version 20.10 or higher)
- Docker Compose installed (version 2.0 or higher)
- `.env.local` file with required environment variables

## Quick Start

### 1. Build the Docker Image

```bash
docker build -t bankagent:latest .
```

### 2. Run with Docker Compose

```bash
docker-compose up -d
```

### 3. Run without Docker Compose

```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env.local \
  --name bankagent-app \
  bankagent:latest
```

## Multi-Stage Build Explanation

The Dockerfile uses a 3-stage build process for optimization:

### Stage 1: Dependencies
- Uses Node.js 20 Alpine Linux
- Installs only production dependencies
- Uses pnpm for efficient package management

### Stage 2: Builder
- Copies dependencies from stage 1
- Builds the Next.js application
- Creates optimized production build

### Stage 3: Runner
- Minimal production image
- Runs as non-root user for security
- Only includes necessary files for running the app
- Significantly smaller image size

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Required variables:
- `MONGODB_URI`: MongoDB connection string
- `NEXTAUTH_URL`: Application URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET`: Secret key for NextAuth
- `GOOGLE_GEMINI_API_KEY`: Google Gemini API key
- `AZURE_STORAGE_CONNECTION_STRING`: Azure Blob Storage connection
- `AZURE_STORAGE_CONTAINER_NAME`: Azure container name

## Docker Commands

### Build
```bash
# Build the image
docker build -t bankagent:latest .

# Build with specific stage
docker build --target builder -t bankagent:builder .
```

### Run
```bash
# Run container
docker run -d -p 3000:3000 --env-file .env.local bankagent:latest

# Run with custom name
docker run -d -p 3000:3000 --name my-bankagent --env-file .env.local bankagent:latest
```

### Logs
```bash
# View logs
docker logs bankagent-app

# Follow logs
docker logs -f bankagent-app
```

### Stop/Remove
```bash
# Stop container
docker stop bankagent-app

# Remove container
docker rm bankagent-app

# Remove image
docker rmi bankagent:latest
```

## Docker Compose Commands

### Start
```bash
# Start services in detached mode
docker-compose up -d

# Start with build
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### Stop
```bash
# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Rebuild
```bash
# Rebuild specific service
docker-compose build bankagent

# Rebuild without cache
docker-compose build --no-cache
```

## Health Check

The application includes a health check endpoint at `/api/health`:

```bash
# Check health
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-17T12:00:00.000Z"
}
```

## Production Deployment

### 1. Build for production
```bash
docker build -t bankagent:v1.0.0 .
```

### 2. Tag for registry
```bash
docker tag bankagent:v1.0.0 your-registry/bankagent:v1.0.0
docker tag bankagent:v1.0.0 your-registry/bankagent:latest
```

### 3. Push to registry
```bash
docker push your-registry/bankagent:v1.0.0
docker push your-registry/bankagent:latest
```

### 4. Deploy
```bash
docker pull your-registry/bankagent:latest
docker run -d -p 3000:3000 --env-file .env.production your-registry/bankagent:latest
```

## Optimization Tips

1. **Layer Caching**: Dependencies are cached in separate stage
2. **Multi-stage Build**: Reduces final image size by ~70%
3. **Alpine Linux**: Minimal base image for smaller size
4. **Standalone Output**: Next.js standalone mode for minimal runtime
5. **Non-root User**: Security best practice
6. **Health Checks**: Automatic container health monitoring

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs bankagent-app

# Inspect container
docker inspect bankagent-app
```

### Port already in use
```bash
# Use different port
docker run -d -p 3001:3000 bankagent:latest
```

### Build failures
```bash
# Clear build cache
docker builder prune

# Rebuild without cache
docker build --no-cache -t bankagent:latest .
```

## Image Size Comparison

- **Without multi-stage**: ~1.5GB
- **With multi-stage**: ~200-300MB
- **Savings**: ~80% reduction

## Security Features

- ✅ Non-root user execution
- ✅ Minimal base image (Alpine)
- ✅ No unnecessary files in production
- ✅ Health check monitoring
- ✅ Environment variable isolation
- ✅ Layer caching for faster builds
