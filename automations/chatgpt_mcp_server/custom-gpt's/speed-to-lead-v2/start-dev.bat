@echo off
setlocal EnableExtensions
cd /d "%~dp0"
call "%~dp0..\..\..\..\..\..\agent_tools\scripts\npm-ca.cmd" run dev
