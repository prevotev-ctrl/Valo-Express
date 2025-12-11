"use client";
import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "sent" | "redirecting">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !company.trim()) {
      setStatus("error");
      return;
    }
    setStatus("sent");
    setTimeout(() => {
      setStatus("redirecting");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }, 600);
  };

  const chips = ["Private equity", "Family office", "M&A corporate", "Conseil"];
  const cards = [
    { title: "Cadre sérieux", desc: "Approche DCF robuste, sensibilités normalisées, exports prêts client.", badge: "DCF", tint: "bg-forest-100" },
    { title: "Productivité", desc: "Inputs guidés, calculs immédiats, graphiques et tables exportables.", badge: "Exports", tint: "bg-forest-100" },
    { title: "Contrôle des accès", desc: "Connexion obligatoire pour chaque session.", badge: "Sécurité", tint: "bg-forest-100" },
    { title: "Aperçu du dashboard", desc: "Screenshot dashboard (placeholder)", badge: "Dashboard", tint: "bg-forest-100", span: 2, type: "preview" },
    { title: "DCF", desc: "Flux de trésorerie, TV, valeur actuelle explicite, exports CSV.", badge: "DCF", tint: "bg-forest-100" },
    { title: "Football field", desc: "Multiples et DCF, marqueur de cours actuel, bandes lisibles.", badge: "Valorisation", tint: "bg-forest-100" },
    { title: "Dashboard financier", desc: "P&L / bilan importés, ratios clés, cash flow et KPIs.", badge: "KPIs", tint: "bg-forest-100", span: 2 },
  ];

  const Icon = () => (
    <div className="h-8 w-8 rounded-md bg-forest-50 border border-forest-100 flex items-center justify-center">
      <img src="/xvalo-logo.svg" alt="XValo" className="h-4 w-4" />
    </div>
  );

  const colorFor = (title: string) => {
    if (title === "Productivité") return "bg-green-500";
    if (title.includes("Contrôle")) return "bg-emerald-500";
    if (title.includes("Football")) return "bg-emerald-600";
    if (title.includes("DCF")) return "bg-forest-600";
    return "bg-forest-500";
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-forest-50 via-white to-forest-50/60">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col gap-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/xvalo-logo.svg" alt="XValo" className="h-9 w-9" />
            <span className="text-xl font-semibold text-forest-700">XValo</span>
          </div>
          <nav className="hidden md:flex items-center gap-3 text-sm text-forest-700">
            <a className="px-3 py-1.5 rounded border border-forest-100 bg-white/80 hover:bg-forest-50 font-medium" href="/login">
              Connexion
            </a>
            <span className="text-xs px-3 py-1.5 rounded-full border border-forest-100 text-forest-600 bg-white/80">
              Accès restreint
            </span>
          </nav>
        </header>

        <section className="grid gap-10 md:grid-cols-2 md:items-center min-h-[75vh]">
          <div className="space-y-6 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-forest-100 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M4 17V7l8-4 8 4v10l-8 4-8-4Z" stroke="#245d3d" strokeWidth="1.5" />
                  <path d="M8 12h2v5H8zM12 9h2v8h-2zM16 11h2v6h-2z" fill="#2a7b59" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.16em] text-forest-600">ÉVALUATION FINANCIÈRE SÉCURISÉE</p>
                <h1 className="text-4xl md:text-[2.6rem] font-semibold leading-tight text-forest-900">
                  Valorisation et dashboards pour vos comités
                </h1>
              </div>
            </div>
            <p className="text-base text-forest-700 leading-relaxed">
              DCF complet, sensibilités WACC/g/multiples et tableaux financiers (bilan, P&L, cash flow) conçus pour des équipes d’investissement et des cabinets de conseil.
            </p>
            <div className="grid gap-3 text-sm text-forest-800">
              <div className="flex gap-3 items-start">
                <div className="mt-1 h-2 w-2 rounded-full bg-forest-500" />
                <div>Exports graphiques et CSV (football field, tornado, FCF, KPIs).</div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="mt-1 h-2 w-2 rounded-full bg-forest-500" />
                <div>Analyse instantanée P&L / bilan, ratios clés et cash flow.</div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="mt-1 h-2 w-2 rounded-full bg-forest-500" />
                <div>Accès sécurisé, authentification obligatoire.</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/app" className="px-4 py-2 rounded border border-forest-100 bg-white text-forest-800">Découvrir l’outil</a>
              <a href="/login" className="px-4 py-2 rounded border border-forest-100 text-forest-700 hover:bg-forest-50">Se connecter</a>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-7 shadow-lg border border-forest-100 bg-white md:mt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-forest-800">Inscription</h2>
                <p className="text-sm text-forest-600">Créez un compte avec votre email et un mot de passe.</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-forest-50 text-forest-700 border border-forest-100">Enregistrement</span>
            </div>
            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm text-forest-700 space-y-1">
                <span>Nom de l'entreprise</span>
                <input
                  className="w-full rounded-xl border border-forest-100 px-3 py-2.5 focus-ring bg-forest-50/60"
                  type="text"
                  placeholder="Ex: Nova Capital"
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    setStatus("idle");
                  }}
                />
              </label>
              <label className="block text-sm text-forest-700 space-y-1">
                <span>Email</span>
                <input
                  className="w-full rounded-xl border border-forest-100 px-3 py-2.5 focus-ring"
                  type="email"
                  placeholder="prenom.nom@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setStatus("idle");
                  }}
                />
              </label>
              <label className="block text-sm text-forest-700 space-y-1">
                <span>Mot de passe</span>
                <input
                  className="w-full rounded-xl border border-forest-100 px-3 py-2.5 focus-ring"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setStatus("idle");
                  }}
                />
                <p className="text-[11px] text-forest-600">Min. 8 caractères, sécurisé, jamais partagé.</p>
              </label>
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-xl brand-gradient text-white font-semibold disabled:opacity-60"
                disabled={!email.trim() || !password.trim()}
              >
                Créer mon compte
              </button>
              <p className="text-[11px] text-forest-600">Essai gratuit, aucune CB requise.</p>
              <div className="flex items-center justify-between text-xs text-forest-600">
                <span>Déjà enregistré(e) ?</span>
                <a className="text-forest-700 font-semibold hover:underline" href="/login">Se connecter</a>
              </div>
              {status === "error" && (
                <p className="text-xs text-red-600">Renseignez un email, un mot de passe et le nom de l'entreprise.</p>
              )}
              {status === "sent" && (
                <p className="text-xs text-green-700">Compte créé (mock). Redirection vers la connexion...</p>
              )}
              {status === "redirecting" && (
                <p className="text-xs text-green-700">Redirection en cours...</p>
              )}
            </form>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-6">
          <div className="rounded-2xl border border-forest-100 bg-forest-50/70 shadow-sm px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <span className="text-xs uppercase tracking-[0.12em] text-forest-600">PENSÉ POUR</span>
            <div className="flex flex-wrap gap-2.5">
              {chips.map((label) => (
                <span
                  key={label}
                  className="text-xs px-3 py-1.5 rounded-full bg-white text-forest-700 border border-forest-100 shadow-sm hover:bg-forest-50"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-forest-700">Fonctionnalités clés</h3>
            <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {cards.map((c, idx) => {
                if (c.type === "preview") return null;
                if (idx === 4) return null;
                if (idx === 5) return null;
                return (
                  <div key={c.title} className="bg-white rounded-2xl shadow-md border border-forest-100 p-5 flex items-start gap-3 min-h-[180px]">
                    <Icon />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-forest-700 font-semibold">{c.title}</div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 border border-forest-100">{c.badge}</span>
                      </div>
                      <div className="text-xs text-gray-700 leading-relaxed">{c.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2 bg-white border border-forest-100 rounded-2xl p-5 shadow-md">
              <div className="flex items-center gap-2 text-sm font-semibold text-forest-700 mb-3">
                <Icon />
                <span>Aperçu du dashboard</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 border border-forest-100">Dashboard</span>
              </div>
              <div className="text-[11px] text-gray-500 mb-2">Exemple : dashboard financier consolidé</div>
              <div className="h-40 rounded-xl bg-forest-50 border border-forest-100 shadow-inner flex items-center justify-center text-forest-600 text-sm relative">
                <div className="absolute top-3 left-3 flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-forest-300" />
                  <span className="h-2 w-2 rounded-full bg-forest-200" />
                  <span className="h-2 w-2 rounded-full bg-forest-100" />
                </div>
                Screenshot dashboard (placeholder)
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-md border border-forest-100 p-5 flex items-start gap-3 min-h-[180px]">
              <Icon />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-forest-700">DCF</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 border border-forest-100">DCF</span>
                </div>
                <div className="text-xs text-forest-700 leading-relaxed">Flux de trésorerie, TV, valeur actuelle explicite, exports CSV.</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-2xl shadow-md border border-forest-100 p-5 flex items-start gap-3 min-h-[180px]">
              <Icon />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-forest-700">Football field</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 border border-forest-100">Valorisation</span>
                </div>
                <div className="text-xs text-forest-700 leading-relaxed">Multiples et DCF, marqueur de cours actuel, bandes lisibles.</div>
              </div>
            </div>
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-forest-100 p-5 flex items-start gap-3 min-h-[180px]">
              <Icon />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-forest-700">Dashboard financier</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 border border-forest-100">KPIs</span>
                </div>
                <div className="text-xs text-forest-700 leading-relaxed">P&L / bilan importés, ratios clés, cash flow et KPIs.</div>
              </div>
            </div>
          </div>
        </section>

        <footer className="pt-10 text-center text-xs text-forest-600 border-t border-forest-100">
          (c) {new Date().getFullYear()} XValo — Accès sécurisé réservé aux utilisateurs autorisés.
        </footer>
      </div>
    </main>
  );
}
