#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/Users/anastasia/neuroom-prototype-lk-student"
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

    if [[ -f package-lock.json ]]; then
      npm ci --silent || npm i --silent
    elif [[ -f yarn.lock ]]; then
      yarn --silent
    else
      npm i --silent
    fi
  fi

  sleep 5
done
