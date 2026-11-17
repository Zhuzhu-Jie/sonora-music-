#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
: "${ANDROID_HOME:?Set ANDROID_HOME to an Android SDK with platform 35 and build-tools 35.0.0}"
SDK_TOOLS="$ANDROID_HOME/build-tools/35.0.0"
ANDROID_JAR="$ANDROID_HOME/platforms/android-35/android.jar"
mkdir -p build/classes build/dex build/res .local-signing
python3 - <<'PYMANIFEST'
from pathlib import Path
text=Path('app/src/main/AndroidManifest.xml').read_text()
Path('build/AndroidManifest.xml').write_text(text.replace('<manifest ', '<manifest package="cn.sonora.music" ', 1))
PYMANIFEST
"$SDK_TOOLS/aapt2" compile --dir app/src/main/res -o build/res.zip
"$SDK_TOOLS/aapt2" link -I "$ANDROID_JAR" --manifest build/AndroidManifest.xml --java build/generated build/res.zip -A app/src/main/assets -o build/resources.apk
if command -v javac >/dev/null 2>&1; then
 javac -source 8 -target 8 -bootclasspath "$ANDROID_JAR:$SDK_TOOLS/core-lambda-stubs.jar" -d build/classes app/src/main/java/cn/sonora/music/*.java
else
 : "${ECJ_JAR:?Set ECJ_JAR to Eclipse ECJ 3.40.0 when javac is unavailable}"
 java -jar "$ECJ_JAR" -source 1.8 -target 1.8 -bootclasspath "$ANDROID_JAR:$SDK_TOOLS/core-lambda-stubs.jar" -d build/classes app/src/main/java/cn/sonora/music/*.java
fi
python3 - <<'PY'
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
with ZipFile('build/classes.jar','w',ZIP_DEFLATED) as z:
 for f in sorted(Path('build/classes').rglob('*.class')):z.write(f,f.relative_to('build/classes'))
PY
"$SDK_TOOLS/d8" --lib "$ANDROID_JAR" --min-api 26 --output build/dex build/classes.jar
cp build/resources.apk build/unsigned.apk
python3 - <<'PY'
from zipfile import ZipFile,ZIP_DEFLATED
with ZipFile('build/unsigned.apk','a',ZIP_DEFLATED) as z:z.write('build/dex/classes.dex','classes.dex')
PY
"$SDK_TOOLS/zipalign" -f -p 4 build/unsigned.apk build/aligned.apk
if [ ! -f .local-signing/release.jks ]; then
 python3 - <<'PY'
from pathlib import Path
import secrets,os
p=Path('.local-signing/password');p.write_text(secrets.token_urlsafe(36));os.chmod(p,0o600)
PY
 keytool -genkeypair -keystore .local-signing/release.jks -storepass:file .local-signing/password -keypass:file .local-signing/password -alias sonora -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=Sonora Offline Music, OU=Independent Build' >/dev/null 2>&1
 chmod 600 .local-signing/release.jks
fi
"$SDK_TOOLS/apksigner" sign --ks .local-signing/release.jks --ks-pass file:.local-signing/password --ks-key-alias sonora --out build/sonora-2.0.0.apk build/aligned.apk
"$SDK_TOOLS/apksigner" verify --verbose --print-certs build/sonora-2.0.0.apk > build/signature.txt
"$SDK_TOOLS/aapt" dump badging build/sonora-2.0.0.apk > build/package.txt
sha256sum build/sonora-2.0.0.apk > build/SHA256SUMS
cat build/SHA256SUMS
