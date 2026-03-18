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

    # 1. Обновить код
    git reset --quiet --hard "origin/$BRANCH"

    # 2. Переустановить зависимости
    rm -rf node_modules
    if [[ -f package-lock.json ]]; then
      npm ci --silent || npm i --silent
    elif [[ -f yarn.lock ]]; then
      yarn --silent
    else
      npm i --silent
    fi

    # 3. Очистить кэши
    rm -rf /tmp/metro-* node_modules/.cache .expo/web/cache

    echo "[sync] done — перезапусти Expo вручную"
  fi

  sleep 5
done
