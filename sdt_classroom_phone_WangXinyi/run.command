#!/bin/bash
cd "$(dirname "$0")"
echo "课堂巡视员 SDT 实验"
echo "浏览器打开: http://localhost:8000"
python3 -m http.server 8000
