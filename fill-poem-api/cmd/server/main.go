package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/altmanlib/fill-poem/fill-poem-api/internal/config"
	"github.com/altmanlib/fill-poem/fill-poem-api/internal/httpapi"
	"github.com/altmanlib/fill-poem/fill-poem-api/internal/store"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	if err := serve(logger); err != nil {
		logger.Error("server failed", "error", err)
		os.Exit(1)
	}
}

// serve is the single assembly point: configuration, database, HTTP surface.
func serve(logger *slog.Logger) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	ctx := context.Background()
	db, err := store.Open(ctx, store.Config{URL: cfg.DatabaseURL, Logger: logger})
	if err != nil {
		return err
	}
	// Domain packages pass their entities here as they land (R016 onwards).
	if err := db.Migrate(ctx); err != nil {
		_ = db.Close()
		return err
	}

	router := httpapi.NewRouter(httpapi.Deps{
		Logger:             logger,
		Readiness:          db.Ping,
		CORSAllowedOrigins: cfg.CORSAllowedOrigins,
		TrustedProxies:     cfg.TrustedProxies,
		RateLimit:          cfg.RateLimit,
		RateBurst:          cfg.RateBurst,
	})

	return run(ctx, runDeps{
		Addr:       cfg.Addr(),
		Handler:    router,
		Logger:     logger,
		CloseStore: db.Close,
	})
}
