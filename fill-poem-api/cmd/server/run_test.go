package main

import (
	"context"
	"io"
	"log/slog"
	"net"
	"net/http"
	"testing"
	"time"
)

func quiet() *slog.Logger { return slog.New(slog.NewTextHandler(io.Discard, nil)) }

func freeAddr(t *testing.T) string {
	t.Helper()
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = l.Close() }()
	return l.Addr().String()
}

func TestRunServesThenShutsDownAndClosesStore(t *testing.T) {
	addr := freeAddr(t)
	ctx, cancel := context.WithCancel(context.Background())
	closed := make(chan struct{})
	done := make(chan error, 1)

	go func() {
		done <- run(ctx, runDeps{
			Addr:       addr,
			Handler:    http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { _, _ = w.Write([]byte("ok")) }),
			Logger:     quiet(),
			CloseStore: func() error { close(closed); return nil },
		})
	}()

	var resp *http.Response
	var err error
	for range 50 {
		if resp, err = http.Get("http://" + addr + "/"); err == nil {
			break
		}
		time.Sleep(20 * time.Millisecond)
	}
	if err != nil {
		t.Fatalf("server did not come up: %v", err)
	}
	_ = resp.Body.Close()

	cancel()
	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("run() error = %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("run() did not return after cancel")
	}
	select {
	case <-closed:
	default:
		t.Fatal("CloseStore was not called")
	}
}

func TestRunReportsListenFailure(t *testing.T) {
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = l.Close() }()

	err = run(context.Background(), runDeps{Addr: l.Addr().String(), Handler: http.NotFoundHandler(), Logger: quiet()})
	if err == nil {
		t.Fatal("run() error = nil, want address-in-use error")
	}
}
