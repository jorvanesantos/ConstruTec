@echo off
title ConstruTec - Iniciando Sistema
echo ========================================================
echo               CONSTRUTEC - INICIALIZADOR
echo ========================================================
echo.
echo 1. Verificando o Node.js no seu computador...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ATENCAO] O Node.js nao foi encontrado no seu computador!
    echo O ConstruTec e uma aplicacao moderna desenvolvida com React e TypeScript,
    echo por isso ela precisa do Node.js para rodar.
    echo.
    echo Como resolver:
    echo 1. Acesse https://nodejs.org e baixe a versao LTS (Recomendada).
    echo 2. Instale o Node.js (avancando as opcoes padrao).
    echo 3. Depois de instalado, clique duas vezes neste arquivo novamente!
    echo.
    pause
    exit /b
)

echo [OK] Node.js detectado!
echo.
echo 2. Verificando dependencias (npm install)...
if not exist node_modules (
    echo Baixando os pacotes necessarios pela primeira vez...
    echo (Isso pode levar alguns segundos, por favor aguarde...)
    call npm install
) else (
    echo [OK] Dependencias prontas!
)

echo.
echo 3. Iniciando o servidor ConstruTec na porta 3000...
echo Abrindo seu navegador automaticamente...
start http://localhost:3000

echo.
echo ========================================================
echo  Sistema ConstruTec esta RODANDO!
echo  Acesse: http://localhost:3000
echo.
echo  Para fechar o sistema quando terminar, basta fechar esta janela.
echo ========================================================
echo.

call npm run dev
pause
