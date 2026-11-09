import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { LoginPage } from "./auth/LoginPage";
import { RegisterPage } from "./auth/RegisterPage";
import { Loading } from "./components/ui/loading";
import { AppShell } from "./shell/AppShell";

export function App() {
  return (
    <AuthProvider>
      <Screens />
    </AuthProvider>
  );
}

/**
 * Visitante vê Entrar/Criar conta sem mudar o endereço: depois de entrar, o AppShell abre a
 * rota pedida (ex.: um favorito de /arquivados). Sair volta para "/" (no AppShell).
 */
function Screens() {
  const { status, user } = useAuth();
  const [screen, setScreen] = useState<"login" | "register">("login");

  // Depois de sair, volta sempre para o login
  useEffect(() => {
    if (status === "authenticated") setScreen("login");
  }, [status]);

  if (status === "loading") return <Loading className="justify-center py-16" />;
  if (user) return <AppShell user={user} />;
  return screen === "login"
    ? <LoginPage onRegister={() => setScreen("register")} />
    : <RegisterPage onLogin={() => setScreen("login")} />;
}
