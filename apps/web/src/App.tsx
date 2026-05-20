import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  BusinessDay,
  checkSlug,
  getMyTenant,
  getUploadSignature,
  registerOwner,
  updateMyTenant,
} from '@/lib/tenant-api';
import { slugify } from '@/lib/slug';
import { getStoredAuth, storeAuth } from '@/state/auth';

type Draft = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  studioName: string;
  slug: string;
  studioType: string;
  description: string;
  address: string;
  phone: string;
  instagram: string;
  coverImageUrl: string;
  businessHours: Record<string, BusinessDay>;
};

const defaultHours: Record<string, BusinessDay> = {
  monday: { enabled: true, opens: '07:00', closes: '19:00' },
  tuesday: { enabled: true, opens: '07:00', closes: '19:00' },
  wednesday: { enabled: true, opens: '07:00', closes: '19:00' },
  thursday: { enabled: true, opens: '07:00', closes: '19:00' },
  friday: { enabled: true, opens: '07:00', closes: '17:00' },
  saturday: { enabled: false, opens: '09:00', closes: '13:00' },
  sunday: { enabled: false, opens: '09:00', closes: '13:00' },
};

const dayLabels: Record<string, string> = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mie',
  thursday: 'Jue',
  friday: 'Vie',
  saturday: 'Sab',
  sunday: 'Dom',
};

const productHighlights = [
  {
    label: 'Agenda en linea',
    title: 'Tus alumnas reservan solas',
    text: 'Comparte tu link, muestra horarios disponibles y deja que cada alumna aparte su lugar sin interrumpir tu clase.',
  },
  {
    label: 'Paquetes',
    title: 'Clases, vigencia y saldo automatico',
    text: 'Crea paquetes con numero de clases, precio y vencimiento. Flowi descuenta cada reserva y te avisa cuando algo esta por vencer.',
  },
  {
    label: 'Pagos LATAM',
    title: 'MercadoPago y PayPal listos',
    text: 'Cobra con metodos familiares para tus alumnas y activa paquetes solo cuando el proveedor confirme el pago.',
  },
];

const landingPackages = [
  {
    name: 'Starter',
    price: '$299',
    description: 'Para instructoras que estan empezando.',
    features: ['Hasta 30 alumnas', 'Pagina publica', 'Paquetes y reservas'],
  },
  {
    name: 'Pro',
    price: '$599',
    description: 'Para estudios con agenda activa.',
    features: ['Hasta 100 alumnas', 'Dashboard completo', 'Pagos y recordatorios'],
    featured: true,
  },
  {
    name: 'Studio',
    price: '$999',
    description: 'Para equipos y estudios en crecimiento.',
    features: ['Alumnas ilimitadas', 'Varias instructoras', 'Reportes y prioridad'],
  },
];

const workflow = [
  'Crea tu estudio',
  'Publica tus paquetes',
  'Comparte tu link',
  'Recibe reservas y pagos',
];

const initialDraft: Draft = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  studioName: '',
  slug: '',
  studioType: 'pilates',
  description: '',
  address: '',
  phone: '',
  instagram: '',
  coverImageUrl: '',
  businessHours: defaultHours,
};

export function App() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#1C1917]">
      <HomePage />
    </main>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => readDraft());
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [localCoverPreview, setLocalCoverPreview] = useState<string | null>(null);

  const tenantQuery = useQuery({
    queryKey: ['tenant-me'],
    queryFn: getMyTenant,
    enabled: Boolean(auth),
  });

  const registerMutation = useMutation({
    mutationFn: registerOwner,
    onSuccess: (response) => {
      storeAuth(response);
      setAuth(response);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateMyTenant,
    onSuccess: (tenant) => {
      if (tenant.onboardingCompletedAt) {
        localStorage.removeItem('flowi.onboarding');
        navigate('/dashboard');
      }
    },
  });

  const signatureQuery = useQuery({
    queryKey: ['cloudinary-signature'],
    queryFn: getUploadSignature,
    enabled: Boolean(auth) && step === 2,
  });

  useEffect(() => {
    localStorage.setItem('flowi.onboarding', JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    if (!draft.studioName || draft.slug) return;
    setDraft((current) => ({ ...current, slug: slugify(current.studioName) }));
  }, [draft.studioName, draft.slug]);

  useEffect(() => {
    if (draft.slug.length < 3) {
      setSlugStatus('idle');
      return;
    }

    const timeout = window.setTimeout(() => {
      setSlugStatus('checking');
      void checkSlug(draft.slug).then((result) => {
        setDraft((current) => ({ ...current, slug: result.slug }));
        setSlugStatus(result.available || result.slug === tenantQuery.data?.slug ? 'available' : 'taken');
      });
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [draft.slug, tenantQuery.data?.slug]);

  useEffect(() => {
    const tenant = tenantQuery.data;
    if (!tenant) return;

    setDraft((current) => ({
      ...current,
      studioName: tenant.name || current.studioName,
      slug: tenant.slug || current.slug,
      studioType: tenant.studioType || current.studioType,
      description: tenant.description || current.description,
      address: tenant.address || current.address,
      phone: tenant.phone || current.phone,
      instagram: tenant.instagram || current.instagram,
      coverImageUrl: tenant.coverImageUrl || current.coverImageUrl,
      businessHours: tenant.businessHours || current.businessHours,
    }));
  }, [tenantQuery.data]);

  const progress = ((step + 1) / 4) * 100;
  const publicUrl = `flowi.app/${draft.slug || 'tu-estudio'}`;
  const canContinue = getStepValidity(step, draft, auth !== null, slugStatus);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canContinue) return;

    if (step === 0) {
      if (!auth) {
        await registerMutation.mutateAsync({
          email: draft.email,
          password: draft.password,
          firstName: draft.firstName,
          lastName: draft.lastName,
          studioName: draft.studioName,
          slug: draft.slug,
        });
      } else {
        await updateMutation.mutateAsync({
          name: draft.studioName,
          slug: draft.slug,
          studioType: draft.studioType,
          phone: draft.phone || undefined,
        });
      }
      setStep(1);
      return;
    }

    if (step === 1) {
      await updateMutation.mutateAsync({
        description: draft.description,
        address: draft.address,
        businessHours: draft.businessHours,
      });
      setStep(2);
      return;
    }

    if (step === 2) {
      await updateMutation.mutateAsync({
        coverImageUrl: draft.coverImageUrl || undefined,
      });
      setStep(3);
      return;
    }

    await updateMutation.mutateAsync({ completeOnboarding: true });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e8f2ef_0,#fbf8f1_36%,#f5f0e8_100%)] px-4 py-6 text-sage-900 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="flex flex-col justify-between rounded-flowi border border-sage-100 bg-white/75 p-6 shadow-sm backdrop-blur">
          <div>
            <Link to="/" className="font-display text-3xl text-sage-900">
              Flowi
            </Link>
            <p className="mt-8 font-mono text-xs uppercase tracking-[0.18em] text-terracotta-600">
              Paso {step + 1} de 4
            </p>
            <h1 className="mt-3 font-display text-5xl leading-none text-sage-900">
              Tu estudio listo para compartir.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-stone-600">
              Completa lo esencial: identidad, historia, horarios y portada. El objetivo es salir
              de aqui con una URL clara para tus alumnas.
            </p>
            <div className="mt-8 h-2 rounded-full bg-sand-200">
              <div
                className="h-full rounded-full bg-terracotta-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-10 rounded-flowi border border-sage-100 bg-sand-50 p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-sage-600">
              Vista publica
            </p>
            <p className="mt-3 break-words font-display text-3xl leading-none text-sage-900">
              {draft.studioName || 'Tu estudio'}
            </p>
            <p className="mt-3 rounded-full bg-white px-3 py-2 font-mono text-xs text-sage-700">
              {publicUrl}
            </p>
          </div>
        </aside>

        <section className="rounded-flowi border border-sage-100 bg-white p-5 shadow-sm md:p-8">
          <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-full flex-col">
            {step === 0 && (
              <StepStudio
                authReady={auth !== null}
                draft={draft}
                slugStatus={slugStatus}
                setDraft={setDraft}
              />
            )}
            {step === 1 && <StepStory draft={draft} setDraft={setDraft} />}
            {step === 2 && (
              <StepCover
                draft={draft}
                signatureEnabled={signatureQuery.data?.enabled ?? false}
                localCoverPreview={localCoverPreview}
                setDraft={setDraft}
                setLocalCoverPreview={setLocalCoverPreview}
              />
            )}
            {step === 3 && <StepDone draft={draft} />}

            <div className="mt-auto flex flex-col-reverse gap-3 border-t border-sage-100 pt-5 sm:flex-row sm:justify-between">
              <button
                type="button"
                className="rounded-flowi border border-sage-200 px-5 py-3 text-sm font-semibold text-sage-700 disabled:opacity-40"
                disabled={step === 0}
                onClick={() => setStep((current) => Math.max(0, current - 1))}
              >
                Atras
              </button>
              <button
                type="submit"
                disabled={!canContinue || registerMutation.isPending || updateMutation.isPending}
                className="rounded-flowi bg-sage-800 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {step === 3 ? 'Ir a mi dashboard' : 'Continuar'}
              </button>
            </div>

            {(registerMutation.error || updateMutation.error) && (
              <p className="mt-4 rounded-flowi bg-terracotta-50 px-4 py-3 text-sm text-terracotta-600">
                No pudimos guardar este paso. Revisa los datos e intenta otra vez.
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}

export function DashboardPage() {
  const auth = getStoredAuth();
  const tenantQuery = useQuery({
    queryKey: ['tenant-me'],
    queryFn: getMyTenant,
    enabled: Boolean(auth),
  });

  if (!auth) return <Navigate to="/onboarding" replace />;

  if (tenantQuery.data && !tenantQuery.data.onboardingCompletedAt) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <main className="min-h-screen bg-sand-50 px-6 py-8 text-sage-900">
      <section className="mx-auto max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-terracotta-600">
          Dashboard
        </p>
        <h1 className="mt-4 font-display text-5xl">Bienvenida, {auth.user.firstName}</h1>
        <p className="mt-4 max-w-2xl text-stone-600">
          Tu estudio esta listo. El siguiente ticket llenara esta pantalla con metricas, sesiones y
          accesos rapidos.
        </p>
        <div className="mt-8 rounded-flowi border border-sage-100 bg-white p-6 shadow-sm">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-sage-500">
            URL publica
          </p>
          <p className="mt-3 font-display text-3xl">
            flowi.app/{tenantQuery.data?.slug ?? 'tu-estudio'}
          </p>
        </div>
      </section>
    </main>
  );
}

function HomePage() {
  return (
    <>
      <Navigation />
      <Hero />
      <TrustStrip />
      <ProductSection />
      <StudioPreview />
      <PricingSection />
      <WorkflowSection />
      <FinalCta />
      <Footer />
    </>
  );
}

function Navigation() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center border-b border-[#E8E0D4] bg-[#FAF7F2]/90 px-5 backdrop-blur-md md:px-12">
      <a
        href="#inicio"
        className="font-editorial text-2xl uppercase tracking-[0.12em] text-[#1C1917]"
      >
        flowi<span className="text-[#4A7C6F]">.</span>
      </a>
      <div className="ml-auto hidden items-center gap-7 text-xs font-medium uppercase tracking-[0.08em] text-[#78716C] md:flex">
        <a href="#producto" className="transition hover:text-[#1C1917]">
          Producto
        </a>
        <a href="#precios" className="transition hover:text-[#1C1917]">
          Precios
        </a>
        <a href="#flujo" className="transition hover:text-[#1C1917]">
          Como funciona
        </a>
      </div>
      <Link
        to="/onboarding"
        className="ml-auto rounded-full bg-[#4A7C6F] px-5 py-2.5 text-xs font-medium uppercase tracking-[0.08em] text-white md:ml-8"
      >
        Crear mi estudio
      </Link>
    </nav>
  );
}

function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#1C1917] px-6 pt-16 text-center"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#1E1D1A_0%,#2C2B28_42%,#1A2822_100%)]" />
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            'radial-gradient(circle at 28% 48%, rgba(122,158,142,0.18) 0%, transparent 56%), radial-gradient(circle at 82% 18%, rgba(196,113,79,0.10) 0%, transparent 44%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />

      <div className="relative mx-auto max-w-4xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#7A9E8E]/40 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#C5DDD8]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7A9E8E]" />
          SaaS para estudios boutique en LATAM
        </div>
        <h1 className="font-editorial text-[4.25rem] font-light leading-[0.92] text-white md:text-8xl">
          Tu estudio,
          <br />
          <em className="text-[#C5DDD8]">a tu ritmo.</em>
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-base leading-8 text-white/60">
          Flowi convierte tu agenda, tus paquetes y tus cobros en una experiencia online bonita,
          simple y profesional para tus alumnas.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/onboarding"
            className="rounded-full bg-[#4A7C6F] px-8 py-4 text-sm font-medium uppercase tracking-[0.06em] text-white"
          >
            Empezar gratis
          </Link>
          <a
            href="#producto"
            className="rounded-full border border-white/20 px-8 py-4 text-sm font-medium uppercase tracking-[0.06em] text-white/70"
          >
            Ver producto
          </a>
        </div>
      </div>

      <div className="absolute bottom-10 right-8 hidden flex-col gap-5 text-right md:flex">
        <HeroStat value="10 min" label="setup inicial" />
        <HeroStat value="3 pasos" label="agenda, cobra, fluye" />
        <HeroStat value="LATAM" label="pagos locales" />
      </div>
    </section>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-editorial text-4xl font-light leading-none text-white">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">
        {label}
      </div>
    </div>
  );
}

function TrustStrip() {
  return (
    <section className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 bg-[#4A7C6F] px-6 py-4 text-xs uppercase tracking-[0.08em] text-white">
      <span>Reservas online</span>
      <span className="h-1 w-1 rounded-full bg-white/40" />
      <span>MercadoPago nativo</span>
      <span className="h-1 w-1 rounded-full bg-white/40" />
      <span>Paquetes con vigencia</span>
      <span className="h-1 w-1 rounded-full bg-white/40" />
      <span>Pagina publica para cada estudio</span>
    </section>
  );
}

function ProductSection() {
  return (
    <section
      id="producto"
      className="grid gap-16 bg-[#FAF7F2] px-6 py-24 md:grid-cols-[0.9fr_1.1fr] md:px-12"
    >
      <div>
        <p className="section-tag">Producto</p>
        <h2 className="section-heading">
          La operacion diaria,
          <br />
          <em>sin el caos.</em>
        </h2>
        <p className="mt-6 max-w-xl text-[15px] leading-8 text-[#78716C]">
          Flowi esta pensado para instructoras que quieren administrar su estudio con la misma calma
          y cuidado con la que dan una clase.
        </p>
      </div>
      <div className="grid gap-4">
        {productHighlights.map((item, index) => (
          <article
            key={item.title}
            className="group grid gap-5 rounded-md border border-[#E8E0D4] bg-white p-7 transition hover:border-[#C5DDD8] md:grid-cols-[64px_1fr]"
          >
            <div className="font-mono text-xs text-[#A8A29E]">0{index + 1}</div>
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#4A7C6F]">
                {item.label}
              </p>
              <h3 className="font-editorial text-3xl font-light text-[#1C1917]">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#78716C]">{item.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function StudioPreview() {
  return (
    <section className="bg-[#1C1917] px-6 py-24 text-white md:px-12">
      <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <p className="section-tag text-[#C5DDD8]">Tu pagina publica</p>
          <h2 className="section-heading text-white">
            Tu estudio se ve
            <br />
            <em className="text-[#C5DDD8]">tan profesional como tu clase.</em>
          </h2>
        </div>
        <p className="max-w-lg text-[15px] leading-8 text-white/50">
          Cada estudio tiene su URL, paquetes, horarios, ubicacion y un flujo de reserva pensado
          para que la alumna compre sin pedir instrucciones.
        </p>
      </div>

      <div className="overflow-hidden rounded-md border border-white/10 bg-white/[0.04]">
        <div className="grid md:grid-cols-[1.15fr_0.85fr]">
          <div
            className="min-h-[420px] bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(rgba(28,25,23,0.08), rgba(28,25,23,0.14)), url('https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?auto=format&fit=crop&w=1400&q=80')",
            }}
          />
          <div className="flex flex-col justify-center bg-[#FAF7F2] p-8 text-[#1C1917] md:p-12">
            <p className="mb-5 inline-flex w-fit rounded-full border border-[#C5DDD8] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#4A7C6F]">
              flowi.app/sofia-pilates
            </p>
            <h3 className="font-editorial text-5xl font-light leading-none">
              Sofia Pilates
              <br />
              <em className="text-[#4A7C6F]">reserva online.</em>
            </h3>
            <p className="mt-6 text-sm leading-7 text-[#78716C]">
              Paquetes visibles, horarios disponibles, mapa del estudio y pago conectado en un solo
              lugar.
            </p>
            <div className="mt-8 grid gap-3">
              <PreviewRow label="Paquete Inicio" value="$350 MXN" />
              <PreviewRow label="Clase disponible" value="Martes 7:00" />
              <PreviewRow label="Cupo" value="8 de 10 alumnas" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#E8E0D4] pb-3 text-sm">
      <span className="text-[#78716C]">{label}</span>
      <strong className="font-medium text-[#1C1917]">{value}</strong>
    </div>
  );
}

function PricingSection() {
  return (
    <section id="precios" className="bg-[#FAF7F2] px-6 py-24 md:px-12">
      <p className="section-tag">Precios</p>
      <h2 className="section-heading">
        Un plan para cada
        <br />
        <em>momento del estudio.</em>
      </h2>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {landingPackages.map((item) => (
          <article
            key={item.name}
            className={`relative rounded-md border bg-white p-7 ${
              item.featured ? 'border-[#4A7C6F]' : 'border-[#E8E0D4]'
            }`}
          >
            {item.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#4A7C6F] px-4 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-white">
                Recomendado
              </span>
            )}
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#78716C]">
              {item.name}
            </p>
            <p className="mt-4 font-editorial text-5xl font-light text-[#1C1917]">
              {item.price}
              <span className="font-sans text-sm text-[#78716C]"> MXN/mes</span>
            </p>
            <p className="mt-4 text-sm leading-7 text-[#78716C]">{item.description}</p>
            <div className="my-6 h-px bg-[#E8E0D4]" />
            <ul className="grid gap-3">
              {item.features.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm text-[#57534E]">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#4A7C6F]" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              to="/onboarding"
              className={`mt-8 inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-medium ${
                item.featured ? 'bg-[#4A7C6F] text-white' : 'bg-[#F2EDE4] text-[#57534E]'
              }`}
            >
              Elegir plan
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="flujo" className="bg-[#F2EDE4] px-6 py-24 md:px-12">
      <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="section-tag">Como funciona</p>
          <h2 className="section-heading">
            Del registro al primer link
            <br />
            <em>en minutos.</em>
          </h2>
        </div>
        <div className="grid gap-3">
          {workflow.map((step, index) => (
            <div
              key={step}
              className="grid grid-cols-[58px_1fr] items-center rounded-md border border-[#E8E0D4] bg-[#FAF7F2] p-5"
            >
              <span className="font-mono text-xs text-[#A8A29E]">0{index + 1}</span>
              <span className="font-editorial text-3xl font-light text-[#1C1917]">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section id="crear" className="bg-[#4A7C6F] px-6 py-24 text-center text-white md:px-12">
      <h2 className="font-editorial text-6xl font-light leading-none md:text-7xl">
        Agenda. Cobra.
        <br />
        <em className="text-white/70">Fluye.</em>
      </h2>
      <p className="mx-auto mt-6 max-w-lg text-[15px] leading-8 text-white/70">
        Crea una experiencia profesional para tus alumnas y recupera las horas que hoy se van en
        mensajes, hojas de calculo y transferencias.
      </p>
      <Link
        to="/onboarding"
        className="mt-9 inline-flex rounded-full bg-white px-9 py-4 text-sm font-medium text-[#2D5248]"
      >
        Crear mi estudio
      </Link>
    </section>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col gap-6 bg-[#1C1917] px-6 py-10 text-white/40 md:flex-row md:items-center md:justify-between md:px-12">
      <div>
        <div className="font-editorial text-2xl uppercase tracking-[0.12em] text-white">
          flowi<span className="text-[#C5DDD8]">.</span>
        </div>
        <p className="mt-2 text-sm">Tu estudio, a tu ritmo.</p>
      </div>
      <p className="font-mono text-[11px] uppercase tracking-[0.12em]">
        MVP LATAM - Pilates, Yoga y wellness
      </p>
    </footer>
  );
}

function StepStudio({
  authReady,
  draft,
  slugStatus,
  setDraft,
}: {
  authReady: boolean;
  draft: Draft;
  slugStatus: string;
  setDraft: (updater: (current: Draft) => Draft) => void;
}) {
  return (
    <div>
      <StepHeader title="Datos del estudio" text="El nombre y slug definen la primera impresion." />
      {!authReady && (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <Field label="Nombre" value={draft.firstName} onChange={(value) => setDraftValue(setDraft, 'firstName', value)} />
          <Field label="Apellido" value={draft.lastName} onChange={(value) => setDraftValue(setDraft, 'lastName', value)} />
          <Field label="Email" type="email" value={draft.email} onChange={(value) => setDraftValue(setDraft, 'email', value)} />
          <Field label="Password" type="password" value={draft.password} onChange={(value) => setDraftValue(setDraft, 'password', value)} />
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Nombre del estudio"
          value={draft.studioName}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              studioName: value,
              slug: current.slug ? current.slug : slugify(value),
            }))
          }
        />
        <label className="block">
          <span className="text-sm font-semibold text-sage-800">Tipo</span>
          <select
            className="mt-2 w-full rounded-flowi border border-sage-100 bg-sand-50 px-4 py-3 text-sm outline-none focus:border-sage-500"
            value={draft.studioType}
            onChange={(event) => setDraftValue(setDraft, 'studioType', event.target.value)}
          >
            <option value="pilates">Pilates</option>
            <option value="yoga">Yoga</option>
            <option value="gym">Gym</option>
            <option value="wellness">Wellness</option>
            <option value="other">Otro</option>
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-sage-800">URL publica</span>
          <div className="mt-2 flex overflow-hidden rounded-flowi border border-sage-100 bg-sand-50 focus-within:border-sage-500">
            <span className="bg-white px-4 py-3 font-mono text-xs text-sage-500">flowi.app/</span>
            <input
              className="w-full bg-transparent px-4 py-3 text-sm outline-none"
              value={draft.slug}
              onChange={(event) => setDraftValue(setDraft, 'slug', slugify(event.target.value))}
            />
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {slugStatus === 'checking' && 'Revisando disponibilidad...'}
            {slugStatus === 'available' && 'URL disponible.'}
            {slugStatus === 'taken' && 'Esa URL ya existe. Prueba otra variacion.'}
          </p>
        </label>
        <Field label="Telefono" value={draft.phone} onChange={(value) => setDraftValue(setDraft, 'phone', value)} />
      </div>
    </div>
  );
}

function StepStory({
  draft,
  setDraft,
}: {
  draft: Draft;
  setDraft: (updater: (current: Draft) => Draft) => void;
}) {
  return (
    <div>
      <StepHeader title="Sobre tu estudio" text="Cuenta lo suficiente para que una alumna entienda si este espacio es para ella." />
      <label className="block">
        <span className="text-sm font-semibold text-sage-800">Descripcion corta</span>
        <textarea
          className="mt-2 min-h-32 w-full resize-none rounded-flowi border border-sage-100 bg-sand-50 px-4 py-3 text-sm outline-none focus:border-sage-500"
          maxLength={280}
          value={draft.description}
          onChange={(event) => setDraftValue(setDraft, 'description', event.target.value)}
        />
        <span className="mt-2 block text-right font-mono text-xs text-stone-500">
          {draft.description.length}/280
        </span>
      </label>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Direccion completa" value={draft.address} onChange={(value) => setDraftValue(setDraft, 'address', value)} />
        <Field label="Instagram" value={draft.instagram} onChange={(value) => setDraftValue(setDraft, 'instagram', value)} />
      </div>
      <div className="mt-6">
        <p className="text-sm font-semibold text-sage-800">Horario de atencion</p>
        <div className="mt-3 grid gap-3">
          {Object.entries(draft.businessHours).map(([day, value]) => (
            <div key={day} className="grid grid-cols-[70px_1fr_1fr] items-center gap-3 rounded-flowi bg-sand-50 p-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={value.enabled}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      businessHours: {
                        ...current.businessHours,
                        [day]: { ...value, enabled: event.target.checked },
                      },
                    }))
                  }
                />
                {dayLabels[day]}
              </label>
              <input
                type="time"
                value={value.opens}
                className="rounded-flowi border border-sage-100 px-3 py-2 text-sm"
                onChange={(event) => updateBusinessHour(setDraft, day, { opens: event.target.value })}
              />
              <input
                type="time"
                value={value.closes}
                className="rounded-flowi border border-sage-100 px-3 py-2 text-sm"
                onChange={(event) => updateBusinessHour(setDraft, day, { closes: event.target.value })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepCover({
  draft,
  signatureEnabled,
  localCoverPreview,
  setDraft,
  setLocalCoverPreview,
}: {
  draft: Draft;
  signatureEnabled: boolean;
  localCoverPreview: string | null;
  setDraft: (updater: (current: Draft) => Draft) => void;
  setLocalCoverPreview: (value: string | null) => void;
}) {
  const preview = draft.coverImageUrl || localCoverPreview;

  return (
    <div>
      <StepHeader title="Foto de portada" text="Opcional por ahora. Puedes saltarlo y volver despues desde el Studio Builder." />
      <div className="grid gap-5 md:grid-cols-[1fr_0.9fr]">
        <label className="flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-flowi border border-dashed border-sage-200 bg-sand-50 p-6 text-center">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setLocalCoverPreview(URL.createObjectURL(file));
            }}
          />
          <span className="font-display text-3xl text-sage-900">Subir preview local</span>
          <span className="mt-2 max-w-xs text-sm text-stone-600">
            {signatureEnabled
              ? 'Cloudinary esta configurado para firmar uploads.'
              : 'Cloudinary aun no tiene credenciales locales; puedes pegar una URL o saltar este paso.'}
          </span>
        </label>
        <div>
          <div className="aspect-[4/5] overflow-hidden rounded-flowi bg-sage-50">
            {preview ? (
              <img src={preview} alt="Preview de portada" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center font-display text-3xl text-sage-700">
                Tu portada aparecera aqui
              </div>
            )}
          </div>
          <Field label="URL de imagen" value={draft.coverImageUrl} onChange={(value) => setDraftValue(setDraft, 'coverImageUrl', value)} />
        </div>
      </div>
    </div>
  );
}

function StepDone({ draft }: { draft: Draft }) {
  return (
    <div className="flex min-h-[520px] flex-col justify-center text-center">
      <p className="mx-auto w-fit rounded-full bg-sage-50 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-sage-700">
        Estudio listo
      </p>
      <h2 className="mx-auto mt-5 max-w-2xl font-display text-6xl leading-none text-sage-900">
        {draft.studioName} ya tiene casa digital.
      </h2>
      <p className="mx-auto mt-5 max-w-xl text-stone-600">
        Copia tu URL, compartela con tus alumnas y entra al dashboard para crear paquetes y clases.
      </p>
      <div className="mx-auto mt-8 rounded-flowi border border-sage-100 bg-sand-50 px-5 py-4 font-mono text-sm text-sage-800">
        flowi.app/{draft.slug}
      </div>
    </div>
  );
}

function StepHeader({ title, text }: { title: string; text: string }) {
  return (
    <header className="mb-7">
      <h2 className="font-display text-4xl leading-none text-sage-900 md:text-5xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">{text}</p>
    </header>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-sage-800">{label}</span>
      <input
        type={type}
        className="mt-2 w-full rounded-flowi border border-sage-100 bg-sand-50 px-4 py-3 text-sm outline-none focus:border-sage-500"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function getStepValidity(step: number, draft: Draft, authReady: boolean, slugStatus: string) {
  if (step === 0) {
    const accountReady =
      authReady ||
      (draft.email.includes('@') &&
        draft.password.length >= 8 &&
        draft.firstName.trim().length > 0 &&
        draft.lastName.trim().length > 0);

    return (
      accountReady &&
      draft.studioName.trim().length >= 3 &&
      draft.slug.length >= 3 &&
      slugStatus !== 'taken'
    );
  }

  if (step === 1) {
    return draft.description.trim().length <= 280 && draft.address.trim().length > 5;
  }

  return true;
}

function setDraftValue(
  setDraft: (updater: (current: Draft) => Draft) => void,
  key: keyof Draft,
  value: string,
) {
  setDraft((current) => ({ ...current, [key]: value }));
}

function updateBusinessHour(
  setDraft: (updater: (current: Draft) => Draft) => void,
  day: string,
  patch: Partial<BusinessDay>,
) {
  setDraft((current) => ({
    ...current,
    businessHours: {
      ...current.businessHours,
      [day]: {
        ...current.businessHours[day],
        ...patch,
      },
    },
  }));
}

function readDraft(): Draft {
  const raw = localStorage.getItem('flowi.onboarding');
  if (!raw) return initialDraft;

  try {
    return { ...initialDraft, ...(JSON.parse(raw) as Partial<Draft>) };
  } catch {
    return initialDraft;
  }
}
