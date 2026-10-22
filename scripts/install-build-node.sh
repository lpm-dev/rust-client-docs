#!/usr/bin/env bash
set -euo pipefail

readonly LPM_NODE_VERSION="22.23.4"
LPM_NODE_PREFIX="${LPM_NODE_PREFIX:-/opt/lpm-node}"

if [[ "$(uname -s)" != "Linux" ]]; then
	printf 'The build Node.js installer requires Linux.\n' >&2
	exit 1
fi

case "$(uname -m)" in
	x86_64)
		LPM_NODE_ARCH="x64"
		LPM_NODE_SHA256="1805bcd35e6815559bd2eb97db438d3fdb0eb3a5e6a977b7c1badca76337e9ce"
		;;
	aarch64 | arm64)
		LPM_NODE_ARCH="arm64"
		LPM_NODE_SHA256="6287aa46b6c375d816e63ae66d024fbbfd70404825aabdfdf898a970871d2f4b"
		;;
	*)
		printf 'Unsupported architecture for the build Node.js runtime.\n' >&2
		exit 1
		;;
esac

LPM_NODE_SCRATCH="$(mktemp -d)"
trap 'rm -rf "$LPM_NODE_SCRATCH"' EXIT
LPM_NODE_ARCHIVE="$LPM_NODE_SCRATCH/node.tar.xz"
curl --proto '=https' --tlsv1.2 --fail --silent --show-error --location --retry 3 \
	"https://nodejs.org/dist/v$LPM_NODE_VERSION/node-v$LPM_NODE_VERSION-linux-$LPM_NODE_ARCH.tar.xz" \
	--output "$LPM_NODE_ARCHIVE"
printf '%s  %s\n' "$LPM_NODE_SHA256" "$LPM_NODE_ARCHIVE" | sha256sum --check -

mkdir "$LPM_NODE_SCRATCH/runtime"
tar --extract --xz --file "$LPM_NODE_ARCHIVE" --strip-components=1 --directory "$LPM_NODE_SCRATCH/runtime"
if [[ "$("$LPM_NODE_SCRATCH/runtime/bin/node" --version)" != "v$LPM_NODE_VERSION" ]]; then
	printf 'The downloaded Node.js runtime has an unexpected version.\n' >&2
	exit 1
fi

if [[ -e "$LPM_NODE_PREFIX" ]]; then
	printf 'The build Node.js installation directory already exists: %s\n' "$LPM_NODE_PREFIX" >&2
	exit 1
fi
mkdir -p "$(dirname "$LPM_NODE_PREFIX")"
mv "$LPM_NODE_SCRATCH/runtime" "$LPM_NODE_PREFIX"
"$LPM_NODE_PREFIX/bin/node" --version
