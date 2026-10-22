package store

import (
	"context"
	"testing"
)

type probe struct {
	ID   uint `gorm:"primaryKey"`
	Name string
}

func TestOpenRequiresURL(t *testing.T) {
	if _, err := Open(context.Background(), Config{}); err == nil {
		t.Fatal("Open() error = nil, want error for empty URL")
	}
}

func TestMigrateNoModelsIsNoop(t *testing.T) {
	db := OpenTest(t)
	if err := db.Migrate(context.Background()); err != nil {
		t.Fatalf("Migrate() error = %v", err)
	}
}

func TestPingAndResetTruncates(t *testing.T) {
	db := OpenTest(t)
	ctx := context.Background()
	if err := db.Ping(ctx); err != nil {
		t.Fatalf("Ping() error = %v", err)
	}

	Reset(t, db, &probe{})
	if err := db.Gorm.Create(&probe{Name: "a"}).Error; err != nil {
		t.Fatalf("insert: %v", err)
	}
	Reset(t, db, &probe{})

	var n int64
	if err := db.Gorm.Model(&probe{}).Count(&n).Error; err != nil {
		t.Fatalf("count: %v", err)
	}
	if n != 0 {
		t.Fatalf("rows after Reset = %d, want 0", n)
	}
}
