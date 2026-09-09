@echo off
title THRINETHRA Command Center
echo Starting THRINETHRA Command Center & Neon DB Connection...
start "" http://localhost:3000/login.html
node server.js
pause
