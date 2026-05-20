# FLW-13 Summary

## Ticket

**FLW-13 - Pagina publica del estudio: landing completa con hero paquetes mapa horarios galeria y footer**

## Objetivo

Crear la pagina publica `/:slug` que convierte el onboarding en una URL compartible para alumnas, con datos reales del tenant y estados vacios elegantes para paquetes/sesiones hasta que existan sus CRUDs.

## Gaps identificados y cierre dentro del ticket

- `FLW-11` ya fue mergeado pero Jira seguia en curso: se mueve a Finalizada.
- `FLW-13` se mueve a En curso en Jira.
- Hay que partir de `origin/main` para incluir `FLW-11` y no mezclar landing local antigua.
- `FLW-13` depende de paquetes y sesiones, pero `FLW-15`/`FLW-16` aun no existen: se implementan queries reales con estados vacios y datos demo solo visuales cuando no hay data.
- Falta endpoint publico: se agrega `GET /api/public/studios/:slug`.
- Falta endpoint publico de sesiones por fecha: se agrega `GET /api/public/studios/:slug/sessions?date=YYYY-MM-DD`.
- Falta ruta frontend publica `/:slug`: se agrega con React Router.
- La ruta `/` quedo mostrando el placeholder de `FLW-11` porque la landing moderna vivia en la rama local `FLOW-Landing`: se restaura la landing en `App` y se conservan `/onboarding`, `/dashboard` y `/:slug`.
- Falta unit test: se agregan tests unitarios de `PublicStudiosService`.
- Open Graph dinamico real requiere SSR o metadata server-side; con Vite SPA se actualiza `document.title` y meta description en cliente, y se documenta limitacion.

## Plan

- Crear `PublicModule` backend con DTOs, controller, service y tests.
- Consultar tenant activo por slug, paquetes activos y sesiones proximas 7 dias.
- Crear pagina `StudioPublicPage` con hero, credenciales, sobre, paquetes, horarios, ubicacion, CTA, Instagram placeholder y footer.
- Aplicar CSS variables desde tenant.
- Agregar skeletons/estados vacios para paquetes y sesiones.
- Verificar build, lint y tests.

## Implementacion

- Se creo rama `FLW-13` desde `origin/main`.
- Se movio `FLW-11` a Finalizada en Jira y `FLW-13` a En curso.
- Se creo `PublicModule` backend con:
  - `PublicStudiosController`
  - `PublicStudiosService`
  - DTOs publicos de estudio, paquetes y sesiones
- Endpoints publicos agregados:
  - `GET /api/public/studios/:slug`
  - `GET /api/public/studios/:slug/sessions?date=YYYY-MM-DD`
- El endpoint principal consulta en paralelo:
  - tenant activo y con onboarding completo
  - paquetes activos ordenados por `sortOrder`
  - sesiones programadas de los proximos 7 dias
- Si el estudio no existe o no completo onboarding, responde 404.
- Se agregaron unit tests de `PublicStudiosService` para:
  - estudio publico con paquetes y sesiones
  - 404 si el slug no existe
  - 404 si onboarding no esta completo
  - sesiones publicas por fecha
- Se agrego API client frontend `public-studio-api.ts`.
- Se agrego pagina `StudioPublicPage` en ruta `/:slug`.
- Se restauro la landing moderna en `/` dentro de la rama `FLW-13` y sus CTA ahora navegan a `/onboarding`.
- La pagina publica incluye:
  - navbar
  - hero con portada real o imagen fallback
  - strip de credenciales
  - sobre el estudio
  - paquetes con estado vacio
  - horarios/sesiones con estado vacio
  - ubicacion/contacto
  - CTA final
  - footer Powered by Flowi
- Se aplican CSS variables desde `tenant.themeColor`.
- Se actualiza `document.title` y meta description en cliente.

## Verificacion

- `npm run test -w apps/api -- --runInBand` OK.
- `npm run build` OK.
- `npm run lint` OK.
- `npm run build -w apps/web` OK despues de restaurar la landing.
- `curl http://localhost:3001/api/public/studios/flowi-test-1850` OK.
- `curl -I http://localhost:5173/flowi-test-1850` OK 200.
- Nota: Open Graph dinamico real necesita SSR/pre-render o endpoint HTML por slug. En esta entrega SPA se actualiza metadata en cliente; queda documentado como limitacion tecnica futura.
