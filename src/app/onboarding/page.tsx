"use client";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";

export default function Onboarding() {
  const [ok, setOk] = useState(false);
  const [company, setCompany] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [units, setUnits] = useState("M€");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    setOk(!!s);
  }, []);

  function save() {
    if (!company.trim()) {
      setError("Le nom de l'entreprise est obligatoire.");
      return;
    }
    setError(null);
    const data = { company, currency, units };
    localStorage.setItem("company", JSON.stringify(data));
    window.location.href = "/app";
  }

  if (!ok) {
    return (
      <main className="p-6 max-w-xl mx-auto">
        Ouvre d’abord la page <a className="underline" href="/login">/login</a>.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-forest-50 via-white to-forest-50/60 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white border border-forest-100 rounded-2xl shadow-md p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-forest-50 border border-forest-100 flex items-center justify-center">
            <img src="/xvalo-logo.svg" alt="XValo" className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-forest-900">Onboarding</h1>
            <p className="text-sm text-forest-700">Indique la société que tu veux valoriser.</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-forest-700">Nom de l'entreprise <span className="text-red-500">*</span></span>
            <input
              className="border border-forest-100 rounded-xl px-3 py-2.5 bg-forest-50/70 focus-ring"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                setError(null);
              }}
              placeholder="ex: Idex Services"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-forest-700">Devise</span>
              <input
                className="border border-forest-100 rounded-xl px-3 py-2.5 bg-white focus-ring"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="EUR"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-forest-700">Unités</span>
              <input
                className="border border-forest-100 rounded-xl px-3 py-2.5 bg-white focus-ring"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="M€"
              />
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={save}
          className="w-full md:w-auto px-5 py-2.5 rounded-xl brand-gradient text-white font-semibold disabled:opacity-60"
        >
          Commencer l'estimation
        </button>
      </div>
    </main>
  );
}
