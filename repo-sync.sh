#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BRANCH="main"

cd "$REPO_DIR"

git config --global --add safe.directory "$REPO_DIR" || true

while true; do
  git fetch origin "$BRANCH" --quiet

  LOCAL="$(git rev-parse HEAD)"
  REMOTE="$(git rev-parse "origin/$BRANCH")"

  if [[ "$LOCAL" != "$REMOTE" ]]; then
    echo "[sync] update: $LOCAL -> $REMOTE"

    git reset --hard "origin/$BRANCH" --quiet

    rm -rf node_modules
    if [[ -f package-lock.json ]]; then
      npm ci --silent || npm i --silent
    elif [[ -f yarn.lock ]]; then
      yarn --silent
    else
      npm i --silent
    fi

    # Сбросить кэш Metro и заставить watchman пересканировать файлы,
    # чтобы запущенный Metro подхватил изменения без перезапуска
    rm -rf /tmp/metro-* node_modules/.cache .expo/web/cache
    watchman watch-del "$REPO_DIR" 2>/dev/null || true
    watchman watch-project "$REPO_DIR" 2>/dev/null || true

    echo "[sync] cache cleared, metro should pick up changes"
  fi

  sleep 5
done
