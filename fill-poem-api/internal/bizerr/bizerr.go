// Package bizerr centralizes error codes so handlers never scatter ad-hoc error
// strings. Each Code has one canonical message template and one HTTP status;
// call sites only supply template arguments. Codes are the stable contract for
// API callers (the web client maps them to its own copy); messages are
// diagnostic text only.
package bizerr

import (
	"errors"
	"fmt"
	"net/http"
)

// Code identifies a business error category. Codes are stable strings suitable
// for structured logging and client-side mapping.
type Code string

const (
	CodeBadRequest      Code = "E_BAD_REQUEST"
	CodeUnauthorized    Code = "E_UNAUTHORIZED"
	CodeForbidden       Code = "E_FORBIDDEN"
	CodeNotFound        Code = "E_NOT_FOUND"
	CodeMethodNotAllow  Code = "E_METHOD_NOT_ALLOWED"
	CodeTooManyRequests Code = "E_TOO_MANY_REQUESTS"
	CodeInternal        Code = "E_INTERNAL"
)

type spec struct {
	status  int
	message string
}

// specs is the single registry: adding a Code without an entry here is caught
// by the package tests.
var specs = map[Code]spec{
	CodeBadRequest:      {http.StatusBadRequest, "bad request"},
	CodeUnauthorized:    {http.StatusUnauthorized, "unauthorized"},
	CodeForbidden:       {http.StatusForbidden, "forbidden"},
	CodeNotFound:        {http.StatusNotFound, "not found"},
	CodeMethodNotAllow:  {http.StatusMethodNotAllowed, "method not allowed"},
	CodeTooManyRequests: {http.StatusTooManyRequests, "too many requests"},
	CodeInternal:        {http.StatusInternalServerError, "internal error"},
}

// Error is a business error: a Code, its rendered message and an optional
// underlying cause that is logged but never sent to clients.
type Error struct {
	Code    Code
	message string
	cause   error
}

// New builds an Error for code. args fill the message template, if it has verbs.
func New(code Code, args ...any) *Error {
	return &Error{Code: code, message: render(code, args)}
}

// Wrap is New with an underlying cause.
func Wrap(code Code, cause error, args ...any) *Error {
	e := New(code, args...)
	e.cause = cause
	return e
}

func (e *Error) Error() string {
	if e.cause != nil {
		return fmt.Sprintf("%s: %s: %v", e.Code, e.message, e.cause)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.message)
}

func (e *Error) Unwrap() error { return e.cause }

// Message is the client-safe display text.
func (e *Error) Message() string { return e.message }

// Status is the HTTP status for the error's Code.
func (e *Error) Status() int { return StatusOf(e.Code) }

// StatusOf maps a Code to its HTTP status; unknown codes are 500.
func StatusOf(code Code) int {
	if s, ok := specs[code]; ok {
		return s.status
	}
	return http.StatusInternalServerError
}

// As extracts a *Error from err's chain.
func As(err error) (*Error, bool) {
	var be *Error
	if errors.As(err, &be) {
		return be, true
	}
	return nil, false
}

// Codes lists every registered Code, for tests and docs.
func Codes() []Code {
	out := make([]Code, 0, len(specs))
	for c := range specs {
		out = append(out, c)
	}
	return out
}

func render(code Code, args []any) string {
	s, ok := specs[code]
	if !ok {
		return specs[CodeInternal].message
	}
	if len(args) == 0 {
		return s.message
	}
	return fmt.Sprintf(s.message, args...)
}
