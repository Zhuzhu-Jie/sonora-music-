@echo off
setlocal
set "GRADLE_JAVA_EXECUTABLE=java.exe"
if defined JAVA_HOME set "GRADLE_JAVA_EXECUTABLE=%JAVA_HOME%\bin\java.exe"
"%GRADLE_JAVA_EXECUTABLE%" -classpath "%~dp0gradle\wrapper\gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain %*
endlocal
