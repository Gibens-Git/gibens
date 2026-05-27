@echo off
start "Gibens Customer (5173)" cmd /k "cd /d C:\gibens\gibens\gibens\apps\customer && npx vite --port 5173"
start "Gibens Pro (5174)" cmd /k "cd /d C:\gibens\gibens\gibens\apps\pro && npx vite --port 5174"
start "Gibens Admin (5175)" cmd /k "cd /d C:\gibens\gibens\gibens\apps\admin && npx vite --port 5175"
