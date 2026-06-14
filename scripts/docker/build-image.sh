#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_lib.sh
source "$SCRIPT_DIR/_lib.sh"

ENV_NAME="${1:?usage: $0 <local|dev|staging|prod>}"
require_env_name "$ENV_NAME"
require_env_files "$ENV_NAME"
load_compose_env "$ENV_NAME"

IMAGE_TAG="mycourse-fe:${ENV_NAME}"
echo "docker: building image ${IMAGE_TAG}..."
docker build \
  --build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:8080}" \
  --build-arg "NEXT_PUBLIC_STREAM_SSE_URL=${NEXT_PUBLIC_STREAM_SSE_URL:-}" \
  --build-arg "NEXT_PUBLIC_STREAM_WS_URL=${NEXT_PUBLIC_STREAM_WS_URL:-}" \
  --build-arg "NEXT_PUBLIC_STREAM_GRPC_BASE_URL=${NEXT_PUBLIC_STREAM_GRPC_BASE_URL:-}" \
  -t "$IMAGE_TAG" \
  -f "$REPO_ROOT/Dockerfile" \
  "$REPO_ROOT"
echo "docker: built ${IMAGE_TAG}"
