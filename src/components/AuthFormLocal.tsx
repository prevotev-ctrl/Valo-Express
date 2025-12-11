"use client";
import { useState } from "react";

const USAGES = [
  { key: "pro", label: "Pro" },
  { key: "scolaire", label: "Scolaire" },
  { key: "perso", label: "Perso" },
] as const;

export default function AuthFormLocal() {
  const [email, setEmail] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [usage, setUsage] = useState<(typeof USAGES)[number]["key"]>("pro");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("preprofile", JSON.stringify({ email, first, last, usage }));
    window.location.href = "/onboarding"; // simulate magic link redirect
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Email</span>
          <input
            type="email"
            required
            className="border rounded px-3 py-2"
            placeholder="prenom.nom@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">Prénom</span>
            <input
              className="border rounded px-3 py-2"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">Nom</span>
            <input
              className="border rounded px-3 py-2"
              value={last}
              onChange={(e) => setLast(e.target.value)}
            />
          </label>
        </div>

        <div>
          <div className="text-sm text-gray-600 mb-2">Usage</div>
          <div className="flex gap-2">
            {USAGES.map((u) => (
              <button
                type="button"
                key={u.key}
                onClick={() => setUsage(u.key)}
                className={`px-3 py-1 rounded-full border ${
                  usage === u.key ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="px-4 py-2 rounded bg-black text-white">Continuer</button>
      <p className="text-xs text-gray-500">Version locale (sans Supabase).</p>
    </form>
  );
}

