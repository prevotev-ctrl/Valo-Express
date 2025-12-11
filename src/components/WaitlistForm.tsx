"use client";
import { useState } from "react";

export default function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOk(null);
    setErr(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) throw new Error(await res.text());
      setOk("Merci !");
      try {
        // petite pause visuelle puis redirection merci
        setTimeout(() => {
          window.location.href = "/merci";
        }, 300);
      } catch {}
      setName("");
      setEmail("");
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md space-y-3">
      <div className="grid gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Nom</span>
          <input
            className="border rounded px-3 py-2"
            placeholder="Alice Martin"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Email</span>
          <input
            type="email"
            required
            className="border rounded px-3 py-2"
            placeholder="alice@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
      </div>
      <button
        disabled={loading || !email}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {loading ? "Envoi…" : "Rejoindre la waiting list"}
      </button>
      {ok && <p className="text-sm text-green-600">{ok}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </form>
  );
}
