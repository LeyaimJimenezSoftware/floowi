# FLW-11 Summary

## Ticket

**FLW-11 - Onboarding wizard 4 pasos: crear estudio slug unico y pagina lista en menos de 10 min**

## Objetivo

Permitir que una instructora complete el perfil inicial de su estudio despues del registro, con wizard guiado, slug unico, persistencia local, foto opcional y salida hacia dashboard.

## Gaps identificados y cierre dentro del ticket

- `main` local contiene el commit de landing sin pushear y no puede hacer fast-forward: se creo `FLW-11` desde `origin/main`, que ya contiene el merge de `FLW-37`.
- `FLW-37` crea tenant minimo: `FLW-11` no duplica creacion, solo completa perfil de estudio.
- Falta campo para saber si onboarding termino: se agrega `onboarding_completed_at`.
- Faltan campos del wizard en `Tenant`: se agregan `studio_type`, `cover_image_url` y `business_hours`.
- Falta disponibilidad/sugerencia de slug: se agrega endpoint publico `GET /api/tenants/check-slug/:slug`.
- Cloudinary puede no tener credenciales: se agrega endpoint de firma que responde `enabled: false` cuando faltan env vars; el frontend permite saltar foto o pegar URL.
- Falta base de auth/routing en frontend: se agrega estado minimo de auth local, rutas `/onboarding` y `/dashboard`.
- La landing local no debe mezclarse: esta rama parte de `origin/main` y no incluye archivos de landing/mockups.

## Plan

- Crear rama `FLW-11` desde `origin/main`.
- Agregar migracion y campos de tenant para onboarding.
- Crear `TenantsModule` con endpoints `me`, `check-slug`, `upload-signature` y update.
- Agregar wizard React de 4 pasos con localStorage.
- Integrar register owner minimo cuando no hay token.
- Agregar dashboard placeholder protegido.
- Verificar build, lint y tests.

## Implementacion

- Se creo rama `FLW-11` desde `origin/main` porque `main` local tenia la landing pendiente y no podia hacer fast-forward.
- Se agrego migracion `1713830400000-AddTenantOnboardingFields` con:
  - `studio_type`
  - `cover_image_url`
  - `business_hours`
  - `onboarding_completed_at`
- Se corrigio `data-source.ts` para registrar las migraciones nuevas de `FLW-37` y `FLW-11`.
- Se extendio `TenantEntity` con campos de onboarding.
- Se creo `TenantsModule` con `TenantsController` y `TenantsService`.
- Endpoints agregados:
  - `GET /api/tenants/check-slug/:slug`
  - `GET /api/tenants/me`
  - `PATCH /api/tenants/me`
  - `POST /api/tenants/upload-signature`
- `PATCH /api/tenants/me` queda protegido por JWT, tenant guard y rol owner.
- `check-slug` devuelve disponibilidad y sugerencia automatica.
- `upload-signature` devuelve `{ enabled: false }` si no hay credenciales Cloudinary, evitando bloquear el wizard.
- Se agrego `.env.example` con variables opcionales de Cloudinary.
- Se agrego estado auth minimo en frontend con `localStorage`.
- Se agrego interceptor Axios para enviar `Authorization: Bearer`.
- Se agrego API client de tenants/auth para el wizard.
- Se reemplazo la pantalla inicial por rutas:
  - `/`
  - `/onboarding`
  - `/dashboard`
- El wizard `/onboarding` incluye 4 pasos:
  - Datos del estudio y cuenta owner si no hay token.
  - Descripcion, direccion, Instagram y horarios.
  - Portada opcional con preview local o URL.
  - Confirmacion final y CTA al dashboard.
- El progreso del wizard se guarda en `localStorage` como `flowi.onboarding`.
- El dashboard placeholder redirige a onboarding si no hay auth o si el tenant no completo onboarding.
- Se corrigio validacion de `businessHours`: el DTO acepta mapa de dias y el service valida dias permitidos, boolean `enabled` y formato `HH:mm`.
- Se movio `FLW-37` a Finalizada en Jira y `FLW-11` a En curso.

## Verificacion

- `npm run test -w apps/api -- --runInBand` OK.
- `npm run build` OK.
- `npm run lint` OK.
- `npm run migration:run -w apps/api` OK contra Neon.
- `curl -I http://localhost:5173/onboarding` OK 200.
- `curl -I http://localhost:3001/api/health` OK 200.
- `curl http://localhost:3001/api/tenants/check-slug/sofia-pilates` OK, devuelve sugerencia cuando el slug existe.
- Prueba end-to-end API OK:
  - `POST /api/auth/register` crea owner + tenant minimo.
  - `PATCH /api/tenants/me` guarda descripcion, direccion, horarios y `onboarding_completed_at`.
- Dev servers activos:
  - Web: `http://localhost:5173/`
  - API: `http://localhost:3001/api`
- Nota: `pg` mantiene la advertencia de SSL `sslmode=require` tratada como `verify-full`; no bloquea.
