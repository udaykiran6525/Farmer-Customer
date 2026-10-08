@REM Apache Maven Wrapper startup batch script
@echo off
setlocal
set "MAVEN_PROJECTBASEDIR=%~dp0"
if "%MAVEN_PROJECTBASEDIR:~-1%"=="\" set "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"
if exist "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties" goto init
echo Error: %MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties not found! >&2
exit /b 1
:init
if not defined JAVA_HOME goto noJavaHome
set "JAVACMD=%JAVA_HOME%\bin\java.exe"
if exist "%JAVACMD%" goto checkJvm
:noJavaHome
set "JAVACMD=java.exe"
:checkJvm
"%JAVACMD%" -version >nul 2>&1
if "%ERRORLEVEL%"=="0" goto run
echo Error: JAVA_HOME is not set and no 'java' command could be found in your PATH. >&2
exit /b 1
:run
set "WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
if exist "%WRAPPER_JAR%" goto exec
"%JAVACMD%" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" -cp "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar" org.apache.maven.wrapper.MavenWrapperMain %*
goto end
:exec
"%JAVACMD%" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" -cp "%WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*
:end
if "%ERRORLEVEL%"=="0" goto mainEnd
exit /b %ERRORLEVEL%
:mainEnd
endlocal
