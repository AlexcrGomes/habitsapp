import { useState, type FormEvent } from "react";
import { ApiError } from "../api/client";
import { useAuth } from "./AuthContext";

export function LoginPage({ onRegister }: { onRegister: () => void }) {
  const { login, notice } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro inesperado. Tente novamente.");
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <img src="/logo.svg" alt="Logomarca do aplicativo habits" />
      <form className="auth-card" onSubmit={submit} noValidate aria-labelledby="login-title">
        <h1 id="login-title">Entrar</h1>
        {notice && <p className="auth-notice" role="status">{notice}</p>}

        <label htmlFor="login-email">E-mail</label>
        <input id="login-email" type="email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="login-password">Senha</label>
        <input id="login-password" type="password" autoComplete="current-password" value={password}
          onChange={(e) => setPassword(e.target.value)} />

        <p className="form-error" role="alert">{error}</p>

        <button type="submit" className="primary" disabled={busy}>Entrar</button>
        <p className="auth-switch">
          Não tem conta? <button type="button" className="link" onClick={onRegister}>Criar conta</button>
        </p>
      </form>
    </main>
  );
}
