"use client";
import { useEffect, useState } from "react";

export default function Merci() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/waitlist")
      .then((r) => r.json())
      .then((d) => setCount(d?.count ?? null))
      .catch(() => setCount(null));
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-forest-50 bg-grid">
      <div className="w-full max-w-md text-center space-y-4 bg-white rounded-2xl p-8 border border-forest-100">
        <div className="flex items-center justify-center gap-2">
          <img src="/xvalo-logo.svg" alt="XValo" className="h-8 w-8" />
          <h1 className="text-2xl font-semibold text-forest-700">Merci !</h1>
        </div>
        <p>Tu es bien inscrit(e) sur la liste d’attente.</p>
        {count !== null && (
          <p className="text-sm text-gray-600">Vous êtes déjà {count.toLocaleString("fr-FR")} à nous rejoindre.</p>
        )}
        <div className="flex gap-3 justify-center">
          <a href="/login" className="px-4 py-2 rounded brand-gradient text-white">Retour</a>
          <a href="/app" className="px-4 py-2 rounded border border-forest-100">Voir l’app (démo)</a>
        </div>
      </div>
    </main>
  );
}

