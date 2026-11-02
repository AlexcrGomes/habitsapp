import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { LoginPage } from "./auth/LoginPage";
import { RegisterPage } from "./auth/RegisterPage";
import { HomePage } from "./home/HomePage";

export function App() {
  return (
    <AuthProvider>
      <Screens />
    </AuthProvider>
  );
}

function Screens() {
  const { status, user } = useAuth();
  const [screen, setScreen] = useState<"login" | "register">("login");

  // Depois de sair, volta sempre para o login
  useEffect(() => {
    if (status === "authenticated") setScreen("login");
  }, [status]);

  if (status === "loading") return <p className="loading" role="status">Carregando…</p>;
  if (user) return <HomePage user={user} />;
  return screen === "login"
    ? <LoginPage onRegister={() => setScreen("register")} />
    : <RegisterPage onLogin={() => setScreen("login")} />;
}
