package br.com.habits.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import java.util.UUID;

import br.com.habits.IntegrationTest;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/** Spec 011, US1: preferências e aparelhos de notificação. */
class NotificationIT extends IntegrationTest {

    static final String P256DH =
        "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4";
    static final String AUTH = "BTBZMqHH6r4Tts7J_aSIgg";

    @Autowired
    NotificationSettingsRepository settings;

    @Autowired
    PushSubscriptionRepository subscriptions;

    static String endpoint() {
        return "https://fcm.googleapis.com/fcm/send/" + UUID.randomUUID();
    }

    static Map<String, Object> device(String endpoint) {
        return Map.of("endpoint", endpoint, "keys", Map.of("p256dh", P256DH, "auth", AUTH));
    }

    @Test
    void contaNovaTemNotificacoesDisponiveisComOsPadroes() throws Exception {
        Session ana = newUser();

        perform(ana, get("/api/notifications"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.available").value(true))
            .andExpect(jsonPath("$.publicKey").isNotEmpty())
            .andExpect(jsonPath("$.reminderTime").value("20:00"))
            .andExpect(jsonPath("$.daily").value(true))
            .andExpect(jsonPath("$.atRisk").value(true))
            .andExpect(jsonPath("$.summary").value(true));
        assertThat(settings.existsById(ana.userId())).as("nada é gravado só por abrir").isFalse();
    }

    @Test
    void ativarGravaOAparelhoEAsPreferenciasPadrao() throws Exception {
        Session ana = newUser();
        String endpoint = endpoint();

        perform(ana, put("/api/notifications/devices"), device(endpoint)).andExpect(status().isNoContent());

        assertThat(subscriptions.findByEndpointAndUserId(endpoint, ana.userId())).isPresent();
        NotificationSettings saved = settings.findById(ana.userId()).orElseThrow();
        assertThat(saved.getReminderTime()).hasToString("20:00");
        assertThat(saved.isDailyEnabled() && saved.isAtRiskEnabled() && saved.isSummaryEnabled()).isTrue();
    }

    @Test
    void salvarHorarioETipos() throws Exception {
        Session ana = newUser();

        perform(ana, put("/api/notifications/settings"),
            Map.of("reminderTime", "21:30", "daily", false, "atRisk", true, "summary", false))
            .andExpect(status().isNoContent());

        perform(ana, get("/api/notifications"))
            .andExpect(jsonPath("$.reminderTime").value("21:30"))
            .andExpect(jsonPath("$.daily").value(false))
            .andExpect(jsonPath("$.atRisk").value(true))
            .andExpect(jsonPath("$.summary").value(false));
        // 21:30 ainda não passou (relógio dos testes ao meio-dia): o lembrete de hoje continua valendo
        assertThat(settings.findById(ana.userId()).orElseThrow().getLastDailyOn()).isNull();
    }

    @Test
    void horarioQueJaPassouHojeValeAPartirDeAmanha() throws Exception {
        Session ana = newUser();

        perform(ana, put("/api/notifications/settings"),
            Map.of("reminderTime", "08:00", "daily", true, "atRisk", true, "summary", true))
            .andExpect(status().isNoContent());

        assertThat(settings.findById(ana.userId()).orElseThrow().getLastDailyOn()).isEqualTo(TODAY);
    }

    @Test
    void horarioInvalidoERecusado() throws Exception {
        Session ana = newUser();
        for (String time : new String[] {"24:00", "7:00", "20:60", "abc", ""}) {
            perform(ana, put("/api/notifications/settings"),
                Map.of("reminderTime", time, "daily", true, "atRisk", true, "summary", true))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.reminderTime").value("Informe um horário válido."));
        }
    }

    @Test
    void enderecoForaDosServicosDePushEChavesInvalidasSaoRecusados() throws Exception {
        Session ana = newUser();
        String[] endpoints = {
            "http://fcm.googleapis.com/fcm/send/x",
            "https://evil.example.com/fcm.googleapis.com",
            "https://fcm.googleapis.com.evil.com/x",
            "https://127.0.0.1/x",
            "https://fcm.googleapis.com:8443/x",
            "https://user@fcm.googleapis.com/x",
        };
        for (String endpoint : endpoints) {
            perform(ana, put("/api/notifications/devices"), device(endpoint))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_SUBSCRIPTION"))
                .andExpect(jsonPath("$.message").value("Não foi possível ativar as notificações neste aparelho."));
        }
        perform(ana, put("/api/notifications/devices"),
            Map.of("endpoint", endpoint(), "keys", Map.of("p256dh", AUTH, "auth", AUTH)))
            .andExpect(status().isBadRequest());
        perform(ana, put("/api/notifications/devices"),
            Map.of("endpoint", endpoint(), "keys", Map.of("p256dh", P256DH, "auth", P256DH)))
            .andExpect(status().isBadRequest());
        perform(ana, put("/api/notifications/devices"), Map.of("endpoint", endpoint()))
            .andExpect(status().isBadRequest());
        assertThat(subscriptions.findByUserIdOrderById(ana.userId())).isEmpty();
    }

    @Test
    void servicosDePushConhecidosSaoAceitos() throws Exception {
        Session ana = newUser();
        String[] endpoints = {
            "https://fcm.googleapis.com/fcm/send/" + UUID.randomUUID(),
            "https://updates.push.services.mozilla.com/wpush/v2/" + UUID.randomUUID(),
            "https://web.push.apple.com/" + UUID.randomUUID(),
            "https://wns2-par02p.notify.windows.com/w/?token=" + UUID.randomUUID(),
        };
        for (String endpoint : endpoints) {
            perform(ana, put("/api/notifications/devices"), device(endpoint)).andExpect(status().isNoContent());
        }
        assertThat(subscriptions.findByUserIdOrderById(ana.userId())).hasSize(4);
    }

    @Test
    void mesmoAparelhoEmOutraContaPassaParaAContaAtual() throws Exception {
        Session ana = newUser();
        Session bia = newUser();
        String endpoint = endpoint();

        perform(ana, put("/api/notifications/devices"), device(endpoint)).andExpect(status().isNoContent());
        perform(bia, put("/api/notifications/devices"), device(endpoint)).andExpect(status().isNoContent());

        assertThat(subscriptions.findByEndpoint(endpoint).orElseThrow().getUserId()).isEqualTo(bia.userId());
        assertThat(subscriptions.findByUserIdOrderById(ana.userId())).isEmpty();
    }

    @Test
    void reenviarAMesmaInscricaoNaoDuplica() throws Exception {
        Session ana = newUser();
        String endpoint = endpoint();

        perform(ana, put("/api/notifications/devices"), device(endpoint)).andExpect(status().isNoContent());
        perform(ana, put("/api/notifications/devices"), device(endpoint)).andExpect(status().isNoContent());

        assertThat(subscriptions.findByUserIdOrderById(ana.userId())).hasSize(1);
    }

    @Test
    void desativarRemoveSoEsteAparelho() throws Exception {
        Session ana = newUser();
        String celular = endpoint();
        String computador = endpoint();
        perform(ana, put("/api/notifications/devices"), device(celular)).andExpect(status().isNoContent());
        perform(ana, put("/api/notifications/devices"), device(computador)).andExpect(status().isNoContent());

        perform(ana, delete("/api/notifications/devices"), Map.of("endpoint", computador))
            .andExpect(status().isNoContent());

        assertThat(subscriptions.findByUserIdOrderById(ana.userId()))
            .extracting(PushSubscription::getEndpoint).containsExactly(celular);
        perform(ana, delete("/api/notifications/devices"), Map.of("endpoint", computador))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("SUBSCRIPTION_NOT_FOUND"));
    }

    @Test
    void semLoginNaoAcessa() throws Exception {
        mvc.perform(get("/api/notifications")).andExpect(status().isUnauthorized());
    }
}
