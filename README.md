# Floowi App

Monorepo inicial para Flowi con `apps/api` en NestJS y `apps/web` en React + Vite + TypeScript.

## Requisitos

- Node.js 20.11 o superior
- npm 10 o superior
- Docker Desktop

## Setup local

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Crea tu archivo de variables:

   ```bash
   cp .env.example .env
   ```

3. Levanta PostgreSQL:

   ```bash
   docker-compose up -d
   ```

4. Arranca la API:

   ```bash
   npm run dev:api
   ```

   Health check: `http://localhost:3001/api/health`

   Swagger: `http://localhost:3001/api/docs`

5. En otra terminal, arranca la web:

   ```bash
   npm run dev:web
   ```

   Web: `http://localhost:5173`

## Scripts

- `npm run dev`: corre API y web en modo desarrollo.
- `npm run dev:api`: corre NestJS en watch mode.
- `npm run dev:web`: corre Vite.
- `npm run build`: compila todos los workspaces.
- `npm run lint`: ejecuta ESLint en todos los workspaces.
- `npm run format`: formatea el repo con Prettier.

## Variables críticas

La API falla al arrancar si falta una variable crítica de entorno:

- `API_PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `CORS_ORIGINS`

Las variables de PostgreSQL compartidas también están documentadas en `.env.example` para Docker Compose.
