package br.com.habits.auth;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Usuário autenticado guardado na sessão (serializado pelo Spring Session JDBC).
 * Carrega o id para que toda consulta filtre pelo dono sem buscar o usuário de novo.
 */
public class AuthPrincipal implements UserDetails, CredentialsContainer {

    private static final long serialVersionUID = 1L;

    private final Long id;
    private final String email;
    private String passwordHash;

    public AuthPrincipal(Long id, String email, String passwordHash) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public Long id() {
        return id;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    /** Chamado após o login: o hash não fica guardado na sessão. */
    @Override
    public void eraseCredentials() {
        passwordHash = null;
    }
}
