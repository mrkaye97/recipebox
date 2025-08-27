FROM python:3.13-slim as requirements-stage

WORKDIR /tmp

RUN pip install poetry

COPY pyproject.toml poetry.lock* ./

RUN poetry export --format=requirements.txt --output=requirements.txt --only=main --without-hashes

FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=requirements-stage /tmp/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ARG TARGETARCH
RUN if [ "$TARGETARCH" = "arm64" ]; then \
    curl -fsSL -o /usr/local/bin/dbmate https://github.com/amacneil/dbmate/releases/latest/download/dbmate-linux-arm64; \
    else \
    curl -fsSL -o /usr/local/bin/dbmate https://github.com/amacneil/dbmate/releases/latest/download/dbmate-linux-amd64; \
    fi && \
    chmod +x /usr/local/bin/dbmate

COPY . .

EXPOSE 8000

CMD ["./run.sh"]