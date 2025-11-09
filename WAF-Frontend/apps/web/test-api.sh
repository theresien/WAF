#!/bin/bash
MAC="fa:79:f2:fe:4d:fa"

echo "Testing BAN endpoint..."
curl -s -X POST "http://localhost:8080/api/policy/devices/$MAC/ban" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test ban"}' | jq -r '.status'

echo "Testing ALLOW endpoint..."
curl -s -X POST "http://localhost:8080/api/policy/devices/$MAC/allow" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test allow"}' | jq -r '.status'
