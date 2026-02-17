#!/bin/bash

# LiveKit 서비스 상태 확인 스크립트

echo "==================================="
echo "LiveKit 서비스 상태 확인"
echo "==================================="
echo ""

# 포트 27880 확인
echo "1. LiveKit 포트 확인 (27880):"
if lsof -i :27880 > /dev/null 2>&1; then
    echo "✓ 포트 27880에서 서비스가 실행 중입니다."
    lsof -i :27880
else
    echo "✗ 포트 27880에서 실행 중인 서비스가 없습니다."
    echo "  LiveKit 서버를 시작해야 합니다."
fi

echo ""
echo "2. Docker 컨테이너 확인:"
if docker ps | grep livekit > /dev/null 2>&1; then
    echo "✓ LiveKit Docker 컨테이너가 실행 중입니다."
    docker ps | grep livekit
else
    echo "✗ LiveKit Docker 컨테이너가 실행되지 않았습니다."
    echo "  docker-compose up -d livekit 명령으로 시작하세요."
fi

echo ""
echo "3. 환경 변수 확인:"
if [ -f .env ]; then
    echo "LIVEKIT_API_KEY=$(grep LIVEKIT_API_KEY .env | cut -d '=' -f2 | sed 's/"//g')"
    echo "LIVEKIT_API_SECRET=$(grep LIVEKIT_API_SECRET .env | cut -d '=' -f2 | sed 's/"//g' | sed 's/./*/g')"
    echo "NEXT_PUBLIC_LIVEKIT_URL=$(grep NEXT_PUBLIC_LIVEKIT_URL .env | cut -d '=' -f2 | sed 's/"//g')"
else
    echo "✗ .env 파일을 찾을 수 없습니다."
fi

echo ""
echo "==================================="
echo "해결 방법:"
echo "==================================="
echo "1. LiveKit을 사용하지 않는 경우:"
echo "   .env 파일에서 LiveKit 관련 변수를 주석 처리하세요."
echo ""
echo "2. LiveKit을 사용하는 경우:"
echo "   docker-compose.yml 파일을 확인하고"
echo "   docker-compose up -d livekit 명령으로 서비스를 시작하세요."
echo ""
