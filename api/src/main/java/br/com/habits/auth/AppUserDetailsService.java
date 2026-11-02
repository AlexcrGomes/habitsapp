package br.com.habits.auth;

import br.com.habits.user.UserRepository;
import br.com.habits.user.UserService;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository users;

    public AppUserDetailsService(UserRepository users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        return users.findByEmail(UserService.normalizeEmail(email))
            .map(user -> new AuthPrincipal(user.getId(), user.getEmail(), user.getPasswordHash()))
            .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
    }
}
