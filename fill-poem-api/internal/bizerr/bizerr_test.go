package bizerr

import (
	"errors"
	"fmt"
	"net/http"
	"testing"
)

func TestEveryCodeHasStatusAndMessage(t *testing.T) {
	for _, code := range Codes() {
		if StatusOf(code) < 400 {
			t.Errorf("%s: status %d is not an error status", code, StatusOf(code))
		}
		if New(code).Message() == "" {
			t.Errorf("%s: empty message", code)
		}
	}
}

func TestUnknownCodeFallsBackToInternal(t *testing.T) {
	e := New(Code("E_NOPE"))
	if e.Status() != http.StatusInternalServerError {
		t.Fatalf("Status() = %d, want 500", e.Status())
	}
	if e.Message() != New(CodeInternal).Message() {
		t.Fatalf("Message() = %q, want internal message", e.Message())
	}
}

func TestWrapKeepsCauseOutOfMessage(t *testing.T) {
	cause := errors.New("db down")
	e := Wrap(CodeInternal, cause)
	if !errors.Is(e, cause) {
		t.Fatal("errors.Is(e, cause) = false")
	}
	if e.Message() == cause.Error() {
		t.Fatal("cause leaked into client message")
	}
}

func TestAsFindsWrappedError(t *testing.T) {
	err := fmt.Errorf("handler: %w", New(CodeNotFound))
	be, ok := As(err)
	if !ok || be.Code != CodeNotFound {
		t.Fatalf("As() = %v, %v", be, ok)
	}
	if _, ok := As(errors.New("plain")); ok {
		t.Fatal("As() matched a plain error")
	}
}
