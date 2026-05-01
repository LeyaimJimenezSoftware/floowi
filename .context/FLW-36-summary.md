# FLW-36 Summary

## Ticket

**FLW-36 — Arquitectura multi-tenant: entidades TypeORM migraciones e indices PostgreSQL**

## Objetivo

Crear la base de datos multi-tenant de Flowi con row-level tenancy usando `tenantId` en todas las tablas del dominio, mas utilidades backend para reducir el riesgo de consultas cross-tenant.

## Plan

- Crear entidades TypeORM para tenants, users, packages, sessions, bookings, student packages, payments y refresh tokens.
- Agregar enums compartidos para roles, estados y providers.
- Crear migracion inicial con tablas, relaciones, constraints e indices requeridos.
- Agregar `TenantGuard`, `@CurrentTenant()` y un `TenantScopedRepository` para consultas que requieren `tenantId`.
- Agregar seed script con datos de prueba del MVP.
- Conectar TypeORM a un `data-source` reusable por migraciones y seed.
- Verificar con build y lint.

## Implementacion

- Se crearon entidades TypeORM para:
  - `TenantEntity`
  - `UserEntity`
  - `PackageEntity`
  - `SessionEntity`
  - `BookingEntity`
  - `StudentPackageEntity`
  - `PaymentEntity`
  - `RefreshTokenEntity`
- Se agregaron enums para roles, estados de sesiones, reservas, paquetes de alumnas, pagos y providers.
- Se agrego `TenantGuard` para exigir `tenantId` en requests autenticados.
- Se agrego `@CurrentTenant()` para inyectar el tenant actual en controllers.
- Se agrego `TenantScopedRepository<T>` para consultas que siempre mezclan `where` con `tenantId`.
- Se agrego `databaseEntities` para centralizar las entidades del runtime y del CLI.
- Se agrego `data-source.ts` para TypeORM CLI.
- Se agrego migracion inicial `1713657600000-InitialMultiTenantSchema` con:
  - Extension `pgcrypto`.
  - 8 tablas principales.
  - FKs, constraints, checks y unique constraints.
  - Indices requeridos por el ticket.
- Se agrego seed idempotente con:
  - 1 tenant `sofia-pilates`.
  - 1 owner.
  - 3 paquetes.
  - 10 sesiones.
  - 5 alumnas.
  - Pagos aprobados, student packages activos y reservas demo.
- Se agregaron scripts:
  - `npm run migration:run -w apps/api`
  - `npm run migration:revert -w apps/api`
  - `npm run seed -w apps/api`
- Se conecto `.env` local a Neon Postgres serverless para validar el flujo real.
- Se corrigieron columnas nullable de TypeORM declarando `type: 'varchar'` explicitamente donde TypeORM no podia inferir el tipo.

## Verificacion

- `npm run build` OK.
- `npm run lint` OK.
- `npm run migration:run -w apps/api` OK contra Neon.
- `npm run seed -w apps/api` OK contra Neon.
- Nota: `pg` muestra una advertencia de SSL indicando que `sslmode=require` hoy se trata como `verify-full`; no bloquea la conexion.
