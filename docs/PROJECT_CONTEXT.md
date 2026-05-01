# Flowi Project Context

## Product

Flowi is a multi-tenant SaaS for Pilates, Yoga, and boutique fitness entrepreneurs in LATAM. It helps studio owners create a public studio page, sell class packages, accept payments, and let students book classes without manual WhatsApp or spreadsheet coordination.

Primary value proposition: "La plataforma SaaS mas facil y bonita para emprendedoras de Pilates, Yoga y Gym en LATAM. Empieza a aceptar reservas y pagos en menos de 10 minutos, sin necesidad de saber programar."

Brand taglines:

- "Tu estudio, a tu ritmo."
- "Agenda. Cobra. Fluye."

## Users

- `owner`: studio owner. Creates tenant, packages, sessions, sees finances and dashboard.
- `instructor`: future role. Manages sessions, no finance access.
- `student`: buys packages, books classes, sees remaining balance.

Core personas:

- Sofia: independent Pilates instructor with 10-40 active students, tired of managing WhatsApp and Excel.
- Valentina: growing studio owner with instructors, needs real-time control of packages and revenue.
- Andrea: new digital-first entrepreneur, wants a professional studio presence from day one.

## MVP Scope

Must-have:

- Multi-tenant owner registration and onboarding.
- Public studio profile at `flowi.app/:slug`.
- Class packages with total classes, validity days, price, currency, and active state.
- Session calendar and student bookings.
- MercadoPago and PayPal payments.
- Student package balance.
- Basic owner dashboard.
- Student email registration.
- Transactional emails for purchase, booking, and cancellation.
- Google Maps embed for studio location.
- Responsive web.

V1 later:

- WhatsApp notifications.
- Multiple instructors.
- Waitlist.
- Studio media and reviews.
- CSV reports.
- Discounts and coupons.

## Architecture Rules

- Stack is fixed unless the user approves a change.
- Frontend: React 18, Vite, TypeScript, TailwindCSS, TanStack Query v5, Zustand, React Hook Form, Zod, React Router v6, axios.
- Backend: NestJS 10, PostgreSQL 16, TypeORM, JWT plus refresh tokens, MercadoPago, PayPal, Resend, Cloudinary, Google Maps.
- Deploy targets: Vercel for web, Railway for API and database.
- Multi-tenancy is row-level with `tenantId` on tenant-scoped tables.
- Every tenant-scoped query must filter by `tenantId`.
- Payment-created records start as `pending`; never activate a student package before provider webhook confirmation.
- Payment webhooks are public routes and must verify provider signatures.
- TypeScript stays strict. Avoid `any`.
- Do not add new libraries without user confirmation.

## Main Data Model

- `tenants`: studio profile and public slug.
- `users`: owners, instructors, students; unique email per tenant.
- `packages`: package definitions created by owners.
- `sessions`: scheduled classes with capacity and status.
- `student_packages`: purchased packages with remaining classes and expiry.
- `bookings`: reservations linked to sessions and student packages.
- `payments`: payment provider state and metadata.
- `refresh_tokens`: revocable refresh tokens.

## Brand

Voice:

- Spanish first.
- Direct but warm.
- Human, not corporate.
- No startup-casual English.

Colors:

- Sage `#4A7C6F` primary.
- Sage Light `#E8F2EF`.
- Sage Dark `#2D5248`.
- Warm Sand `#F5F0E8` main background.
- Terracotta `#C4714F` accent.
- Stone scale for neutral text, borders, and surfaces.

Typography:

- Display: DM Serif Display.
- UI/body: DM Sans.
- Mono: JetBrains Mono.

Microcopy examples:

- "Tu primera clase lista en 10 minutos"
- "Tus alumnas pagan solas, tu cobras tranquila"
- "Algo salio mal de nuestro lado. Ya lo estamos revisando."
