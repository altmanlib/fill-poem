FROM --platform=$BUILDPLATFORM golang:1.27-alpine AS build

# The build stage always runs on the host platform and Go cross-compiles to the
# target one, so building another architecture never goes through emulation
ARG TARGETOS=linux
ARG TARGETARCH=amd64

WORKDIR /src
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -p=2 -trimpath -ldflags="-s -w" -o /fill-poem-api ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=build /fill-poem-api /fill-poem-api
EXPOSE 17073
USER nonroot:nonroot
ENTRYPOINT ["/fill-poem-api"]
