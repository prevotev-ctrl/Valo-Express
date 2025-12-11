"use client";
import { useState } from "react";
import { setSession } from "@/lib/session";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email || !password) {
      setErr("Email et mot de passe requis");
      return;
    }
    const display = name || email.split("@")[0];
    setSession({ email, name: display });
    window.location.href = "/onboarding";
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-600">Nom (optionnel)</span>
        <input className="border rounded px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Alice" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-600">Email</span>
        <input type="email" required className="border rounded px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="prenom.nom@exemple.com" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-600">Mot de passe</span>
        <input type="password" required className="border rounded px-3 py-2" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" />
      </label>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button className="px-4 py-2 rounded brand-gradient text-white">Se connecter</button>
      <p className="text-xs text-gray-500">Mode démo local (pas d’envoi au serveur).</p>
    </form>
  );
}

