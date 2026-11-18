package br.com.habits.notification;

import br.com.habits.auth.AuthPrincipal;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Rotas das notificações (spec 011, plan "API"). */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    public record SettingsRequest(String reminderTime, boolean daily, boolean atRisk, boolean summary) {
    }

    public record Keys(String p256dh, String auth) {
    }

    public record DeviceRequest(String endpoint, Keys keys) {
    }

    public record RemoveDeviceRequest(String endpoint) {
    }

    @GetMapping
    public NotificationService.SettingsView get(@AuthenticationPrincipal AuthPrincipal principal) {
        return service.view(principal.id());
    }

    @PutMapping("/settings")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void update(@AuthenticationPrincipal AuthPrincipal principal, @RequestBody SettingsRequest body) {
        service.update(principal.id(), body.reminderTime(), body.daily(), body.atRisk(), body.summary());
    }

    @PutMapping("/devices")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void registerDevice(@AuthenticationPrincipal AuthPrincipal principal, @RequestBody DeviceRequest body) {
        Keys keys = body.keys() == null ? new Keys(null, null) : body.keys();
        service.registerDevice(principal.id(), body.endpoint(), keys.p256dh(), keys.auth());
    }

    @DeleteMapping("/devices")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeDevice(@AuthenticationPrincipal AuthPrincipal principal, @RequestBody RemoveDeviceRequest body) {
        service.removeDevice(principal.id(), body.endpoint());
    }
}
