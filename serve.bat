@echo off
REM ================================================
REM  세탁 방법을 알려줘 - Windows 로컬 서버 실행 스크립트
REM  Python의 내장 HTTP 서버를 이용하여 로컬에서 실행합니다.
REM  실행 전 Python이 설치되어 있어야 합니다.
REM ================================================

echo.
echo  ====================================
echo   세탁 방법을 알려줘 - 로컬 서버 시작
echo  ====================================
echo.
echo  http://localhost:8080 에서 접속하세요
echo  종료하려면 Ctrl+C를 누르세요
echo.

REM Python 설치 여부 확인
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [오류] Python이 설치되어 있지 않습니다.
    echo  https://www.python.org/downloads/ 에서 Python을 설치해주세요.
    pause
    exit /b 1
)

REM 스크립트 위치를 기준으로 서버 루트 디렉토리 설정
cd /d "%~dp0"

REM 포트 8080에서 HTTP 서버 실행
python -m http.server 8080