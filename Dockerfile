FROM node:22-slim AS frontend-builder

WORKDIR /frontend

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY app/package.json app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY app/ ./

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm run build

FROM python:3.13-slim AS requirements-stage

WORKDIR /tmp

RUN pip install poetry && \
    poetry self add poetry-plugin-export

COPY server/pyproject.toml server/poetry.lock* ./

RUN poetry export --format=requirements.txt --output=requirements.txt --only=main --without-hashes

FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc curl nginx \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

COPY --from=requirements-stage /tmp/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ARG TARGETARCH
RUN if [ "$TARGETARCH" = "arm64" ]; then \
    curl -fsSL -o /usr/local/bin/dbmate https://github.com/amacneil/dbmate/releases/latest/download/dbmate-linux-arm64; \
    else \
    curl -fsSL -o /usr/local/bin/dbmate https://github.com/amacneil/dbmate/releases/latest/download/dbmate-linux-amd64; \
    fi && \
    chmod +x /usr/local/bin/dbmate

COPY server/ ./
COPY server/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-builder /frontend/dist/ /usr/share/nginx/html/

EXPOSE 80

CMD ["./run.sh"]
