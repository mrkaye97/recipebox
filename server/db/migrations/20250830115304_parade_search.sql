-- migrate:up
CREATE EXTENSION pg_search;
CREATE INDEX recipe_search_idx ON recipe
USING bm25 (name, author, cuisine, notes, id)
WITH (
    key_field='id',
    text_fields='{"name": {"tokenizer": {"type": "default", "stemmer": "English"}}, "notes": {"tokenizer": {"type": "default", "stemmer": "English"}}}'
);

CREATE INDEX recipe_ingredient_search_idx ON recipe_ingredient
USING bm25 (name, recipe_id, user_id)
WITH (
    key_field='recipe_id',
    text_fields='{"name": {"tokenizer": {"type": "default", "stemmer": "English"}}}'
);

-- migrate:down
DROP INDEX recipe_search_idx;
DROP INDEX recipe_ingredient_search_idx;
DROP EXTENSION pg_search;
