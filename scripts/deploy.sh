#!/usr/bin/env bash
# deploy.sh — Build Docker images and deploy to the target environment.
#
# Usage:
#   ./scripts/deploy.sh staging
#   ./scripts/deploy.sh production
#
# Make this file executable before use:
#   chmod +x scripts/deploy.sh
#
# Required environment variables (set in CI or locally):
#   GITHUB_TOKEN   — Personal access token with packages:write scope (for ghcr.io push)
#   GITHUB_ACTOR   — GitHub username / organisation (used as the registry namespace)
#   GITHUB_REPOSITORY_OWNER — lowercase org/user name on GitHub
#
# Optional:
#   IMAGE_TAG — Docker image tag to use (defaults to the short git SHA)

set -euo pipefail

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

log()  { echo "[deploy] $*"; }
err()  { echo "[deploy] ERROR: $*" >&2; }
die()  { err "$*"; exit 1; }

# ---------------------------------------------------------------------------
# Argument validation
# ---------------------------------------------------------------------------

ENVIRONMENT="${1:-}"

if [[ -z "$ENVIRONMENT" ]]; then
  die "No environment specified. Usage: $0 staging|production"
fi

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
  die "Invalid environment '${ENVIRONMENT}'. Must be 'staging' or 'production'."
fi

log "Target environment: ${ENVIRONMENT}"

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_TAG="${IMAGE_TAG:-$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo "latest")}"
REGISTRY="ghcr.io"
OWNER="${GITHUB_REPOSITORY_OWNER:-$(git -C "$REPO_ROOT" remote get-url origin | sed 's|.*github.com[:/]\([^/]*\)/.*|\1|' | tr '[:upper:]' '[:lower:]')}"
REPO_NAME="$(basename "$(git -C "$REPO_ROOT" remote get-url origin)" .git | tr '[:upper:]' '[:lower:]')"

BACKEND_IMAGE="${REGISTRY}/${OWNER}/${REPO_NAME}-backend"
FRONTEND_IMAGE="${REGISTRY}/${OWNER}/${REPO_NAME}-frontend"

log "Registry   : ${REGISTRY}"
log "Image tag  : ${IMAGE_TAG}"
log "Backend    : ${BACKEND_IMAGE}:${IMAGE_TAG}"
log "Frontend   : ${FRONTEND_IMAGE}:${IMAGE_TAG}"

# ---------------------------------------------------------------------------
# Step 1 — Build Docker images
# ---------------------------------------------------------------------------

log "Building Docker images..."

docker build \
  --file "${REPO_ROOT}/images/backend/Dockerfile" \
  --tag "${BACKEND_IMAGE}:${IMAGE_TAG}" \
  --tag "${BACKEND_IMAGE}:latest" \
  "${REPO_ROOT}/backend"

docker build \
  --file "${REPO_ROOT}/images/frontend/Dockerfile" \
  --tag "${FRONTEND_IMAGE}:${IMAGE_TAG}" \
  --tag "${FRONTEND_IMAGE}:latest" \
  "${REPO_ROOT}/frontend"

log "Build complete."

# ---------------------------------------------------------------------------
# Step 2 — Log in to ghcr.io and push images
# ---------------------------------------------------------------------------

log "Logging in to ${REGISTRY}..."
# replace with your login command if not using GITHUB_TOKEN
echo "${GITHUB_TOKEN:-}" | docker login "${REGISTRY}" --username "${GITHUB_ACTOR:-${OWNER}}" --password-stdin

log "Pushing images to ${REGISTRY}..."

# replace with your push command
docker push "${BACKEND_IMAGE}:${IMAGE_TAG}"
docker push "${BACKEND_IMAGE}:latest"

# replace with your push command
docker push "${FRONTEND_IMAGE}:${IMAGE_TAG}"
docker push "${FRONTEND_IMAGE}:latest"

log "Images pushed successfully."

# ---------------------------------------------------------------------------
# Step 3 — Deploy to the target environment
# ---------------------------------------------------------------------------

log "Deploying to ${ENVIRONMENT}..."

if [[ "$ENVIRONMENT" == "staging" ]]; then
  # replace with your staging deploy command
  # e.g.: kubectl set image deployment/backend backend="${BACKEND_IMAGE}:${IMAGE_TAG}" -n staging
  # e.g.: fly deploy --image "${BACKEND_IMAGE}:${IMAGE_TAG}" --app northstar-backend-staging
  echo "[deploy] replace with your staging deploy command"

elif [[ "$ENVIRONMENT" == "production" ]]; then
  # replace with your production deploy command
  # e.g.: kubectl set image deployment/backend backend="${BACKEND_IMAGE}:${IMAGE_TAG}" -n production
  # e.g.: fly deploy --image "${BACKEND_IMAGE}:${IMAGE_TAG}" --app northstar-backend-production
  echo "[deploy] replace with your production deploy command"
fi

# ---------------------------------------------------------------------------
# Step 4 — Health check
# ---------------------------------------------------------------------------

log "Running health check..."

# replace BASE_URL with the real URL of your deployed service
# e.g., BASE_URL="https://api-staging.northstar.example.com"
BASE_URL="${HEALTH_CHECK_URL:-http://localhost:8080}"

MAX_RETRIES=10
RETRY_DELAY=10

for i in $(seq 1 "${MAX_RETRIES}"); do
  STATUS=$(curl --silent --output /dev/null --write-out "%{http_code}" \
    "${BASE_URL}/api/v1/health" || true)

  if [[ "$STATUS" == "200" ]]; then
    log "Health check passed (HTTP ${STATUS}) after ${i} attempt(s)."
    break
  fi

  if [[ "$i" -eq "${MAX_RETRIES}" ]]; then
    die "Health check failed after ${MAX_RETRIES} attempts (last status: HTTP ${STATUS})."
  fi

  log "Attempt ${i}/${MAX_RETRIES}: HTTP ${STATUS} — retrying in ${RETRY_DELAY}s..."
  sleep "${RETRY_DELAY}"
done

log "Deployment to ${ENVIRONMENT} complete."
