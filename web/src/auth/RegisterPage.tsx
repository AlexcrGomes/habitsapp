import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "../api/client";
import { MIN_PASSWORD } from "../habits/rules";
import { useAuth } from "./AuthContext";

type Field = "name" | "email" | "password";

export function RegisterPage({ onLogin }: { onLogin: () => void }) {
  const { register } = useAuth();
  const [values, setValues] = useState<Record<Field, string>>({ name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function change(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (values.password.length < MIN_PASSWORD) {
      setFieldErrors({ password: `A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.` });
      return;
    }

    setFieldErrors({});
    setBusy(true);
    try {
      await register(values.name, values.email, values.password);
    } catch (e) {
      if (e instanceof ApiError) {
        setFieldErrors((e.fields ?? {}) as Partial<Record<Field, string>>);
        if (!e.fields) setError(e.message);
      } else {
        setError("Erro inesperado. Tente novamente.");
      }
      setBusy(false);
    }
  }

  function input(field: Field, label: string, type: string, autoComplete: string) {
    const id = `register-${field}`;
    const fieldError = fieldErrors[field];
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Input id={id} type={type} autoComplete={autoComplete} value={values[field]}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? `${id}-error` : undefined}
          onChange={(e) => change(field, e.target.value)} />
        {fieldError && <p id={`${id}-error`} className="text-sm text-danger">{fieldError}</p>}
      </div>
    );
  }

  return (
    <AuthLayout>
      <Card className="p-6 shadow-sm sm:p-8">
        <form onSubmit={submit} noValidate aria-labelledby="register-title">
          <h1 id="register-title" className="text-2xl font-semibold tracking-tight text-ink">Criar conta</h1>

          <div className="mt-6 space-y-4">
            {input("name", "Nome", "text", "name")}
            {input("email", "E-mail", "email", "email")}
            {input("password", `Senha (mínimo ${MIN_PASSWORD} caracteres)`, "password", "new-password")}
          </div>

          <p className="mt-3 min-h-5 text-sm text-danger" role="alert">{error}</p>

          <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" disabled={busy}>Criar conta</Button>
          <p className="mt-6 text-center text-sm text-slate-500">
            Já tem conta? <Button variant="link" onClick={onLogin}>Entrar</Button>
          </p>
        </form>
      </Card>
    </AuthLayout>
  );
}
