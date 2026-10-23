#!/usr/bin/env bash
# Wdrożenie na serwerze: ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

COMPOSE="docker compose -f docker-compose.prod.yml"
BACKUP_DIR="${BACKUP_DIR:-$HOME/expense-app-backups}"

[ -f .env ] || { echo "Brak pliku .env (wzór: .env.production.example)"; exit 1; }

git pull --ff-only

# Kopia bazy przed migracjami; pierwsze wdrożenie nie ma jeszcze bazy
if $COMPOSE ps --status running --services 2>/dev/null | grep -qx db; then
  mkdir -p "$BACKUP_DIR"
  $COMPOSE exec -T db pg_dump -U expense_user expense_tracker | gzip > "$BACKUP_DIR/$(date +%F_%H%M%S).sql.gz"
  ls -1t "$BACKUP_DIR" | tail -n +11 | while read -r f; do rm -- "$BACKUP_DIR/$f"; done
fi

$COMPOSE up -d --build
docker image prune -f >/dev/null

$COMPOSE ps
echo "Gotowe: $(git log -1 --format='%h %s')"
