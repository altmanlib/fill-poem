package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/altmanlib/fill-poem/fill-poem-api/internal/bizerr"
)

func quietLogger() *slog.Logger { return slog.New(slog.NewTextHandler(io.Discard, nil)) }

func serve(t *testing.T, r *Router, req *http.Request) *httptest.ResponseRecorder {
	t.Helper()
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	return rec
}

func decodeError(t *testing.T, rec *httptest.ResponseRecorder) ErrorBody {
	t.Helper()
	var body ErrorBody
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("body %q is not an ErrorBody: %v", rec.Body.String(), err)
	}
	return body
}

func TestHealthzAndReadyz(t *testing.T) {
	ready := errors.New("down")
	r := NewRouter(Deps{Logger: quietLogger(), Readiness: func(context.Context) error { return ready }})

	if rec := serve(t, r, httptest.NewRequest(http.MethodGet, "/healthz", nil)); rec.Code != http.StatusOK {
		t.Errorf("/healthz = %d", rec.Code)
	}
	if rec := serve(t, r, httptest.NewRequest(http.MethodGet, "/readyz", nil)); rec.Code != http.StatusServiceUnavailable {
		t.Errorf("/readyz with failing check = %d", rec.Code)
	}

	ready = nil
	if rec := serve(t, r, httptest.NewRequest(http.MethodGet, "/readyz", nil)); rec.Code != http.StatusOK {
		t.Errorf("/readyz with passing check = %d", rec.Code)
	}
}

func TestReadyzWithoutCheckIsNotReady(t *testing.T) {
	r := NewRouter(Deps{Logger: quietLogger()})
	if rec := serve(t, r, httptest.NewRequest(http.MethodGet, "/readyz", nil)); rec.Code != http.StatusServiceUnavailable {
		t.Errorf("/readyz = %d", rec.Code)
	}
}

func TestUnknownRouteAndMethodUseUniformErrors(t *testing.T) {
	r := NewRouter(Deps{Logger: quietLogger()})

	rec := serve(t, r, httptest.NewRequest(http.MethodGet, "/nope", nil))
	if rec.Code != http.StatusNotFound || decodeError(t, rec).Code != bizerr.CodeNotFound {
		t.Errorf("404 = %d %s", rec.Code, rec.Body)
	}

	rec = serve(t, r, httptest.NewRequest(http.MethodPost, "/healthz", nil))
	if rec.Code != http.StatusMethodNotAllowed || decodeError(t, rec).Code != bizerr.CodeMethodNotAllow {
		t.Errorf("405 = %d %s", rec.Code, rec.Body)
	}
}

func TestHandlerBizErrAndPanicAreRendered(t *testing.T) {
	r := NewRouter(Deps{Logger: quietLogger()})
	r.API.GET("/teapot", func(echo.Context) error { return bizerr.New(bizerr.CodeForbidden) })
	r.API.GET("/boom", func(echo.Context) error { panic("kaboom") })
	r.API.GET("/plain", func(echo.Context) error { return errors.New("secret detail") })

	rec := serve(t, r, httptest.NewRequest(http.MethodGet, "/api/v1/teapot", nil))
	if rec.Code != http.StatusForbidden || decodeError(t, rec).Code != bizerr.CodeForbidden {
		t.Errorf("bizerr = %d %s", rec.Code, rec.Body)
	}

	rec = serve(t, r, httptest.NewRequest(http.MethodGet, "/api/v1/boom", nil))
	if rec.Code != http.StatusInternalServerError || decodeError(t, rec).Code != bizerr.CodeInternal {
		t.Errorf("panic = %d %s", rec.Code, rec.Body)
	}

	rec = serve(t, r, httptest.NewRequest(http.MethodGet, "/api/v1/plain", nil))
	if rec.Code != http.StatusInternalServerError || strings.Contains(rec.Body.String(), "secret detail") {
		t.Errorf("plain error leaked cause: %d %s", rec.Code, rec.Body)
	}
}

func TestRateLimitAppliesToAPIGroupOnly(t *testing.T) {
	r := NewRouter(Deps{Logger: quietLogger(), RateLimit: 0.001, RateBurst: 2})
	r.API.GET("/ping", func(c echo.Context) error { return c.String(http.StatusOK, "pong") })

	codes := make([]int, 0, 4)
	for range 4 {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/ping", nil)
		req.RemoteAddr = "192.0.2.1:1234"
		codes = append(codes, serve(t, r, req).Code)
	}
	if codes[0] != 200 || codes[1] != 200 || codes[2] != http.StatusTooManyRequests {
		t.Errorf("codes = %v, want 200 200 429 ...", codes)
	}

	// A different client IP has its own bucket.
	req := httptest.NewRequest(http.MethodGet, "/api/v1/ping", nil)
	req.RemoteAddr = "192.0.2.2:1234"
	if code := serve(t, r, req).Code; code != 200 {
		t.Errorf("other client = %d", code)
	}

	for range 5 {
		if code := serve(t, r, httptest.NewRequest(http.MethodGet, "/healthz", nil)).Code; code != 200 {
			t.Fatalf("/healthz limited: %d", code)
		}
	}
}

func TestCORSOnlyForAllowedOrigins(t *testing.T) {
	r := NewRouter(Deps{Logger: quietLogger(), CORSAllowedOrigins: []string{"https://a.example"}})

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	req.Header.Set("Origin", "https://a.example")
	if got := serve(t, r, req).Header().Get("Access-Control-Allow-Origin"); got != "https://a.example" {
		t.Errorf("allowed origin header = %q", got)
	}

	req = httptest.NewRequest(http.MethodGet, "/healthz", nil)
	req.Header.Set("Origin", "https://evil.example")
	if got := serve(t, r, req).Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Errorf("disallowed origin header = %q", got)
	}
}

func TestClientIPHonoursXFFOnlyFromTrustedProxy(t *testing.T) {
	_, trusted, _ := net.ParseCIDR("10.0.0.0/8")

	tests := []struct {
		name    string
		trusted []*net.IPNet
		peer    string
		want    string
	}{
		{"no trusted proxies ignores XFF", nil, "10.1.1.1:80", "10.1.1.1"},
		{"trusted proxy: XFF used", []*net.IPNet{trusted}, "10.1.1.1:80", "203.0.113.9"},
		{"untrusted peer: XFF ignored", []*net.IPNet{trusted}, "198.51.100.7:80", "198.51.100.7"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			r := NewRouter(Deps{Logger: quietLogger(), TrustedProxies: tc.trusted})
			r.GET("/ip", func(c echo.Context) error { return c.String(http.StatusOK, c.RealIP()) })
			req := httptest.NewRequest(http.MethodGet, "/ip", nil)
			req.RemoteAddr = tc.peer
			req.Header.Set("X-Forwarded-For", "203.0.113.9")
			if got := serve(t, r, req).Body.String(); got != tc.want {
				t.Errorf("RealIP() = %q, want %q", got, tc.want)
			}
		})
	}
}
