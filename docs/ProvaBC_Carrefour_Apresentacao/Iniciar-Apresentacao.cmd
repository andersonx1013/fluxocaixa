@echo off
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Iniciar-Apresentacao.ps1"
if errorlevel 1 pause
