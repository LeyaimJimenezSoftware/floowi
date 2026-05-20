import { CSSProperties, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getPublicStudio, PublicPackage, PublicSession, PublicStudio } from '@/lib/public-studio-api';

const studioTypeLabels: Record<string, string> = {
  pilates: 'Pilates',
  yoga: 'Yoga',
  gym: 'Gym',
  wellness: 'Wellness',
  other: 'Estudio boutique',
};

const dayLabels: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miercoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sabado',
  sunday: 'Domingo',
};

export function StudioPublicPage() {
  const { slug = '' } = useParams();
  const studioQuery = useQuery({
    queryKey: ['public-studio', slug],
    queryFn: () => getPublicStudio(slug),
    enabled: slug.length > 0,
  });

  useEffect(() => {
    if (!studioQuery.data) return;

    document.title = `${studioQuery.data.name} | Flowi`;
    const description =
      studioQuery.data.description ??
      `Reserva clases y conoce los paquetes de ${studioQuery.data.name}.`;
    const meta = document.querySelector('meta[name="description"]') ?? document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', description);
    document.head.appendChild(meta);
  }, [studioQuery.data]);

  if (studioQuery.isLoading) {
    return <PublicStudioSkeleton />;
  }

  if (studioQuery.isError || !studioQuery.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-sand-50 px-6 text-center">
        <section className="max-w-lg">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-terracotta-600">
            Estudio no encontrado
          </p>
          <h1 className="mt-4 font-display text-5xl text-sage-900">Esta pagina aun no existe.</h1>
          <p className="mt-4 text-stone-600">
            Revisa el enlace o vuelve a Flowi para crear tu propio estudio.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex rounded-flowi bg-sage-800 px-6 py-3 text-sm font-bold text-white"
          >
            Ir a Flowi
          </Link>
        </section>
      </main>
    );
  }

  return <StudioPublicView studio={studioQuery.data} />;
}

function StudioPublicView({ studio }: { studio: PublicStudio }) {
  const studioType = studio.studioType ? studioTypeLabels[studio.studioType] : 'Estudio boutique';
  const primaryColor = studio.themeColor || '#4A7C6F';
  const style = {
    '--studio-primary': primaryColor,
  } as CSSProperties;

  const cover =
    studio.coverImageUrl ||
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1800&q=85';

  return (
    <main style={style} className="min-h-screen bg-[#fbf8f1] text-sage-950">
      <nav className="fixed left-0 right-0 top-0 z-20 border-b border-white/25 bg-white/80 px-5 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="#top" className="font-display text-3xl text-sage-950">
            {studio.name}
          </a>
          <div className="hidden items-center gap-6 text-sm font-semibold text-sage-700 md:flex">
            <a href="#paquetes">Paquetes</a>
            <a href="#horarios">Horarios</a>
            <a href="#ubicacion">Ubicacion</a>
          </div>
          <a
            href="#paquetes"
            className="rounded-full px-5 py-2 text-sm font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Reservar
          </a>
        </div>
      </nav>

      <section id="top" className="relative min-h-[92vh] overflow-hidden">
        <img src={cover} alt={studio.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-[#fbf8f1]" />
        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end px-5 pb-20 pt-32 md:px-8">
          <p className="w-fit rounded-full bg-white/85 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-sage-900">
            {studioType} · {studio.address ?? 'Reserva online'}
          </p>
          <h1 className="mt-6 max-w-4xl font-display text-6xl leading-[0.92] text-white drop-shadow md:text-8xl">
            {studio.name}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90">
            {studio.description ??
              'Un espacio para moverte con calma, reservar sin mensajes cruzados y cuidar tu rutina.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#paquetes"
              className="rounded-flowi px-6 py-3 text-sm font-bold text-white shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              Ver paquetes
            </a>
            <a
              href="#horarios"
              className="rounded-flowi border border-white/50 bg-white/15 px-6 py-3 text-sm font-bold text-white backdrop-blur"
            >
              Ver horarios
            </a>
          </div>
        </div>
      </section>

      <section className="border-y border-sage-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-px md:grid-cols-4">
          <Credential label="Tipo" value={studioType} />
          <Credential label="Ubicacion" value={studio.address ?? 'Por confirmar'} />
          <Credential label="Paquetes" value={`${studio.packages.length} activos`} />
          <Credential label="Agenda" value="Reserva online" />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-[0.9fr_1.1fr] md:px-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-terracotta-600">
            Sobre el estudio
          </p>
          <h2 className="mt-4 font-display text-5xl leading-none text-sage-950">
            Un lugar pensado para volver a tu ritmo.
          </h2>
        </div>
        <div className="grid gap-5 text-stone-700">
          <p className="text-lg leading-8">
            {studio.description ??
              'Este estudio esta preparando su historia publica. Mientras tanto, puedes revisar sus paquetes y proximas clases disponibles.'}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {['Grupos pequenos', 'Reserva simple', 'Seguimiento claro'].map((value) => (
              <div key={value} className="rounded-flowi border border-sage-100 bg-white p-4">
                <p className="font-semibold text-sage-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="paquetes" className="bg-sage-900 px-5 py-20 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-terracotta-100">
                Paquetes
              </p>
              <h2 className="mt-4 font-display text-5xl leading-none">Elige como quieres venir.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/70">
              Compra un paquete y reserva tus clases sin coordinar por mensajes.
            </p>
          </div>
          {studio.packages.length > 0 ? (
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {studio.packages.map((packageItem) => (
                <PackageCard key={packageItem.id} packageItem={packageItem} primaryColor={primaryColor} />
              ))}
            </div>
          ) : (
            <EmptyPublicState
              title="Los paquetes estan por publicarse"
              text="La instructora aun no ha activado paquetes. Vuelve pronto o contacta al estudio para conocer opciones."
            />
          )}
        </div>
      </section>

      <section id="horarios" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-terracotta-600">
              Horarios
            </p>
            <h2 className="mt-4 font-display text-5xl leading-none text-sage-950">
              Proximas clases y disponibilidad.
            </h2>
            <BusinessHours studio={studio} />
          </div>
          {studio.upcomingSessions.length > 0 ? (
            <div className="grid gap-3">
              {studio.upcomingSessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <EmptyPublicState
              title="Calendario en preparacion"
              text="Aun no hay clases publicadas para los proximos dias. Este espacio quedara listo cuando el calendario este activo."
            />
          )}
        </div>
      </section>

      <section id="ubicacion" className="border-t border-sage-100 bg-white px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-terracotta-600">
              Ubicacion
            </p>
            <h2 className="mt-4 font-display text-5xl leading-none text-sage-950">
              Ven a clase con todo claro.
            </h2>
            <div className="mt-8 space-y-3 text-stone-700">
              <p>{studio.address ?? 'Direccion pendiente por confirmar.'}</p>
              {studio.phone && <p>Telefono: {studio.phone}</p>}
              {studio.instagram && <p>Instagram: @{studio.instagram}</p>}
            </div>
          </div>
          <div className="flex min-h-80 items-center justify-center rounded-flowi bg-sand-100 p-8 text-center">
            <p className="max-w-sm font-display text-3xl leading-tight text-sage-800">
              Google Maps se activara cuando integremos coordenadas y API key publica.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8">
        <div className="mx-auto max-w-7xl rounded-flowi p-8 text-white md:p-12" style={{ backgroundColor: primaryColor }}>
          <p className="font-mono text-xs uppercase tracking-[0.18em] opacity-80">Agenda. Cobra. Fluye.</p>
          <h2 className="mt-4 max-w-3xl font-display text-5xl leading-none">
            Tu siguiente clase puede reservarse sin un solo mensaje cruzado.
          </h2>
          <a href="#paquetes" className="mt-8 inline-flex rounded-flowi bg-white px-6 py-3 text-sm font-bold text-sage-900">
            Empezar ahora
          </a>
        </div>
      </section>

      <footer className="border-t border-sage-100 px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-stone-600 md:flex-row">
          <p>{studio.name}</p>
          <p>Powered by Flowi</p>
        </div>
      </footer>
    </main>
  );
}

function Credential({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <p className="mt-2 font-semibold text-sage-900">{value}</p>
    </div>
  );
}

function PackageCard({
  packageItem,
  primaryColor,
}: {
  packageItem: PublicPackage;
  primaryColor: string;
}) {
  return (
    <article className="rounded-flowi border border-white/15 bg-white p-6 text-sage-950">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-stone-500">
        {packageItem.totalClasses} clases · {packageItem.validityDays} dias
      </p>
      <h3 className="mt-4 font-display text-4xl leading-none">{packageItem.name}</h3>
      <p className="mt-4 min-h-12 text-sm leading-6 text-stone-600">
        {packageItem.description ?? 'Paquete flexible para mantener tu practica constante.'}
      </p>
      <p className="mt-6 font-display text-5xl">
        ${Number(packageItem.price).toLocaleString('es-MX')}
        <span className="ml-2 font-sans text-sm font-bold">{packageItem.currency}</span>
      </p>
      <button
        className="mt-6 w-full rounded-flowi px-5 py-3 text-sm font-bold text-white"
        style={{ backgroundColor: primaryColor }}
      >
        Comprar paquete
      </button>
    </article>
  );
}

function SessionRow({ session }: { session: PublicSession }) {
  const start = new Date(session.startTime);
  const end = new Date(session.endTime);
  const available = Math.max(0, session.maxCapacity - session.currentBookings);

  return (
    <article className="grid gap-4 rounded-flowi border border-sage-100 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-terracotta-600">
          {format(start, "EEEE d 'de' MMMM", { locale: es })}
        </p>
        <h3 className="mt-2 font-display text-3xl leading-none text-sage-950">{session.title}</h3>
        <p className="mt-2 text-sm text-stone-600">
          {format(start, 'HH:mm')} - {format(end, 'HH:mm')} · {session.location ?? 'Sala por confirmar'}
        </p>
      </div>
      <div className="rounded-flowi bg-sand-50 px-4 py-3 text-sm font-semibold text-sage-800">
        {available} lugares
      </div>
    </article>
  );
}

function BusinessHours({ studio }: { studio: PublicStudio }) {
  const hours = studio.businessHours;

  if (!hours) {
    return <p className="mt-6 text-sm text-stone-600">Horario por confirmar.</p>;
  }

  return (
    <div className="mt-8 grid gap-2">
      {Object.entries(hours).map(([day, value]) => (
        <div key={day} className="flex justify-between rounded-flowi bg-white px-4 py-3 text-sm">
          <span className="font-semibold text-sage-900">{dayLabels[day] ?? day}</span>
          <span className="text-stone-600">
            {value.enabled ? `${value.opens} - ${value.closes}` : 'Cerrado'}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyPublicState({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-10 rounded-flowi border border-dashed border-sage-200 bg-white/70 p-8 text-center text-sage-900">
      <h3 className="font-display text-4xl leading-none">{title}</h3>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-stone-600">{text}</p>
    </div>
  );
}

function PublicStudioSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-sand-50 px-5 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="h-[70vh] rounded-flowi bg-sage-100" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="h-40 rounded-flowi bg-white" />
          <div className="h-40 rounded-flowi bg-white" />
          <div className="h-40 rounded-flowi bg-white" />
        </div>
      </div>
    </main>
  );
}
