#!/usr/bin/env bash
# Swarm stack deploy helper — demo only. DO NOT run during automated tests.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_lib.sh
source "$SCRIPT_DIR/_lib.sh"

ENV_NAME="${1:?usage: $0 <local|dev|staging|prod>}"
require_env_name "$ENV_NAME"
require_env_files "$ENV_NAME"

STACK_NAME="mycourse-fe-${ENV_NAME}"
STACK_FILE="$(stack_file "$ENV_NAME")"

if ! docker info 2>/dev/null | grep -q 'Swarm: active'; then
  echo "swarm-deploy: Swarm is not active. Run 'docker swarm init' first." >&2
  exit 1
fi

echo "swarm-deploy: deploying stack ${STACK_NAME}..."
docker stack deploy -c "$STACK_FILE" "$STACK_NAME"
echo "swarm-deploy: done."
