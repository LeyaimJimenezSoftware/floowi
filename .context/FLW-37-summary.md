# FLW-37 Summary

## Ticket

**FLW-37 - Auth: JWT Refresh Tokens Guards de roles owner instructor student**

## Objetivo

Implementar autenticacion segura para Flowi con registro de owner y student, login, refresh tokens revocables, logout, guards JWT y control por roles.

## Gaps identificados y cierre dentro del ticket

- `main` local trae landing sin pushear: se creo rama `FLW-37` desde `origin/main` para evitar mezclar scopes.
- Faltaban variables JWT en `.env.example` y validacion de entorno: se agregan y se vuelven obligatorias.
- Refresh tokens estaban modelados como token plano: se cambia a `tokenHash` y se agrega migracion de `token` a `token_hash`.
- `FLW-37` y `FLW-11` se solapan en crear tenant: en este ticket `register` crea tenant minimo (`name`, `slug`) y owner; onboarding completara perfil visual/contenido.
- Rate limit global no cubre login con fuerza suficiente: se aplica throttle especifico en `/auth/login`.
- No habia setup de tests API: se agrega Jest/ts-jest y tests unitarios enfocados de `AuthService`.
- `npm install` reporto vulnerabilidades transitivas: quedan documentadas; no se ejecuta `audit fix --force` para no romper versiones del stack.

## Plan

- Crear rama limpia `FLW-37` desde `origin/main`.
- Agregar dependencias JWT/passport y Jest para backend.
- Agregar variables de entorno de JWT y bcrypt.
- Implementar `AuthModule`, `AuthService`, `AuthController`, DTOs y estrategia JWT.
- Implementar `JwtAuthGuard`, `RolesGuard`, `@Roles()` y `@CurrentUser()`.
- Guardar refresh tokens hasheados en DB y revocarlos en logout.
- Verificar con build, lint y tests.

## Implementacion

- Se creo rama `FLW-37` desde `origin/main` para mantener el PR sin la landing local.
- Se agregaron dependencias backend:
  - `@nestjs/jwt`
  - `@nestjs/passport`
  - `passport`
  - `passport-jwt`
  - `jest`
  - `ts-jest`
  - tipos de Jest y Passport JWT
- Se agregaron variables obligatorias en `.env.example` y `env.validation.ts`:
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `JWT_ACCESS_EXPIRES_IN`
  - `JWT_REFRESH_EXPIRES_IN`
  - `BCRYPT_SALT_ROUNDS`
- Se agrego `AuthModule` con:
  - `AuthService`
  - `AuthController`
  - `JwtStrategy`
  - DTOs de register owner, register student, login y refresh/logout
- Endpoints implementados:
  - `POST /api/auth/register`
  - `POST /api/auth/register-student`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- `register` crea tenant minimo + user owner dentro de una transaccion.
- `register-student` crea alumna dentro del tenant segun `tenantSlug`.
- `login` soporta `tenantSlug` opcional y exige contexto si el email pertenece a mas de un tenant activo.
- Refresh tokens se emiten como JWT pero se guardan en DB como SHA-256 hash, nunca en texto plano.
- `refresh` rota el refresh token: elimina el anterior y emite uno nuevo.
- `logout` revoca el refresh token recibido.
- Se agregaron:
  - `JwtAuthGuard`
  - `RolesGuard`
  - `@Roles()`
  - `@CurrentUser()`
- Se agrego migracion `1713744000000-HashRefreshTokens` para renombrar `refresh_tokens.token` a `token_hash` y limpiar tokens previos.
- Se agrego setup de Jest en `apps/api/package.json` y tipos Jest en `apps/api/tsconfig.json`.
- Se agregaron tests unitarios de `AuthService` para:
  - register owner transaccional
  - login ambiguo con email multi-tenant
  - refresh token revocable y rotado

## Verificacion

- `npm run test -w apps/api -- --runInBand` OK.
- `npm run build` OK.
- `npm run lint` OK.
- Confirmado que la rama `FLW-37` parte de `origin/main` y no incluye los archivos de landing/mockups.
- Nota: `npm install` sigue reportando 26 vulnerabilidades transitivas. No se ejecuto `npm audit fix --force` porque puede introducir cambios incompatibles; queda como riesgo separado para triage de dependencias.
