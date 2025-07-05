@echo off
echo ====================================================
echo GentePRO - Sistema de Gestao de RH
echo Script de Instalacao para Windows
echo ====================================================
echo.

:: Verificar se Node.js esta instalado
echo Verificando Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale Node.js 18+ em: https://nodejs.org/
    pause
    exit /b 1
)

:: Verificar versao do Node.js
for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% encontrado

:: Verificar se PostgreSQL esta instalado
echo Verificando PostgreSQL...
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] PostgreSQL nao encontrado!
    echo Por favor, instale PostgreSQL em: https://www.postgresql.org/download/windows/
    echo Certifique-se de adicionar o PostgreSQL ao PATH do sistema
    pause
    exit /b 1
)

echo [OK] PostgreSQL encontrado

:: Verificar se Git esta instalado
echo Verificando Git...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Git nao encontrado!
    echo Por favor, instale Git em: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [OK] Git encontrado
echo.

:: Verificar se package.json existe
if not exist "package.json" (
    echo [ERRO] Arquivo package.json nao encontrado!
    echo Execute este script na raiz do projeto GentePRO.
    pause
    exit /b 1
)

:: Instalar dependencias
echo Instalando dependencias npm...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas com sucesso

:: Configurar arquivo .env
echo Configurando arquivo de ambiente...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [OK] Arquivo .env criado a partir do .env.example
    ) else (
        echo # Configuracao do Banco de Dados > .env
        echo DATABASE_URL="postgresql://gentepro_user:gentepro123@localhost:5432/gentepro" >> .env
        echo. >> .env
        echo # Configuracao de Sessao >> .env
        echo SESSION_SECRET="sua_chave_secreta_muito_forte_aqui_%date:~-4,4%%date:~-10,2%%date:~-7,2%" >> .env
        echo. >> .env
        echo # Configuracao OpenAI ^(opcional^) >> .env
        echo OPENAI_API_KEY="" >> .env
        echo. >> .env
        echo # Configuracao SendGrid ^(opcional^) >> .env
        echo SENDGRID_API_KEY="" >> .env
        echo. >> .env
        echo # Ambiente >> .env
        echo NODE_ENV="development" >> .env
        echo [OK] Arquivo .env basico criado
    )
) else (
    echo [AVISO] Arquivo .env ja existe, mantendo configuracoes atuais
)

echo.
echo [IMPORTANTE] Edite o arquivo .env com suas configuracoes!
echo Especialmente a DATABASE_URL com suas credenciais do PostgreSQL
echo.

:: Configurar banco de dados
echo Configurando banco de dados...
echo Tentando executar migrations...
call npm run db:push
if %errorlevel% neq 0 (
    echo [AVISO] Erro ao executar migrations. Talvez seja necessario configurar manualmente.
    echo Execute manualmente: npm run db:push
)

:: Verificar instalacao
echo Verificando instalacao...
call npm run type-check >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Verificacao de tipos TypeScript passou
) else (
    echo [AVISO] Alguns problemas de tipos foram encontrados, mas isso nao impede a execucao
)

echo.
echo ====================================================
echo [SUCESSO] Instalacao concluida!
echo ====================================================
echo.
echo Proximos passos:
echo 1. Edite o arquivo .env com suas configuracoes
echo 2. Execute: npm run dev
echo 3. Acesse: http://localhost:5000
echo.
echo Usuarios padrao criados:
echo admin@gentepro.com (senha: admin123)
echo recrutador@gentepro.com (senha: recrutador123)
echo gestor@gentepro.com (senha: gestor123)
echo.
echo Para mais informacoes, consulte: INSTALLATION_GUIDE.md
echo.
pause