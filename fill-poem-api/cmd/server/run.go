package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os/signal"
	"syscall"
	"time"
)

type runDeps struct {
	Addr       string
	Handler    http.Handler
	Logger     *slog.Logger
	CloseStore func() error
}

// run serves until SIGINT / SIGTERM (or parent cancellation), then stops HTTP
// first so in-flight requests finish before the store is closed.
func run(parent context.Context, deps runDeps) error {
	ctx, stop := signal.NotifyContext(parent, syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	server := &http.Server{
		Addr:              deps.Addr,
		Handler:           deps.Handler,
		ReadHeaderTimeout: 5 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		deps.Logger.Info("server listening", "addr", deps.Addr)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	var runErr error
	select {
	case <-ctx.Done():
	case runErr = <-errCh:
	}

	deps.Logger.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		deps.Logger.Warn("http shutdown failed", "error", err)
	}
	if deps.CloseStore != nil {
		if err := deps.CloseStore(); err != nil {
			deps.Logger.Warn("store close failed", "error", err)
		}
	}
	return runErr
}
