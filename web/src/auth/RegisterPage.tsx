import { useState, type FormEvent } from "react";
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
      <>
        <label htmlFor={id}>{label}</label>
        <input id={id} type={type} autoComplete={autoComplete} value={values[field]}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? `${id}-error` : undefined}
          onChange={(e) => change(field, e.target.value)} />
        {fieldError && <p id={`${id}-error`} className="field-error">{fieldError}</p>}
      </>
    );
  }

  return (
    <main className="auth-page">
      <img src="/logo.svg" alt="Logomarca do aplicativo habits" />
      <form className="auth-card" onSubmit={submit} noValidate aria-labelledby="register-title">
        <h1 id="register-title">Criar conta</h1>

        {input("name", "Nome", "text", "name")}
        {input("email", "E-mail", "email", "email")}
        {input("password", `Senha (mínimo ${MIN_PASSWORD} caracteres)`, "password", "new-password")}

        <p className="form-error" role="alert">{error}</p>

        <button type="submit" className="primary" disabled={busy}>Criar conta</button>
        <p className="auth-switch">
          Já tem conta? <button type="button" className="link" onClick={onLogin}>Entrar</button>
        </p>
      </form>
    </main>
  );
}
