@echo off
REM �ر� L4D2 ������
taskkill /IM srcds.exe /F

REM �ȴ� 2 �����˿�ռ��
timeout /t 2 /nobreak >nul

REM ���� L4D2 ����������̨���У�
start "" "./srcds.exe" -game left4dead2 -console -insecure -tickrate 60 -condebug +hostport 27015 +exec server.cfg