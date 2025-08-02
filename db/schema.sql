CREATE TABLE recipe (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    author TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    tags JSONB NOT NULL DEFAULT '[]',
    location TEXT NOT NULL,
    dietary_restrictions_met JSONB NOT NULL DEFAULT '[]',
    time_estimate_minutes INTEGER NOT NULL,
    notes TEXT,
    saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
