run:
	poetry run fastapi dev main.py

lint:
	(cd server && poetry run black .)
	(cd server && poetry run ruff format .)
	(cd server && poetry run isort .)
	(cd server && poetry run ruff check --fix)
	(cd server && poetry run mypy .)

migrate:
	sqlite3 recipebox.db < db/schema.sql

reset-db:
	rm -f recipebox.db
	make migrate
