run:
	poetry run fastapi dev main.py

lint:
	poetry run black .
	poetry run ruff format .
	poetry run isort .
	poetry run ruff check --fix
	poetry run mypy .

migrate:
	sqlite3 recipebox.db < db/schema.sql
