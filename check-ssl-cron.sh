#!/bin/bash

# Her dakika kontrol et ve logla
while true; do
  current_time=$(date +"%H:%M")
  echo "----------------------------------------"
  echo "System Time: $(date)"
  echo "Running check at: $current_time"
  
  response=$(curl -s -X GET "http://web:3000/api/cron/check-expiry")
  echo "Response: $response"
  
  echo "Check completed at: $(date +"%Y-%m-%d %H:%M:%S")"
  echo "----------------------------------------"
  
  sleep 60
done
