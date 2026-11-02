package br.com.habits.user;

import br.com.habits.auth.AuthPrincipal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final UserService userService;

    public MeController(UserService userService) {
        this.userService = userService;
    }

    public record ChangePasswordRequest(
        @NotNull(message = "Informe a senha atual.") String currentPassword,
        @NotNull(message = "Informe a nova senha.")
        @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres.")
        @Size(max = 72, message = "A senha pode ter no máximo 72 caracteres.")
        String newPassword) {
    }

    public record SettingsRequest(
        @NotNull(message = "Informe o modo da semana.")
        @Pattern(regexp = "rolling|calendar", message = "Modo da semana inválido.")
        String weekMode) {
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal AuthPrincipal principal,
                               @Valid @RequestBody ChangePasswordRequest body) {
        userService.changePassword(principal.id(), body.currentPassword(), body.newPassword());
    }

    @PutMapping("/settings")
    public UserResponse updateSettings(@AuthenticationPrincipal AuthPrincipal principal,
                                       @Valid @RequestBody SettingsRequest body) {
        return UserResponse.of(userService.updateWeekMode(principal.id(), body.weekMode()));
    }
}
