# ClubQore Deployment Guide

This document describes the automated deployment process for the ClubQore application using GitHub Actions, Docker, and Traefik.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         VPS Server                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐                                               │
│  │ Traefik  │ ──── SSL/TLS (Let's Encrypt)                 │
│  │ (Proxy)  │      Port 80/443                             │
│  └────┬─────┘                                               │
│       │                                                      │
│  ┌────┴─────────────────────────────────┐                  │
│  │                │                      │                  │
│  ▼                ▼                      ▼                  │
│ ┌─────────┐  ┌──────────┐      ┌──────────────┐           │
│ │Frontend │  │ Backend  │      │  PostgreSQL  │           │
│ │ (Nginx) │  │ (Node.js)│ ───▶ │  Database    │           │
│ └─────────┘  └──────────┘      └──────────────┘           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Environments

### Production
- **Frontend**: `https://app.clubqore.com`
- **Backend API**: `https://api.clubqore.com`
- **Trigger**: Push to `main` branch
- **Deploy Path**: `/root/clubqore`

### Staging
- **Frontend**: `https://staging.clubqore.com`
- **Backend API**: `https://api-staging.clubqore.com`
- **Trigger**: Pull request to `main` branch
- **Deploy Path**: `/root/clubqore-staging`

## Files Created

### Docker Configuration
1. **`backend/Dockerfile`** - Backend Node.js application container
2. **`frontend/Dockerfile`** - Frontend React/Vite multi-stage build
3. **`frontend/nginx.conf`** - Nginx configuration for SPA routing
4. **`docker-compose.prod.yml`** - Production environment setup
5. **`docker-compose.staging.yml`** - Staging environment setup

### CI/CD
6. **`.github/workflows/deploy.yml`** - Automated deployment workflow

## Required GitHub Secrets

Configure these secrets in your GitHub repository settings (`Settings → Secrets and variables → Actions`):

### Docker & VPS Access
- `DOCKER_USERNAME` - DockerHub username
- `DOCKER_TOKEN` - DockerHub access token
- `VPS_HOST` - VPS server hostname/IP
- `VPS_USERNAME` - SSH username for VPS (usually `root`)
- `SSH_PRIVATE_KEY` - SSH private key for VPS access

### Database (Both Environments)
- `POSTGRES_DB` - Database name (environment-specific)
- `POSTGRES_USER` - Database user (environment-specific)
- `POSTGRES_PASSWORD` - Database password (environment-specific)

**Note**: The `DATABASE_URL` is automatically constructed from the above variables in the Docker Compose files:
- Production: `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}`
- Staging: `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db-staging:5432/${POSTGRES_DB}`

### Application Configuration
- `JWT_SECRET` - JWT token secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `FRONTEND_URL` - Frontend URL (environment-specific)
  - Production: `https://app.clubqore.com`
  - Staging: `https://staging.clubqore.com`

### Email Configuration
- `EMAIL_PROVIDER` - Email provider (e.g., `smtp`, `gmail`, `sendgrid`)
- `EMAIL_USER` - Email username/account
- `EMAIL_PASSWORD` - Email password/API key
- `EMAIL_FROM_NAME` - Sender name (e.g., `ClubQore`)
- `EMAIL_FROM_EMAIL` - Sender email address

### SSL/Domain
- `ACME_EMAIL` - Email for Let's Encrypt SSL certificates

## Deployment Workflow

### Automatic Deployment

1. **On Pull Request to `main`**:
   - Builds Docker images
   - Pushes to DockerHub
   - Deploys to **staging** environment
   - Accessible at `staging.clubqore.com`

2. **On Push/Merge to `main`**:
   - Builds Docker images
   - Pushes to DockerHub
   - Deploys to **production** environment
   - Accessible at `app.clubqore.com`

### Deployment Steps

1. **Build**: Docker images are built for both backend and frontend
2. **Push**: Images are pushed to DockerHub with version tags
3. **Sync**: Docker Compose files are synced to VPS
4. **Deploy**: Containers are pulled and started on VPS
5. **Verify**: Health checks confirm successful deployment

## Manual Deployment

### Deploy to Production
```bash
ssh user@your-vps-host
cd /root/clubqore
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Deploy to Staging
```bash
ssh user@your-vps-host
cd /root/clubqore-staging
docker-compose -f docker-compose.staging.yml pull
docker-compose -f docker-compose.staging.yml up -d
```

### View Logs
```bash
# Production
docker-compose -f docker-compose.prod.yml logs -f

# Staging
docker-compose -f docker-compose.staging.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Database Migrations

Run migrations after deployment:

```bash
# SSH into the backend container
docker exec -it <container-id> sh

# Run migrations
npm run migrate:latest

# Run seeds (if needed)
npm run seed:run
```

## DNS Configuration

Configure these DNS records for your domain:

### Production
```
A     app.clubqore.com        → YOUR_VPS_IP
A     api.clubqore.com        → YOUR_VPS_IP
```

### Staging
```
A     staging.clubqore.com    → YOUR_VPS_IP
A     api-staging.clubqore.com → YOUR_VPS_IP
```

## SSL/TLS Certificates

Traefik automatically handles SSL certificates using Let's Encrypt:
- Certificates are stored in `./letsencrypt/acme.json`
- Auto-renewal is handled by Traefik
- HTTP to HTTPS redirect is enabled by default

## Monitoring & Health Checks

### Backend Health Check
```bash
curl https://api.clubqore.com/health
```

### Frontend Health Check
```bash
curl https://app.clubqore.com/health
```

### Docker Health Status
```bash
docker ps
docker-compose -f docker-compose.prod.yml ps
```

## Rollback Procedure

If a deployment fails, rollback to previous version:

```bash
# List available image tags
docker images | grep clubqore

# Update docker-compose to use specific version
export GITHUB_RUN_NUMBER=<previous-build-number>
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Restart service
docker-compose -f docker-compose.prod.yml restart backend
```

### Database connection issues
```bash
# Check if database is running
docker-compose -f docker-compose.prod.yml ps db

# Check database logs
docker-compose -f docker-compose.prod.yml logs db

# Test connection
docker exec -it <backend-container> sh
psql $DATABASE_URL
```

### SSL certificate issues
```bash
# Check Traefik logs
docker-compose -f docker-compose.prod.yml logs traefik

# Verify acme.json permissions
ls -la ./letsencrypt/acme.json
chmod 600 ./letsencrypt/acme.json
```

## Performance Optimization

### Build Cache
- Docker builds use layer caching for faster builds
- Registry cache is enabled for both backend and frontend

### Image Cleanup
- Old images are automatically cleaned up (older than 7 days)
- Manual cleanup: `docker image prune -a`

## Security Considerations

1. **Environment Variables**: Never commit `.env` files or secrets
2. **SSH Keys**: Use dedicated deploy keys with minimal permissions
3. **Database**: Use strong passwords and restrict network access
4. **SSL**: Automatic HTTPS redirect enabled
5. **Docker Images**: Built from official base images only

## Maintenance

### Update Dependencies
```bash
# Backend
cd backend && npm update

# Frontend
cd frontend && npm update
```

### Database Backups
```bash
# Create backup
docker exec <postgres-container> pg_dump -U user app > backup.sql

# Restore backup
docker exec -i <postgres-container> psql -U user app < backup.sql
```

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Review VPS logs via SSH
3. Check Docker container logs
4. Verify DNS configuration
5. Test SSL certificates

---

**Last Updated**: November 2024
**Maintained By**: ClubQore Team
