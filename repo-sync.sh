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

    # 1. Убить Metro, чтобы он не резолвил модули из удалённого node_modules
    pkill -f "metro" 2>/dev/null || true
    pkill -f "expo start" 2>/dev/null || true

    # 2. Остановить watchman
    watchman watch-del "$REPO_DIR" 2>/dev/null || true

    # 3. Подтянуть код
    git reset --hard "origin/$BRANCH" --quiet

    # 4. Переустановить зависимости
    rm -rf node_modules
    if [[ -f package-lock.json ]]; then
      npm ci --silent || npm i --silent
    elif [[ -f yarn.lock ]]; then
      yarn --silent
    else
      npm i --silent
    fi

    # 5. Сбросить все кэши
    rm -rf /tmp/metro-* node_modules/.cache .expo/web/cache /tmp/haste-map-*

    # 6. Вернуть watchman
    watchman watch-project "$REPO_DIR" 2>/dev/null || true

    # 7. Перезапустить Metro в фоне с чистым кэшем
    nohup npx expo start --clear > /tmp/expo-metro.log 2>&1 &
    echo "[sync] restarted metro (pid $!), log: /tmp/expo-metro.log"
  fi

  sleep 5
done
