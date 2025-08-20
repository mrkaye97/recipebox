FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml poetry.lock* ./

RUN pip install poetry

RUN poetry config virtualenvs.create false

RUN poetry install --only=main --no-interaction --no-ansi --no-root
RUN curl -fsSL -o /usr/local/bin/dbmate https://github.com/amacneil/dbmate/releases/download/v1.6.0/dbmate-linux-amd64
RUN chmod +x /usr/local/bin/dbmate

COPY . .

EXPOSE 8000

CMD ["./run.sh"]
