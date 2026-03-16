#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BRANCH="main"
EXPO_PORT=8081

cd "$REPO_DIR"

git config --global --add safe.directory "$REPO_DIR" || true

kill_metro() {
  # Убить Expo/Metro по порту, чтобы он не видел удалённые node_modules
  lsof -ti :"$EXPO_PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true
  watchman watch-del "$REPO_DIR" 2>/dev/null || true
}

start_metro() {
  watchman watch-project "$REPO_DIR" 2>/dev/null || true
  # Запустить Expo в фоне с чистым кэшем
  nohup npx expo start --clear > "$REPO_DIR/.expo/sync-metro.log" 2>&1 &
  echo "[sync] metro restarted (pid $!)"
}

while true; do
  git fetch origin "$BRANCH" --quiet

  LOCAL="$(git rev-parse HEAD)"
  REMOTE="$(git rev-parse "origin/$BRANCH")"

  if [[ "$LOCAL" != "$REMOTE" ]]; then
    echo "[sync] update: $LOCAL -> $REMOTE"

    # 1. Остановить Metro ДО любых изменений
    kill_metro

    # 2. Обновить код
    git reset --quiet --hard "origin/$BRANCH"

    # 3. Переустановить зависимости
    rm -rf node_modules
    if [[ -f package-lock.json ]]; then
      npm ci --silent || npm i --silent
    elif [[ -f yarn.lock ]]; then
      yarn --silent
    else
      npm i --silent
    fi

    # 4. Очистить все кэши
    rm -rf /tmp/metro-* node_modules/.cache .expo/web/cache

    # 5. Перезапустить Metro
    start_metro

    echo "[sync] done"
  fi

  sleep 5
done
