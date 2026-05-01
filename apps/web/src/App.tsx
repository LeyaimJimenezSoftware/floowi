import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';

const apiBaseUrl = apiClient.defaults.baseURL;

export function App() {
  return (
    <main className="min-h-screen bg-sand-50 text-sage-900">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
        <p className="mb-4 font-mono text-sm uppercase tracking-normal text-terracotta-700">
          {format(new Date(), "d 'de' MMMM yyyy", { locale: es })}
        </p>
        <h1 className="max-w-3xl font-display text-5xl leading-tight text-sage-900 md:text-7xl">
          Floowi App esta lista para empezar.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-sage-700">
          Monorepo base con API NestJS, frontend React Vite TypeScript y PostgreSQL
          listo para desarrollo local.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <StatusTile label="Web" value="localhost:5173" />
          <StatusTile label="API" value={apiBaseUrl ?? 'http://localhost:3001/api'} />
          <StatusTile label="Ticket" value="FLW-35" />
        </div>
      </section>
    </main>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-flowi border border-sage-100 bg-white p-5 shadow-sm">
      <p className="font-mono text-xs uppercase tracking-normal text-sage-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-sage-900">{value}</p>
    </div>
  );
}
