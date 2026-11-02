interface UserMenuProps {
  name: string;
  email: string;
  onChangePassword: () => void;
  onLogout: () => void;
}

export function UserMenu({ name, email, onChangePassword, onLogout }: UserMenuProps) {
  return (
    <div className="user-menu">
      <span className="user-name" title={email}>{name}</span>
      <button type="button" onClick={onChangePassword}>Trocar senha</button>
      <button type="button" onClick={onLogout}>Sair</button>
    </div>
  );
}
