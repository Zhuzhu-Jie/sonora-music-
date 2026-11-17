#!/usr/bin/env sh
set -eu
APP_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
GRADLE_JAVA_EXECUTABLE=java
if [ -n "${JAVA_HOME:-}" ]; then GRADLE_JAVA_EXECUTABLE="$JAVA_HOME/bin/java"; fi
exec "$GRADLE_JAVA_EXECUTABLE" -classpath "$APP_ROOT/gradle/wrapper/gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain "$@"
