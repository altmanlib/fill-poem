// Package config resolves runtime configuration from .env and the process
// environment. Process environment variables win over .env values, and
// anything unset falls back to a default.
package config

import (
	"fmt"
	"net"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds the resolved runtime configuration.
type Config struct {
	AppHost     string
	AppPort     int
	DatabaseURL string

	// TrustedProxies are the CIDRs whose X-Forwarded-For header is honoured
	// when deriving the client IP. Empty means the socket peer address is used.
	TrustedProxies []*net.IPNet

	// CORSAllowedOrigins is the exact-match allow list. Empty disables CORS
	// headers (same-origin deployment behind a reverse proxy).
	CORSAllowedOrigins []string

	// RateLimit is the sustained requests per second allowed per client IP on
	// the API group; RateBurst is the bucket size.
	RateLimit float64
	RateBurst int
}

const (
	defaultHost      = "127.0.0.1"
	defaultPort      = 17073
	defaultRateLimit = 20
	defaultRateBurst = 40
)

// Load reads .env (if present, without overriding variables already set in the
// process environment) and resolves the configuration.
func Load() (*Config, error) {
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		return nil, fmt.Errorf("load .env: %w", err)
	}
	return loadFrom(os.LookupEnv)
}

// Addr returns the HTTP listen address.
func (c *Config) Addr() string {
	return net.JoinHostPort(c.AppHost, strconv.Itoa(c.AppPort))
}

func loadFrom(lookup func(string) (string, bool)) (*Config, error) {
	get := func(key string) string {
		v, _ := lookup(key)
		return strings.TrimSpace(v)
	}

	cfg := &Config{
		AppHost:     orDefault(get("APP_HOST"), defaultHost),
		DatabaseURL: get("DATABASE_URL"),
		RateLimit:   defaultRateLimit,
		RateBurst:   defaultRateBurst,
	}
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("config: DATABASE_URL is required")
	}

	var err error
	if cfg.AppPort, err = intOr(get("APP_PORT"), defaultPort, "APP_PORT"); err != nil {
		return nil, err
	}
	if cfg.AppPort < 1 || cfg.AppPort > 65535 {
		return nil, fmt.Errorf("config: APP_PORT %d out of range", cfg.AppPort)
	}

	if raw := get("RATE_LIMIT_RPS"); raw != "" {
		if cfg.RateLimit, err = strconv.ParseFloat(raw, 64); err != nil || cfg.RateLimit <= 0 {
			return nil, fmt.Errorf("config: RATE_LIMIT_RPS %q must be a positive number", raw)
		}
	}
	if cfg.RateBurst, err = intOr(get("RATE_LIMIT_BURST"), defaultRateBurst, "RATE_LIMIT_BURST"); err != nil {
		return nil, err
	}
	if cfg.RateBurst < 1 {
		return nil, fmt.Errorf("config: RATE_LIMIT_BURST must be at least 1")
	}

	cfg.CORSAllowedOrigins = splitCSV(get("CORS_ALLOWED_ORIGINS"))
	for _, origin := range cfg.CORSAllowedOrigins {
		if origin == "*" {
			return nil, fmt.Errorf("config: CORS_ALLOWED_ORIGINS must list explicit origins, not *")
		}
	}

	for _, raw := range splitCSV(get("TRUSTED_PROXIES")) {
		network, err := parseCIDR(raw)
		if err != nil {
			return nil, fmt.Errorf("config: TRUSTED_PROXIES %q: %w", raw, err)
		}
		cfg.TrustedProxies = append(cfg.TrustedProxies, network)
	}
	return cfg, nil
}

// parseCIDR accepts a CIDR or a bare IP (treated as a single-host range).
func parseCIDR(raw string) (*net.IPNet, error) {
	if !strings.Contains(raw, "/") {
		ip := net.ParseIP(raw)
		if ip == nil {
			return nil, fmt.Errorf("not an IP or CIDR")
		}
		bits := 32
		if ip.To4() == nil {
			bits = 128
		}
		return &net.IPNet{IP: ip, Mask: net.CIDRMask(bits, bits)}, nil
	}
	_, network, err := net.ParseCIDR(raw)
	return network, err
}

func orDefault(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

func intOr(raw string, fallback int, key string) (int, error) {
	if raw == "" {
		return fallback, nil
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return 0, fmt.Errorf("config: %s %q is not an integer", key, raw)
	}
	return n, nil
}

func splitCSV(raw string) []string {
	if raw == "" {
		return nil
	}
	var out []string
	for part := range strings.SplitSeq(raw, ",") {
		if part = strings.TrimSpace(part); part != "" {
			out = append(out, part)
		}
	}
	return out
}
