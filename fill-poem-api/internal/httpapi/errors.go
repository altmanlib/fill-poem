package httpapi

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/altmanlib/fill-poem/fill-poem-api/internal/bizerr"
)

// ErrorBody is the uniform error response: a stable code for clients and a
// diagnostic message. Causes are logged, never sent.
type ErrorBody struct {
	Code    bizerr.Code `json:"code"`
	Message string      `json:"message"`
}

// errorHandler renders every error as ErrorBody. Framework errors (404, 405,
// malformed requests) are mapped onto bizerr codes so clients see one shape.
func errorHandler(log *slog.Logger) echo.HTTPErrorHandler {
	return func(err error, c echo.Context) {
		if c.Response().Committed {
			return
		}
		be := classify(err)
		if be.Status() >= http.StatusInternalServerError {
			log.Error("http error", "code", be.Code, "error", err, "path", c.Request().URL.Path)
		}

		var writeErr error
		if c.Request().Method == http.MethodHead {
			writeErr = c.NoContent(be.Status())
		} else {
			writeErr = c.JSON(be.Status(), ErrorBody{Code: be.Code, Message: be.Message()})
		}
		if writeErr != nil {
			log.Warn("write error response failed", "error", writeErr)
		}
	}
}

func classify(err error) *bizerr.Error {
	if be, ok := bizerr.As(err); ok {
		return be
	}
	var he *echo.HTTPError
	if errors.As(err, &he) {
		switch he.Code {
		case http.StatusBadRequest:
			return bizerr.Wrap(bizerr.CodeBadRequest, err)
		case http.StatusUnauthorized:
			return bizerr.Wrap(bizerr.CodeUnauthorized, err)
		case http.StatusForbidden:
			return bizerr.Wrap(bizerr.CodeForbidden, err)
		case http.StatusNotFound:
			return bizerr.Wrap(bizerr.CodeNotFound, err)
		case http.StatusMethodNotAllowed:
			return bizerr.Wrap(bizerr.CodeMethodNotAllow, err)
		case http.StatusTooManyRequests:
			return bizerr.Wrap(bizerr.CodeTooManyRequests, err)
		}
	}
	return bizerr.Wrap(bizerr.CodeInternal, err)
}
