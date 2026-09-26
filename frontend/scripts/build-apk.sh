#!/usr/bin/env bash
# Builds an optimized (release-mode) APK signed with the Android *debug* key,
# for installing on your own phone. NOT for Play Market — see RELEASE.md.
#
# Usage:  pnpm apk                  # arm64 phones (almost all modern phones)
#         pnpm apk aarch64 armv7    # also older 32-bit phones
set -euo pipefail
cd "$(dirname "$0")/.."

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export NDK_HOME="${NDK_HOME:-$(ls -d "$ANDROID_HOME"/ndk/* | sort -V | tail -1)}"
BUILD_TOOLS="$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)"
TARGETS=("${@:-aarch64}")

# Standard Android debug key (well-known password "android"); created once.
KEYSTORE="$HOME/.android/debug.keystore"
if [ ! -f "$KEYSTORE" ]; then
  echo "→ Creating the Android debug key: $KEYSTORE"
  mkdir -p "$(dirname "$KEYSTORE")"
  keytool -genkeypair -keystore "$KEYSTORE" -storepass android -keypass android \
    -alias androiddebugkey -dname "CN=Android Debug,O=Android,C=US" \
    -keyalg RSA -keysize 2048 -validity 10000
fi

echo "→ Building release APK for: ${TARGETS[*]}"
pnpm tauri android build --apk --target "${TARGETS[@]}"

APK_DIR=src-tauri/gen/android/app/build/outputs/apk/universal/release
UNSIGNED="$APK_DIR/app-universal-release-unsigned.apk"
[ -f "$UNSIGNED" ] || UNSIGNED="$APK_DIR/app-universal-release.apk" # already signed via keystore.properties

VERSION="$(node -p "require('./src-tauri/tauri.conf.json').version")"
OUT_DIR=apk
OUT="$OUT_DIR/kho-games-$VERSION.apk"
mkdir -p "$OUT_DIR"

echo "→ Signing with the debug key"
"$BUILD_TOOLS/zipalign" -f -p 4 "$UNSIGNED" "$OUT.aligned"
"$BUILD_TOOLS/apksigner" sign --ks "$KEYSTORE" --ks-pass pass:android --key-pass pass:android \
  --ks-key-alias androiddebugkey --out "$OUT" "$OUT.aligned"
rm -f "$OUT.aligned" "$OUT.idsig"
"$BUILD_TOOLS/apksigner" verify "$OUT"

echo
echo "✓ APK ready: frontend/$OUT ($(du -h "$OUT" | cut -f1))"
echo "  Install over USB:  adb install -r $OUT"
