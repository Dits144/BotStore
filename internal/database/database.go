package database

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"
)

func OpenSQLite(path string) (*sqlx.DB, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, fmt.Errorf("prepare db dir: %w", err)
	}
	db, err := sqlx.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	db.SetMaxOpenConns(1)
	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("ping sqlite: %w", err)
	}
	return db, nil
}

func Migrate(db *sqlx.DB) error {
	schema := `
CREATE TABLE IF NOT EXISTS owners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jid TEXT NOT NULL UNIQUE,
  is_main INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS rentals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id TEXT NOT NULL UNIQUE,
  group_name TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  expired_at DATETIME NOT NULL,
  added_by TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS product_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE(group_id, name)
);
`
	_, err := db.Exec(schema)
	return err
}
