.DEFAULT_GOAL := test

APP_NAME := fill-poem-api
CMD := ./cmd/server
VERSION := $(shell cat VERSION 2>/dev/null || echo dev)
BUILD_DIR := build
BINARY := $(BUILD_DIR)/$(APP_NAME)

# Release image coordinates. CR_* are read from .env
PLATFORM ?= linux/amd64
IMAGE := $${CR_REGISTRY}/$${CR_NAMESPACE}/fill-poem-api:$(VERSION)
LOAD_ENV := set -e; set -a; [ -f .env ] && . ./.env; set +a
REQUIRE_REGISTRY := : "$${CR_REGISTRY:?CR_REGISTRY is not set}" "$${CR_NAMESPACE:?CR_NAMESPACE is not set}"

.PHONY: all build run dev test fmt lint tidy clean docker-build docker-push help

all: build

build:
	@mkdir -p $(BUILD_DIR)
	go build -o $(BINARY) $(CMD)

run:
	go run $(CMD)

dev:
	@$(LOAD_ENV); go run $(CMD)

test:
	go test -p=1 ./...

fmt:
	go fmt ./...

lint:
	golangci-lint run ./...

tidy:
	go mod tidy

clean:
	rm -rf $(BUILD_DIR)

# The build stage runs on the host architecture and Go cross-compiles to
# $(PLATFORM), so building another architecture never goes through emulation
docker-build:
	@$(LOAD_ENV); $(REQUIRE_REGISTRY); \
	  revision=$$(git rev-parse HEAD); \
	  source=$$(git remote get-url origin | sed -E 's|^git@([^:]+):|https://\1/|'); \
	  echo "Building $(IMAGE) for $(PLATFORM)"; \
	  docker build --platform $(PLATFORM) \
	    --label org.opencontainers.image.title="fill-poem-api" \
	    --label org.opencontainers.image.version="$(VERSION)" \
	    --label org.opencontainers.image.revision="$$revision" \
	    --label org.opencontainers.image.source="$$source" \
	    -t "$(IMAGE)" .

docker-push: docker-build
	@$(LOAD_ENV); $(REQUIRE_REGISTRY); \
	  if [ -n "$$CR_PASSWORD" ]; then printf '%s' "$$CR_PASSWORD" | docker login "$$CR_REGISTRY" -u "$$CR_USERNAME" --password-stdin; fi; \
	  echo "Pushing $(IMAGE)"; \
	  docker push "$(IMAGE)"

help:
	@echo "Available targets:"
	@echo "  make build          Build binary to $(BINARY)"
	@echo "  make run            Run the service"
	@echo "  make dev            Run with .env loaded"
	@echo "  make test           Run unit tests"
	@echo "  make fmt            Format Go sources"
	@echo "  make lint           Run golangci-lint"
	@echo "  make tidy           Tidy go.mod"
	@echo "  make clean          Remove build artifacts"
	@echo "  make docker-build   Build the release image for $(PLATFORM) (needs CR_* in .env)"
	@echo "  make docker-push    Build and push the release image (needs CR_* in .env)"
