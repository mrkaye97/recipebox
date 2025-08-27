run:
	(cd server && poetry run fastapi dev main.py --host 0.0.0.0 --port 8000)

fe:
	(cd app && npm run ios)

lint:
	(cd server && poetry run black .)
	(cd server && poetry run ruff format .)
	(cd server && poetry run isort .)
	(cd server && poetry run ruff check --fix)
	(cd server && poetry run mypy .)

migrate:
	(cd server && dbmate up && sed -E '/^SET /d; /^SELECT /d; /^--/d; /^\/\*/,/\*\//d; /^$$/d; s/public\.//g' db/schema.sql > db/schema-sqlc.sql)
	make gen-sqlc

rollback:
	(cd server && dbmate down)

reset-db:
	(cd server && dbmate drop)
	make migrate

gen-sqlc:
	(cd server && sqlc generate)
	make lint

gen-api:
	(cd app && npm run gen-schema)