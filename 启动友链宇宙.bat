@echo off
chcp 65001 >nul
title 友链宇宙 - 本地服务器
cd /d "%~dp0"
echo.
echo  正在启动友链宇宙本地服务器...
echo  请稍候，浏览器将自动打开 http://localhost:8123/
echo  关闭此窗口即可停止服务器
echo.
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8123/"
python server.py 8123
pause
