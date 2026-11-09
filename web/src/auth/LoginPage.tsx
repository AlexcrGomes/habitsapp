import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <AuthLayout>
      <Card className="p-6 shadow-sm sm:p-8">
        <form onSubmit={submit} noValidate aria-labelledby="login-title">
          <h1 id="login-title" className="text-2xl font-semibold tracking-tight text-ink">Entrar</h1>
          {notice && <Alert className="mt-4" role="status">{notice}</Alert>}

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">E-mail</Label>
              <Input id="login-email" type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">Senha</Label>
              <Input id="login-password" type="password" autoComplete="current-password" value={password}
                onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <p className="mt-3 min-h-5 text-sm text-danger" role="alert">{error}</p>

          <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" disabled={busy}>Entrar</Button>
          <p className="mt-6 text-center text-sm text-slate-500">
            Não tem conta? <Button variant="link" onClick={onRegister}>Criar conta</Button>
          </p>
        </form>
      </Card>
    </AuthLayout>
  );
}
