// Package httpapi owns the HTTP surface: echo routing, middleware and the
// uniform error response.
package httpapi

import (
	"context"
	"log/slog"
	"net"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/time/rate"

	"github.com/altmanlib/fill-poem/fill-poem-api/internal/bizerr"
)

// Deps are the runtime collaborators and settings of the HTTP surface.
type Deps struct {
	Logger *slog.Logger
	// Readiness reports whether dependencies (the database) are usable.
	Readiness func(context.Context) error
	// CORSAllowedOrigins is the exact-match allow list; empty disables CORS.
	CORSAllowedOrigins []string
	// TrustedProxies are the CIDRs whose X-Forwarded-For is honoured.
	TrustedProxies []*net.IPNet
	// RateLimit (requests per second per client IP) and RateBurst apply to the
	// API group only.
	RateLimit float64
	RateBurst int
}

// Router is the echo engine plus the API group every business route must use.
type Router struct {
	*echo.Echo
	// API is the /api/v1 group. Version prefix and rate limiting live in this
	// single place, so a new route cannot ship outside them.
	API *echo.Group
}

// NewRouter builds the HTTP surface.
func NewRouter(deps Deps) *Router {
	log := deps.Logger
	if log == nil {
		log = slog.Default()
	}

	engine := echo.New()
	engine.HideBanner = true
	engine.HidePort = true
	engine.HTTPErrorHandler = errorHandler(log)
	engine.IPExtractor = ipExtractor(deps.TrustedProxies)
	// requestLogger is outermost so it also sees errors produced by recovery.
	engine.Use(requestLogger(log), recovery(log))
	if len(deps.CORSAllowedOrigins) > 0 {
		engine.Use(middleware.CORSWithConfig(middleware.CORSConfig{
			AllowOrigins: deps.CORSAllowedOrigins,
			AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodOptions},
			AllowHeaders: []string{echo.HeaderContentType, echo.HeaderAuthorization},
			MaxAge:       600,
		}))
	}

	engine.GET("/healthz", func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})
	engine.GET("/readyz", readyz(deps.Readiness))

	api := engine.Group("/api/v1", rateLimit(deps.RateLimit, deps.RateBurst))
	return &Router{Echo: engine, API: api}
}

// ipExtractor derives the client IP. Without trusted proxies only the socket
// peer is used, so a client cannot spoof its IP through X-Forwarded-For.
func ipExtractor(trusted []*net.IPNet) echo.IPExtractor {
	if len(trusted) == 0 {
		return echo.ExtractIPDirect()
	}
	// Only the configured ranges are trusted; loopback / private defaults are off.
	opts := []echo.TrustOption{echo.TrustLoopback(false), echo.TrustLinkLocal(false), echo.TrustPrivateNet(false)}
	for _, network := range trusted {
		opts = append(opts, echo.TrustIPRange(network))
	}
	return echo.ExtractIPFromXFFHeader(opts...)
}

func rateLimit(rps float64, burst int) echo.MiddlewareFunc {
	if rps <= 0 || burst <= 0 {
		return func(next echo.HandlerFunc) echo.HandlerFunc { return next }
	}
	store := middleware.NewRateLimiterMemoryStoreWithConfig(middleware.RateLimiterMemoryStoreConfig{
		Rate:      rate.Limit(rps),
		Burst:     burst,
		ExpiresIn: 10 * time.Minute,
	})
	return middleware.RateLimiterWithConfig(middleware.RateLimiterConfig{
		Store:               store,
		IdentifierExtractor: func(c echo.Context) (string, error) { return c.RealIP(), nil },
		DenyHandler: func(c echo.Context, _ string, _ error) error {
			return bizerr.New(bizerr.CodeTooManyRequests)
		},
		ErrorHandler: func(c echo.Context, err error) error {
			return bizerr.Wrap(bizerr.CodeInternal, err)
		},
	})
}

func readyz(check func(context.Context) error) echo.HandlerFunc {
	return func(c echo.Context) error {
		if check == nil {
			return c.JSON(http.StatusServiceUnavailable, map[string]string{"status": "not ready"})
		}
		if err := check(c.Request().Context()); err != nil {
			return c.JSON(http.StatusServiceUnavailable, map[string]string{"status": "not ready"})
		}
		return c.String(http.StatusOK, "ok")
	}
}

func requestLogger(log *slog.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()
			err := next(c)
			if err != nil {
				// Resolve the status through the error handler first so the log
				// records what the client actually received.
				c.Echo().HTTPErrorHandler(err, c)
			}
			log.Info("http request",
				"method", c.Request().Method,
				"path", c.Request().URL.Path,
				"status", c.Response().Status,
				"latency", time.Since(start),
				"client_ip", c.RealIP(),
			)
			return nil
		}
	}
}

func recovery(log *slog.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) (err error) {
			defer func() {
				if recovered := recover(); recovered != nil {
					log.Error("http panic", "error", recovered, "path", c.Request().URL.Path)
					err = bizerr.New(bizerr.CodeInternal)
				}
			}()
			return next(c)
		}
	}
}
