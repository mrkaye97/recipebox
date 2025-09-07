-- migrate:up
CREATE INDEX recipe_ingredient_search_idx ON recipe_ingredient
USING bm25 (id, name, recipe_id)
WITH (
    key_field='id',
    text_fields='{"name": {"tokenizer": {"type": "default", "stemmer": "English"}}}'
);


-- migrate:down
DROP INDEX recipe_ingredient_search_idx;
