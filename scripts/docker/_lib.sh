#!/usr/bin/env bash
# Shared helpers for fe-mycourse docker/ scripts.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

VALID_ENVS=(local dev staging prod)

usage_envs() {
  printf '%s\n' "${VALID_ENVS[@]}"
}

is_valid_env() {
  local name="${1:?}"
  local e
  for e in "${VALID_ENVS[@]}"; do
    [[ "$e" == "$name" ]] && return 0
  done
  return 1
}

require_env_name() {
  local name="${1:?}"
  if ! is_valid_env "$name"; then
    echo "docker: invalid environment '${name}'. Expected one of: $(usage_envs | tr '\n' ' ')" >&2
    exit 1
  fi
}

env_file_for_stage() {
  echo "$REPO_ROOT/.env.${1}"
}

require_env_files() {
  local stage="${1:?}"
  local path
  path="$(env_file_for_stage "$stage")"
  if [[ ! -f "$path" ]]; then
    echo "docker: missing ${path} — copy from .env.${stage}.example" >&2
    exit 1
  fi
}

fe_port_for_env() {
  case "${1:?}" in
    local|dev) echo 3000 ;;
    staging) echo 3001 ;;
    prod) echo 3002 ;;
    *) echo 3000 ;;
  esac
}

compose_file() {
  echo "$REPO_ROOT/docker/compose.${1}.yml"
}

stack_file() {
  echo "$REPO_ROOT/docker/stack.${1}.yml"
}

compose_project() {
  echo "mycourse-fe-${1}"
}

# Export KEY=VALUE lines for docker compose ${VAR} substitution (build-args).
export_dotenv_file() {
  local file="${1:?}"
  local line key val
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" ]] && continue
    [[ "$line" != *"="* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    export "${key}=${val}"
  done < "$file"
}

load_compose_env() {
  local stage="${1:?}"
  [[ -f "$REPO_ROOT/.env" ]] && export_dotenv_file "$REPO_ROOT/.env"
  export_dotenv_file "$(env_file_for_stage "$stage")"
}

compose_cmd() {
  local env_name="${1:?}"
  shift
  load_compose_env "$env_name"
  docker compose -f "$(compose_file "$env_name")" -p "$(compose_project "$env_name")" "$@"
}

wait_for_http() {
  local url="${1:?}"
  local timeout_sec="${2:-90}"
  local deadline=$(( $(date +%s) + timeout_sec ))
  echo "docker: polling ${url} (timeout ${timeout_sec}s)..."
  while (( $(date +%s) < deadline )); do
    local code
    code="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 2 --max-time 5 "$url" 2>/dev/null || echo 000)"
    if [[ "$code" == "200" || "$code" == "307" || "$code" == "308" ]]; then
      echo "docker: HTTP ${code} OK"
      return 0
    fi
    sleep 2
  done
  echo "docker: HTTP check failed (${url})" >&2
  return 1
}
