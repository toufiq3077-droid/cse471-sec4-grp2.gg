import { Link } from 'react-router-dom';

const cards = [
  {
    title: 'Expert Consultations',
    description: 'Browse agriculture experts, register as an expert, and manage consultations.',
    href: '/experts',
    cta: 'Open expert marketplace',
  },
  {
    title: 'AI Leaf Diagnosis',
    description: 'Upload a leaf image to diagnose disease and get treatment recommendations.',
    href: '/ai/diagnosis',
    cta: 'Start AI diagnosis',
  },
  {
    title: 'Diagnosis History',
    description: 'Review past AI scans and saved disease logs for the current farmer account.',
    href: '/ai/history',
    cta: 'View history',
  },
  {
    title: 'Expert Registration',
    description: 'Submit your expert profile, certifications, and availability for review.',
    href: '/experts/register',
    cta: 'Register as expert',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eefbf4_100%)] px-4 py-10 md:px-8 md:py-14">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Khet-i</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
            Smart agriculture tools for farmers and experts.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            Choose expert consultations or AI disease diagnosis from one place.
          </p>
        </header>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              to={card.href}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_30px_70px_rgba(16,185,129,0.16)] md:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
                {card.title}
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">{card.description}</p>
              <div className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition group-hover:bg-emerald-700">
                {card.cta}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}