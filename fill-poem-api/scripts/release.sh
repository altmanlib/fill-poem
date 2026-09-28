#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 [version]" >&2
  echo "Example: $0 1.2.3" >&2
  echo "Without a version, increment the patch number in VERSION." >&2
  exit 2
}

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
API_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
REPO_DIR=$(git -C "$API_DIR" rev-parse --show-toplevel)
VERSION_FILE="$API_DIR/VERSION"

VERSION="${1:-}"
REMOTE="${RELEASE_REMOTE:-origin}"

if [ "$#" -gt 1 ] || [ ! -f "$VERSION_FILE" ]; then
  usage
fi

cd "$REPO_DIR"

CURRENT_VERSION=$(tr -d '\r\n' < "$VERSION_FILE")
if ! [[ "$CURRENT_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid version in $VERSION_FILE: $CURRENT_VERSION" >&2
  exit 1
fi

if [ -z "$VERSION" ]; then
  IFS=. read -r major minor patch <<< "$CURRENT_VERSION"
  VERSION="$major.$minor.$((10#$patch + 1))"
  echo "Auto-incremented: $CURRENT_VERSION -> $VERSION"
fi

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid Docker image tag: $VERSION" >&2
  exit 2
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Refusing to release from a dirty working tree" >&2
  exit 1
fi

TAG="v$VERSION"
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  echo "Tag already exists: $TAG" >&2
  exit 1
fi

if [ "$VERSION" != "$CURRENT_VERSION" ]; then
  printf '%s\n' "$VERSION" > "$VERSION_FILE"
fi

echo "Running tests"
make -C "$API_DIR" test
(cd "$API_DIR" && go build -o /dev/null ./cmd/server)

if ! git diff --quiet -- "$VERSION_FILE"; then
  git add "$VERSION_FILE"
  git commit -m "chore: bump version to $VERSION"
fi

echo "Creating tag $TAG"
git tag -a "$TAG" -m "Release $TAG"

echo "Pushing current branch and tag to $REMOTE"
git push "$REMOTE" HEAD
git push "$REMOTE" "$TAG"

echo "Release $TAG complete"
