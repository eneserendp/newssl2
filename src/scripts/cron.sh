#!/bin/bash

# Her dakika kontrol et
while true; do
  # API'yi çağır
  curl -s http://localhost:3000/api/cron/check-expiry

  # 1 dakika bekle
  sleep 60
done
