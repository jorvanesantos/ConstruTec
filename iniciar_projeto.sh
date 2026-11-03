#!/bin/bash
echo "========================================================"
echo "              CONSTRUTEC - INICIALIZADOR"
echo "========================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERRO] Node.js não foi encontrado!"
    echo "Instale o Node.js em: https://nodejs.org"
    exit 1
fi

echo "[OK] Node.js encontrado."

if [ ! -d "node_modules" ]; then
    echo "Instalando dependências (npm install)..."
    npm install
fi

echo "Iniciando servidor ConstruTec..."
echo "Acesse: http://localhost:3000"

if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000 &
elif command -v open &> /dev/null; then
    open http://localhost:3000 &
fi

npm run dev
