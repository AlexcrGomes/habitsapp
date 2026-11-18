package br.com.habits.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import br.com.habits.FakePushSender;
import br.com.habits.IntegrationTest;
import br.com.habits.push.PushSender;

import com.fasterxml.jackson.databind.JsonNode;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Spec 011, US2, US5 e US6: o agendador envia no horário certo, no máximo uma vez por dia.
 * Relógio dos testes: sábado, 31/10/2026; a semana vai de segunda 26/10 a domingo 01/11.
 */
class NotificationJobIT extends IntegrationTest {

    static final LocalDate FRIDAY = TODAY.minusDays(1);
    static final LocalDate SUNDAY = TODAY.plusDays(1);

    @Autowired
    NotificationJob job;

    @Autowired
    FakePushSender sender;

    @Autowired
    PushSubscriptionRepository subscriptions;

    @BeforeEach
    void limparEnvios() {
        sender.clear();
    }

    private String activate(Session session) throws Exception {
        String endpoint = NotificationIT.endpoint();
        perform(session, put("/api/notifications/devices"), NotificationIT.device(endpoint))
            .andExpect(status().isNoContent());
        return endpoint;
    }

    private void settings(Session session, String time, boolean daily, boolean atRisk, boolean summary) throws Exception {
        perform(session, put("/api/notifications/settings"),
            Map.of("reminderTime", time, "daily", daily, "atRisk", atRisk, "summary", summary))
            .andExpect(status().isNoContent());
    }

    private long habit(Session session, String name, Integer goal) throws Exception {
        long id = createHabit(session, name);
        if (goal != null) {
            perform(session, patch("/api/habits/" + id), Map.of("name", name, "emoji", "", "goal", goal))
                .andExpect(status().isOk());
        }
        return id;
    }

    private void check(Session session, long habitId, LocalDate day) throws Exception {
        perform(session, put("/api/checks/" + habitId + "/" + day)).andExpect(status().isNoContent());
    }

    private void run(LocalDate day, int hour, int minute) {
        job.runAt(LocalDateTime.of(day, LocalTime.of(hour, minute)));
    }

    /** Mensagens enviadas para o aparelho (outras classes de teste podem ter aparelhos no mesmo banco). */
    private List<JsonNode> sentTo(String endpoint) throws Exception {
        List<FakePushSender.Sent> sent = sender.sent().stream()
            .filter(s -> s.target().endpoint().equals(endpoint)).toList();
        java.util.ArrayList<JsonNode> result = new java.util.ArrayList<>();
        for (FakePushSender.Sent s : sent) {
            result.add(json.readTree(s.payload()));
        }
        return result;
    }

    // --- Lembrete diário (US2) ---

    @Test
    void lembreteChegaUmaVezNaJanelaDoHorario() throws Exception {
        Session ana = newUser();
        habit(ana, "Ler", null);
        habit(ana, "Correr", null);
        String aparelho = activate(ana);

        run(TODAY, 19, 59);
        assertThat(sentTo(aparelho)).isEmpty();

        run(TODAY, 20, 0);
        run(TODAY, 20, 1);
        run(TODAY, 20, 14);

        List<JsonNode> sent = sentTo(aparelho);
        assertThat(sent).hasSize(1);
        assertThat(sent.get(0).get("title").asText()).isEqualTo("Hora de marcar seus hábitos");
        assertThat(sent.get(0).get("body").asText()).isEqualTo("Faltam 2 hábitos para marcar hoje: Ler e Correr.");
        assertThat(sent.get(0).get("tag").asText()).isEqualTo("lembrete-" + TODAY);
        assertThat(sent.get(0).get("url").asText()).isEqualTo("/");
        assertThat(sender.sent().stream().filter(s -> s.target().endpoint().equals(aparelho)).findFirst().orElseThrow().ttl())
            .as("expira à meia-noite").isEqualTo(Duration.ofHours(4));
    }

    @Test
    void depoisDaJanelaNaoEnvia() throws Exception {
        Session ana = newUser();
        habit(ana, "Ler", null);
        String aparelho = activate(ana);

        run(TODAY, 20, 15);

        assertThat(sentTo(aparelho)).isEmpty();
    }

    @Test
    void lembreteNoDiaSeguinteVoltaAChegar() throws Exception {
        Session ana = newUser();
        habit(ana, "Ler", null);
        String aparelho = activate(ana);

        run(FRIDAY, 20, 0);
        run(TODAY, 20, 0);

        assertThat(sentTo(aparelho)).hasSize(2);
        assertThat(sentTo(aparelho).get(0).get("body").asText()).isEqualTo("Falta 1 hábito para marcar hoje: Ler.");
    }

    @Test
    void semPendenciaNaoEnvia() throws Exception {
        Session ana = newUser();
        long ler = habit(ana, "Ler", null);
        long correr = habit(ana, "Correr", 1);
        long nadar = habit(ana, "Nadar", null);
        check(ana, ler, TODAY);
        check(ana, correr, FRIDAY); // meta de 1 dia já atingida na semana
        perform(ana, post("/api/habits/" + nadar + "/archive")).andExpect(status().isOk());
        String aparelho = activate(ana);

        run(TODAY, 20, 0);

        assertThat(sentTo(aparelho)).isEmpty();
    }

    @Test
    void semHabitosNaoEnvia() throws Exception {
        Session ana = newUser();
        String aparelho = activate(ana);

        run(TODAY, 20, 0);

        assertThat(sentTo(aparelho)).isEmpty();
    }

    @Test
    void lembreteDesligadoNaoEnvia() throws Exception {
        Session ana = newUser();
        habit(ana, "Ler", null);
        String aparelho = activate(ana);
        settings(ana, "20:00", false, true, true);

        run(TODAY, 20, 0);

        assertThat(sentTo(aparelho)).isEmpty();
    }

    @Test
    void mudarOHorarioDepoisDoEnvioNaoReenvia() throws Exception {
        Session ana = newUser();
        habit(ana, "Ler", null);
        String aparelho = activate(ana);
        settings(ana, "13:00", true, true, true);

        run(TODAY, 13, 0);
        settings(ana, "21:00", true, true, true);
        run(TODAY, 21, 0);

        assertThat(sentTo(aparelho)).hasSize(1);
    }

    @Test
    void lembreteMuitoLongoCitaTresNomesEOResto() throws Exception {
        Session ana = newUser();
        for (String name : List.of("A", "B", "C", "D", "E")) {
            habit(ana, name, null);
        }
        String aparelho = activate(ana);

        run(TODAY, 20, 0);

        assertThat(sentTo(aparelho).get(0).get("body").asText())
            .isEqualTo("Faltam 5 hábitos para marcar hoje: A, B, C e mais 2.");
    }

    @Test
    void todosOsAparelhosRecebemEOExpiradoEApagado() throws Exception {
        Session ana = newUser();
        habit(ana, "Ler", null);
        String celular = activate(ana);
        String computador = activate(ana);
        sender.respond(computador, PushSender.Result.EXPIRED);

        run(TODAY, 20, 0);

        assertThat(sentTo(celular)).hasSize(1);
        assertThat(sentTo(computador)).hasSize(1);
        assertThat(subscriptions.findByUserIdOrderById(ana.userId()))
            .extracting(PushSubscription::getEndpoint).containsExactly(celular);
    }

    @Test
    void validadeDaMensagemTerminaAMeiaNoite() {
        assertThat(NotificationJob.timeToLive(LocalDateTime.of(TODAY, LocalTime.of(9, 0)))).isEqualTo(Duration.ofHours(15));
        assertThat(NotificationJob.timeToLive(LocalDateTime.of(TODAY, LocalTime.of(23, 59, 30)))).isEqualTo(Duration.ofSeconds(60));
    }

    @Test
    void janelaDeQuinzeMinutosNaoAtravessaAMeiaNoite() {
        assertThat(NotificationJob.inWindow(LocalTime.of(23, 50), LocalTime.of(23, 59))).isTrue();
        assertThat(NotificationJob.inWindow(LocalTime.of(23, 50), LocalTime.of(0, 2))).isFalse();
        assertThat(NotificationJob.inWindow(LocalTime.of(20, 0), LocalTime.of(19, 59))).isFalse();
        assertThat(NotificationJob.inWindow(LocalTime.of(20, 0), LocalTime.of(20, 15))).isFalse();
    }

    // --- Meta em risco (US5) ---

    @Test
    void metaEmRiscoAsNoveCitandoTodosOsHabitosEmUmaNotificacao() throws Exception {
        Session ana = newUser();
        habit(ana, "Ler", 3);            // sexta, 0 de 3, restam 3 dias: em risco
        habit(ana, "Correr", 3);         // idem
        habit(ana, "Nadar", 2);          // folga
        habit(ana, "Meditar", 5);        // já impossível
        long yoga = habit(ana, "Yoga", 3);
        check(ana, yoga, FRIDAY);        // marcado hoje
        String aparelho = activate(ana);

        run(FRIDAY, 8, 59);
        run(FRIDAY, 9, 0);
        run(FRIDAY, 9, 5);

        List<JsonNode> sent = sentTo(aparelho);
        assertThat(sent).hasSize(1);
        assertThat(sent.get(0).get("title").asText()).isEqualTo("Meta em risco");
        assertThat(sent.get(0).get("body").asText()).isEqualTo("Faça hoje para não perder a meta: Ler e Correr.");
        assertThat(sent.get(0).get("tag").asText()).isEqualTo("meta-" + FRIDAY);
    }

    @Test
    void metaAtingidaOuSemRiscoNaoAvisa() throws Exception {
        Session ana = newUser();
        long ler = habit(ana, "Ler", 1);
        check(ana, ler, TODAY.minusDays(3));
        habit(ana, "Correr", 1); // sábado: restam 2 dias, falta 1
        String aparelho = activate(ana);

        run(TODAY, 9, 0);

        assertThat(sentTo(aparelho)).isEmpty();
    }

    @Test
    void metaEmRiscoDesligadaNaoAvisa() throws Exception {
        Session ana = newUser();
        habit(ana, "Ler", 3);
        String aparelho = activate(ana);
        settings(ana, "20:00", true, false, true);

        run(FRIDAY, 9, 0);

        assertThat(sentTo(aparelho)).isEmpty();
    }

    @Test
    void lembreteAsNoveChegaSeparadoDaMetaEmRisco() throws Exception {
        Session ana = newUser();
        habit(ana, "Ler", 3);
        String aparelho = activate(ana);
        settings(ana, "09:00", true, true, true);

        run(FRIDAY, 9, 0);

        assertThat(sentTo(aparelho)).extracting(n -> n.get("title").asText())
            .containsExactly("Meta em risco", "Hora de marcar seus hábitos");
    }

    // --- Resumo de domingo (US6) ---

    @Test
    void resumoDeDomingoSubstituiOLembreteELembraOQueFalta() throws Exception {
        Session ana = newUser();
        long ler = habit(ana, "Ler", 2);
        habit(ana, "Correr", 2);
        habit(ana, "Nadar", null);
        check(ana, ler, TODAY.minusDays(5));
        check(ana, ler, TODAY.minusDays(4));
        String aparelho = activate(ana);

        run(SUNDAY, 20, 0);
        run(SUNDAY, 20, 5);

        List<JsonNode> sent = sentTo(aparelho);
        assertThat(sent).hasSize(1);
        assertThat(sent.get(0).get("title").asText()).isEqualTo("Resumo da semana");
        assertThat(sent.get(0).get("body").asText())
            .isEqualTo("50% · Dá para melhorar. Faltam 2 hábitos para marcar hoje.");
        assertThat(sent.get(0).get("tag").asText()).isEqualTo("lembrete-" + SUNDAY);
    }

    @Test
    void resumoSemPendenciaOuComLembreteDesligado() throws Exception {
        Session ana = newUser();
        long ler = habit(ana, "Ler", 1);
        check(ana, ler, TODAY);
        habit(ana, "Correr", null);
        String aparelho = activate(ana);
        settings(ana, "20:00", false, true, true);

        run(SUNDAY, 20, 0);

        assertThat(sentTo(aparelho)).extracting(n -> n.get("body").asText())
            .containsExactly("100% · Semana perfeita.");
    }

    @Test
    void domingoSemMetasMandaOLembreteNormal() throws Exception {
        Session ana = newUser();
        habit(ana, "Ler", null);
        String aparelho = activate(ana);

        run(SUNDAY, 20, 0);

        assertThat(sentTo(aparelho)).extracting(n -> n.get("title").asText())
            .containsExactly("Hora de marcar seus hábitos");
    }

    @Test
    void resumoDesligadoMandaOLembreteNormal() throws Exception {
        Session ana = newUser();
        habit(ana, "Ler", 2);
        String aparelho = activate(ana);
        settings(ana, "20:00", true, true, false);

        run(SUNDAY, 20, 0);

        assertThat(sentTo(aparelho)).extracting(n -> n.get("body").asText())
            .containsExactly("Falta 1 hábito para marcar hoje: Ler.");
    }
}
