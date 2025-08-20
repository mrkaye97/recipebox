#!/bin/bash

set -eo pipefail

/usr/local/bin/dbmate up
uvicorn main:app --host 0.0.0.0 --port 8000