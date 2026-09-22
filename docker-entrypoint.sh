#!/bin/sh
set -e

# Áp dụng migrations khi khởi động (idempotent). Bỏ qua bằng SKIP_MIGRATIONS=1.
if [ "$SKIP_MIGRATIONS" != "1" ]; then
  node scripts/migrate.mjs
fi

exec node .output/server/index.mjs
