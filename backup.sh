#!/usr/bin/env bash
# ─── LabDeck backup ─────────────────────────────────────────────────────────
# Архивира data/ (конфигурация + кеш на favicons) в backups/ с ротация.
# Backs up data/ (config + favicon cache) into backups/ with rotation.
#
#   Употреба / Usage:   ./backup.sh
#   Cron (3:00 всеки ден / daily):
#     0 3 * * * cd /opt/labdeck && ./backup.sh >> backups/backup.log 2>&1
#
# Възстановяване / Restore:
#   tar -xzf backups/labdeck-backup-YYYYmmdd-HHMMSS.tar.gz -C .

set -euo pipefail

KEEP="${BACKUP_KEEP:-14}"                       # колко архива да пази / how many archives to keep
SRC="${DATA_DIR:-./data}"
OUT="${BACKUP_DIR:-./backups}"
TS="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$OUT"

ARCHIVE="$OUT/labdeck-backup-$TS.tar.gz"
tar -czf "$ARCHIVE" -C "$(dirname "$SRC")" "$(basename "$SRC")"

# Ротация: три старите архива / rotation: prune old archives
ls -1t "$OUT"/labdeck-backup-*.tar.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm --

echo "✓ Backup: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1)), keeping last $KEEP"
