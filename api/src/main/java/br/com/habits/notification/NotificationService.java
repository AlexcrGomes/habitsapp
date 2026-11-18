package br.com.habits.notification;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import br.com.habits.common.ApiException;
import br.com.habits.push.Base64Url;
import br.com.habits.push.VapidKeys;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Preferências e aparelhos de notificação, sempre do usuário da sessão (spec 011, US1). */
@Service
public class NotificationService {

    /** Serviços de push dos navegadores: a API só envia para eles (plan P12, sem SSRF). */
    static final List<String> PUSH_HOSTS = List.of(
        "fcm.googleapis.com", "push.services.mozilla.com", "push.apple.com", "notify.windows.com");

    private static final Pattern TIME = Pattern.compile("([01]\\d|2[0-3]):[0-5]\\d");
    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private final NotificationSettingsRepository settings;
    private final PushSubscriptionRepository subscriptions;
    private final VapidKeys vapid;
    private final Clock clock;

    public NotificationService(NotificationSettingsRepository settings, PushSubscriptionRepository subscriptions,
                               VapidKeys vapid, Clock clock) {
        this.settings = settings;
        this.subscriptions = subscriptions;
        this.vapid = vapid;
        this.clock = clock;
    }

    public record SettingsView(boolean available, String publicKey, String reminderTime,
                               boolean daily, boolean atRisk, boolean summary) {
    }

    @Transactional(readOnly = true)
    public SettingsView view(Long userId) {
        NotificationSettings current = settings.findById(userId).orElseGet(() -> new NotificationSettings(userId));
        return new SettingsView(vapid.available(), vapid.publicKey(), current.getReminderTime().format(HH_MM),
            current.isDailyEnabled(), current.isAtRiskEnabled(), current.isSummaryEnabled());
    }

    @Transactional
    public void update(Long userId, String reminderTime, boolean daily, boolean atRisk, boolean summary) {
        if (reminderTime == null || !TIME.matcher(reminderTime).matches()) {
            throw ApiException.validation("reminderTime", "Informe um horário válido.");
        }
        LocalTime time = LocalTime.parse(reminderTime, HH_MM);
        NotificationSettings current = settings.findById(userId).orElseGet(() -> new NotificationSettings(userId));
        LocalDateTime now = LocalDateTime.now(clock);
        // Plan P8: horário novo que já passou hoje vale a partir de amanhã (spec, cenário 1.4)
        if (!time.equals(current.getReminderTime()) && !time.isAfter(now.toLocalTime())) {
            current.setLastDailyOn(now.toLocalDate());
        }
        current.setReminderTime(time);
        current.setDailyEnabled(daily);
        current.setAtRiskEnabled(atRisk);
        current.setSummaryEnabled(summary);
        settings.save(current);
    }

    /** Ativa as notificações neste aparelho (plan P4): grava ou toma para si a inscrição. */
    @Transactional
    public void registerDevice(Long userId, String endpoint, String p256dh, String auth) {
        if (!vapid.available()) {
            throw new ApiException(HttpStatus.CONFLICT, "NOTIFICATIONS_UNAVAILABLE",
                "As notificações não estão disponíveis no momento.");
        }
        if (!validEndpoint(endpoint) || !validKey(p256dh, 65) || !validKey(auth, 16)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SUBSCRIPTION",
                "Não foi possível ativar as notificações neste aparelho.");
        }
        PushSubscription subscription = subscriptions.findByEndpoint(endpoint)
            .orElseGet(() -> new PushSubscription(userId, endpoint, p256dh, auth));
        subscription.reassign(userId, p256dh, auth);
        subscriptions.save(subscription);
        if (!settings.existsById(userId)) {
            settings.save(new NotificationSettings(userId));
        }
    }

    /** Desativa neste aparelho. Inscrição de outra conta responde como inexistente (Princípio III). */
    @Transactional
    public void removeDevice(Long userId, String endpoint) {
        PushSubscription subscription = endpoint == null ? null
            : subscriptions.findByEndpointAndUserId(endpoint, userId).orElse(null);
        if (subscription == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "SUBSCRIPTION_NOT_FOUND",
                "Este aparelho não está com as notificações ativas.");
        }
        subscriptions.delete(subscription);
    }

    static boolean validEndpoint(String endpoint) {
        if (endpoint == null || endpoint.length() > 1024) {
            return false;
        }
        try {
            URI uri = new URI(endpoint);
            String host = uri.getHost();
            if (!"https".equals(uri.getScheme()) || host == null || uri.getUserInfo() != null
                    || (uri.getPort() != -1 && uri.getPort() != 443)) {
                return false;
            }
            String lower = host.toLowerCase(Locale.ROOT);
            return PUSH_HOSTS.stream().anyMatch(allowed -> lower.equals(allowed) || lower.endsWith("." + allowed));
        } catch (URISyntaxException e) {
            return false;
        }
    }

    private static boolean validKey(String value, int bytes) {
        if (value == null || value.length() > 100) {
            return false;
        }
        try {
            byte[] decoded = Base64Url.decode(value);
            return decoded.length == bytes && (bytes != 65 || decoded[0] == 0x04);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
