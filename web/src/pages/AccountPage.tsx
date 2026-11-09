import { KeyRound, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AccountPageProps {
  name: string;
  email: string;
  onChangePassword: () => void;
  onLogout: () => void;
}

/** Conta ("/conta"): no celular é o destino "Conta" da barra inferior; no desktop o mesmo fica no menu lateral. */
export function AccountPage({ name, email, onChangePassword, onLogout }: AccountPageProps) {
  return (
    <section className="mx-auto max-w-xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 tabIndex={-1} className="mb-6 text-2xl font-semibold tracking-tight text-ink">Minha conta</h1>
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar name={name} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-ink" title={name}>{name}</p>
            <p className="truncate text-sm text-slate-500" title={email}>{email}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button onClick={onChangePassword}>
            <KeyRound aria-hidden="true" />
            Trocar senha
          </Button>
          <Button variant="ghost" onClick={onLogout}>
            <LogOut aria-hidden="true" />
            Sair
          </Button>
        </div>
      </Card>
    </section>
  );
}
