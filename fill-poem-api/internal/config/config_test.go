package config

import (
	"strings"
	"testing"
)

func lookupFrom(env map[string]string) func(string) (string, bool) {
	return func(key string) (string, bool) {
		v, ok := env[key]
		return v, ok
	}
}

func TestLoadDefaults(t *testing.T) {
	cfg, err := loadFrom(lookupFrom(map[string]string{"DATABASE_URL": "postgres://x"}))
	if err != nil {
		t.Fatalf("loadFrom() error = %v", err)
	}
	if cfg.Addr() != "127.0.0.1:17073" {
		t.Errorf("Addr() = %q", cfg.Addr())
	}
	if cfg.RateLimit != 20 || cfg.RateBurst != 40 {
		t.Errorf("rate = %v/%d", cfg.RateLimit, cfg.RateBurst)
	}
	if len(cfg.CORSAllowedOrigins) != 0 || len(cfg.TrustedProxies) != 0 {
		t.Errorf("CORS / proxies should default to empty")
	}
}

func TestLoadParsesValues(t *testing.T) {
	cfg, err := loadFrom(lookupFrom(map[string]string{
		"DATABASE_URL":         "postgres://x",
		"APP_HOST":             "0.0.0.0",
		"APP_PORT":             "8080",
		"RATE_LIMIT_RPS":       "2.5",
		"RATE_LIMIT_BURST":     "5",
		"CORS_ALLOWED_ORIGINS": " https://a.example , https://b.example ,",
		"TRUSTED_PROXIES":      "10.0.0.0/8, 127.0.0.1",
	}))
	if err != nil {
		t.Fatalf("loadFrom() error = %v", err)
	}
	if cfg.Addr() != "0.0.0.0:8080" || cfg.RateLimit != 2.5 || cfg.RateBurst != 5 {
		t.Errorf("unexpected cfg %+v", cfg)
	}
	if got := strings.Join(cfg.CORSAllowedOrigins, "|"); got != "https://a.example|https://b.example" {
		t.Errorf("CORS = %q", got)
	}
	if len(cfg.TrustedProxies) != 2 || cfg.TrustedProxies[1].String() != "127.0.0.1/32" {
		t.Errorf("TrustedProxies = %v", cfg.TrustedProxies)
	}
}

func TestLoadRejectsInvalid(t *testing.T) {
	tests := map[string]map[string]string{
		"missing database url": {},
		"bad port":             {"DATABASE_URL": "x", "APP_PORT": "abc"},
		"port out of range":    {"DATABASE_URL": "x", "APP_PORT": "70000"},
		"non-positive rps":     {"DATABASE_URL": "x", "RATE_LIMIT_RPS": "0"},
		"zero burst":           {"DATABASE_URL": "x", "RATE_LIMIT_BURST": "0"},
		"wildcard origin":      {"DATABASE_URL": "x", "CORS_ALLOWED_ORIGINS": "*"},
		"bad proxy":            {"DATABASE_URL": "x", "TRUSTED_PROXIES": "not-an-ip"},
	}
	for name, env := range tests {
		t.Run(name, func(t *testing.T) {
			if _, err := loadFrom(lookupFrom(env)); err == nil {
				t.Fatal("loadFrom() error = nil, want error")
			}
		})
	}
}
