@echo off
REM �ر� L4D2 ������
taskkill /IM srcds.exe /F

@REM ��ѡ�����ն˿ڹرս���
@REM for /f "tokens=5" %%a in ('netstat -ano ^| findstr :27015') do (
@REM     taskkill /PID %%a /F 2>nul
@REM )

REM �ȴ� 2 �����˿�ռ��
timeout /t 2 /nobreak >nul

REM ���� L4D2 ����������̨���У�
start "" "./srcds.exe" -game left4dead2 -console -insecure -tickrate 60 -condebug +hostport 27015 +exec server.cfg