#!/bin/bash

set -euo pipefail

cleanup() {
	kill "$nginx_pid" "$uvicorn_pid" 2>/dev/null || true
	wait "$nginx_pid" "$uvicorn_pid" 2>/dev/null || true
}

/usr/local/bin/dbmate up

nginx -g 'daemon off;' &
nginx_pid=$!

uvicorn main:app --host 0.0.0.0 --port 8000 &
uvicorn_pid=$!

trap cleanup EXIT INT TERM

wait -n "$nginx_pid" "$uvicorn_pid"
