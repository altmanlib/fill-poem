package store

import (
	"context"
	"fmt"
	"os"
	"strings"
	"testing"

	"gorm.io/gorm"
)

// DefaultTestURL is the local convention for the shared test database: the
// compose `db` service with the fillpoem_test database from init-db.sql.
const DefaultTestURL = "postgres://postgres:secret@127.0.0.1:11004/fillpoem_test?sslmode=disable"

// OpenTest opens the shared PostgreSQL test database. TEST_DATABASE_URL
// overrides the default; DATABASE_URL is deliberately not consulted so tests
// can never truncate the development database. The handle is closed via
// t.Cleanup.
func OpenTest(tb testing.TB) *DB {
	tb.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		url = DefaultTestURL
	}
	db, err := Open(context.Background(), Config{URL: url})
	if err != nil {
		tb.Fatalf("store.OpenTest() error = %v (need a reachable PostgreSQL; default %s, start it with `docker compose up -d db`)", err, DefaultTestURL)
	}
	tb.Cleanup(func() { _ = db.Close() })
	return db
}

// Reset migrates models and truncates their tables so each test starts empty.
func Reset(tb testing.TB, db *DB, models ...any) {
	tb.Helper()
	ctx := context.Background()
	if err := db.Migrate(ctx, models...); err != nil {
		tb.Fatalf("store.Reset migrate: %v", err)
	}
	if len(models) == 0 {
		return
	}
	tables := make([]string, 0, len(models))
	for _, model := range models {
		stmt := &gorm.Statement{DB: db.Gorm}
		if err := stmt.Parse(model); err != nil {
			tb.Fatalf("store.Reset parse: %v", err)
		}
		tables = append(tables, stmt.Schema.Table)
	}
	sql := fmt.Sprintf("TRUNCATE %s RESTART IDENTITY CASCADE", quoteTables(tables))
	if err := db.Gorm.WithContext(ctx).Exec(sql).Error; err != nil {
		tb.Fatalf("store.Reset truncate: %v", err)
	}
}

func quoteTables(tables []string) string {
	out := make([]string, len(tables))
	for i, table := range tables {
		out[i] = `"` + strings.ReplaceAll(table, `"`, `""`) + `"`
	}
	return strings.Join(out, ", ")
}
