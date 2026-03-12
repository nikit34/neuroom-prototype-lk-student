#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BRANCH="main"

cd "$REPO_DIR"

git config --global --add safe.directory "$REPO_DIR" || true

echo "[sync] watching $REPO_DIR (branch: $BRANCH)"

while true; do
  echo "[sync] fetching..."
  if ! git fetch origin "$BRANCH" --quiet 2>/dev/null; then
    echo "[sync] fetch failed (no network or auth?), retrying in 30s"
    sleep 30
    continue
  fi

  LOCAL="$(git rev-parse HEAD)"
  REMOTE="$(git rev-parse "origin/$BRANCH")"

  if [[ "$LOCAL" == "$REMOTE" ]]; then
    echo "[sync] up to date (${LOCAL:0:7}), next check in 5s"
    sleep 5
    continue
  fi

  echo "[sync] update: ${LOCAL:0:7} -> ${REMOTE:0:7}"

  # 1. Убить Metro, чтобы он не резолвил модули из удалённого node_modules
  echo "[sync] stopping metro..."
  pkill -f "metro" 2>/dev/null || true
  pkill -f "expo start" 2>/dev/null || true

  # 2. Остановить watchman
  watchman watch-del "$REPO_DIR" 2>/dev/null || true

  # 3. Подтянуть код
  echo "[sync] pulling changes..."
  git reset --hard "origin/$BRANCH" --quiet

  # 4. Переустановить зависимости
  echo "[sync] installing dependencies..."
  rm -rf node_modules
  if [[ -f package-lock.json ]]; then
    npm ci --silent || npm i --silent
  elif [[ -f yarn.lock ]]; then
    yarn --silent
  else
    npm i --silent
  fi

  # 5. Сбросить все кэши
  echo "[sync] clearing caches..."
  rm -rf /tmp/metro-* node_modules/.cache .expo/web/cache /tmp/haste-map-*

  # 6. Вернуть watchman
  watchman watch-project "$REPO_DIR" 2>/dev/null || true

  # 7. Перезапустить Metro в фоне с чистым кэшем
  echo "[sync] starting metro..."
  nohup npx expo start --clear > /tmp/expo-metro.log 2>&1 &
  echo "[sync] done! metro pid=$!, log: /tmp/expo-metro.log"

  sleep 5
done
