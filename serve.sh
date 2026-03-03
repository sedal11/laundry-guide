#!/bin/bash
# ================================================
#  세탁 방법을 알려줘 - Mac/Linux 로컬 서버 실행 스크립트
#  Python3의 내장 HTTP 서버를 이용하여 로컬에서 실행합니다.
#  실행 전 Python3이 설치되어 있어야 합니다.
# ================================================

echo ""
echo " ===================================="
echo "  세탁 방법을 알려줘 - 로컬 서버 시작"
echo " ===================================="
echo ""
echo " http://localhost:8080 에서 접속하세요"
echo " 종료하려면 Ctrl+C를 누르세요"
echo ""

# Python3 설치 여부 확인
if ! command -v python3 &> /dev/null; then
    echo " [오류] Python3이 설치되어 있지 않습니다."
    echo " 아래 명령어로 Python3을 설치해주세요:"
    echo ""
    echo "   macOS:  brew install python3"
    echo "   Ubuntu: sudo apt install python3"
    echo ""
    exit 1
fi

# 스크립트 위치를 기준으로 서버 루트 디렉토리 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 포트 8080에서 HTTP 서버 실행
python3 -m http.server 8080