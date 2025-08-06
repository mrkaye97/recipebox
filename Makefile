run:
	(cd server && poetry run fastapi dev main.py)

lint:
	(cd server && poetry run black .)
	(cd server && poetry run ruff format .)
	(cd server && poetry run isort .)
	(cd server && poetry run ruff check --fix)
	(cd server && poetry run mypy .)

migrate:
	(cd server && dbmate up)
	make gen-sqlc

rollback:
	(cd server && dbmate down)

reset-db:
	(cd server && dbmate drop)
	make migrate

gen-sqlc:
	(cd server && sqlc generate)
	make lint
