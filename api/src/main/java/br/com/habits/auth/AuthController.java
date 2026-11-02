package br.com.habits.auth;

import br.com.habits.common.ApiException;
import br.com.habits.user.User;
import br.com.habits.user.UserResponse;
import br.com.habits.user.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final UserService userService;

    public AuthController(AuthenticationManager authenticationManager,
                          SecurityContextRepository securityContextRepository,
                          UserService userService) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.userService = userService;
    }

    public record RegisterRequest(
        @NotBlank(message = "Informe o nome.")
        @Size(max = 100, message = "O nome pode ter no máximo 100 caracteres.")
        String name,
        @NotBlank(message = "Informe o e-mail.")
        @Email(message = "Informe um e-mail válido.")
        @Size(max = 254, message = "Informe um e-mail válido.")
        String email,
        @NotNull(message = "Informe a senha.")
        @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres.")
        @Size(max = 72, message = "A senha pode ter no máximo 72 caracteres.")
        String password) {

        public RegisterRequest {
            // Espaços nas pontas não invalidam o e-mail (RF-002)
            email = email == null ? null : email.trim();
        }
    }

    public record LoginRequest(String email, String password) {
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest body,
                                 HttpServletRequest request, HttpServletResponse response) {
        User user = userService.register(body.name(), body.email(), body.password());
        AuthPrincipal principal = new AuthPrincipal(user.getId(), user.getEmail(), null);
        startSession(UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.getAuthorities()),
            request, response);
        return UserResponse.of(user);
    }

    @PostMapping("/login")
    public UserResponse login(@RequestBody LoginRequest body,
                              HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(
                UserService.normalizeEmail(body.email()), body.password() == null ? "" : body.password()));
        } catch (AuthenticationException e) {
            // Mesma mensagem para e-mail inexistente e senha errada (Princípio VII)
            throw new ApiException(HttpStatus.UNAUTHORIZED, "BAD_CREDENTIALS", "E-mail ou senha inválidos.");
        }
        startSession(authentication, request, response);
        return UserResponse.of(userService.get(((AuthPrincipal) authentication.getPrincipal()).id()));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(Authentication authentication, HttpServletRequest request, HttpServletResponse response) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AuthPrincipal principal) {
        return UserResponse.of(userService.get(principal.id()));
    }

    private void startSession(Authentication authentication, HttpServletRequest request, HttpServletResponse response) {
        // Novo id de sessão a cada login evita fixação de sessão
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }
}
