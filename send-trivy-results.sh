#!/bin/bash

# Kullanım kontrolü
if [ "$#" -ne 1 ]; then
    echo "Kullanım: $0 <image-name>"
    echo "Örnek: $0 nginx:latest"
    exit 1
fi

IMAGE_NAME=$1
BACKEND_URL=${BACKEND_URL:-"http://localhost/api/scan-results"}
CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "🔍 $IMAGE_NAME taranıyor..."

# Trivy taraması yapılıyor ve sonuçlar geçici bir dosyaya kaydediliyor
TEMP_FILE=$(mktemp)
trivy image -f json "$IMAGE_NAME" > "$TEMP_FILE"

if [ $? -ne 0 ]; then
    echo "❌ Trivy taraması başarısız oldu"
    rm "$TEMP_FILE"
    exit 1
fi

# JSON formatında sonuçları hazırlama
echo "📦 Sonuçlar hazırlanıyor..."
jq -c --arg image "$IMAGE_NAME" --arg time "$CURRENT_TIME" \
    '{image_name: $image, scan_time: $time, vulnerabilities: .Results[].Vulnerabilities}' \
    "$TEMP_FILE" > "${TEMP_FILE}.formatted"

# Sonuçları backend'e gönderme
echo "📤 Sonuçlar gönderiliyor..."
RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d @"${TEMP_FILE}.formatted" \
    "$BACKEND_URL")

if [ $? -eq 0 ]; then
    echo "✅ Sonuçlar başarıyla gönderildi!"
else
    echo "❌ Sonuçlar gönderilirken hata oluştu"
    echo "Hata: $RESPONSE"
fi

# Geçici dosyaları temizleme
rm "$TEMP_FILE" "${TEMP_FILE}.formatted" 