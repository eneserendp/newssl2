#!/bin/bash

echo "Starting SSL check cron service..."
echo "Current timezone: $(date)"

# Web servisinin hazır olmasını bekle
while ! curl -s http://web:3000/api/health; do
    echo "Waiting for web service to be ready..."
    sleep 5
done

echo "Web service is ready. Starting cron checks..."

# Ana döngü
while true; do
    echo "[$(date)] Running SSL check..."
    
    # API'yi çağır
    RESPONSE=$(curl -s http://web:3000/api/cron/check-expiry)
    echo "[$(date)] Response: $RESPONSE"
    
    # 60 saniye bekle
    sleep 60
done
