package br.com.habits.user;

import java.util.Locale;

import br.com.habits.common.ApiException;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    /** " Ana@Email.com " e "ana@email.com" são o mesmo e-mail (spec 005, RF-002). */
    public static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional
    public User register(String name, String email, String password) {
        String normalized = normalizeEmail(email);
        if (users.existsByEmail(normalized)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_TAKEN", "Este e-mail já está cadastrado.");
        }
        return users.save(new User(name.trim(), normalized, passwordEncoder.encode(password)));
    }

    @Transactional(readOnly = true)
    public User get(Long id) {
        return users.findById(id).orElseThrow(ApiException::notFound);
    }

    @Transactional
    public void changePassword(Long id, String currentPassword, String newPassword) {
        User user = get(id);
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "WRONG_PASSWORD", "Senha atual incorreta.");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
    }

    @Transactional
    public User updateWeekMode(Long id, String weekMode) {
        User user = get(id);
        user.setWeekMode(weekMode);
        return user;
    }
}
