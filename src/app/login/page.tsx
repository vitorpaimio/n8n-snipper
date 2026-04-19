"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Erro ao fazer login");
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--n8n-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5.8 0.5L0.5 8H4.5L3.8 13.5L9.5 6H5.5L5.8 0.5Z" transform="translate(7, 5) scale(1.1)" fill="var(--n8n-accent)" stroke="var(--n8n-accent)" strokeWidth="0.6" strokeLinejoin="round" />
          </svg>
          <h1>n8n Snipper</h1>
        </div>

        {error && <div className="login-error">{error}</div>}

        <label className="login-label">
          E-mail
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
          />
        </label>

        <label className="login-label">
          Senha
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        <button className="login-button" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
