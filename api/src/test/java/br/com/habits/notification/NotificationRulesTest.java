package br.com.habits.notification;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import br.com.habits.notification.NotificationRules.HabitInfo;
import br.com.habits.notification.NotificationRules.Week;

import org.junit.jupiter.api.Test;

/** Regras puras das notificações (spec 011, plan P9–P11). Semana de 26/10 (seg) a 01/11/2026 (dom). */
class NotificationRulesTest {

    static final LocalDate MONDAY = LocalDate.of(2026, 10, 26);
    static final HabitInfo LER = new HabitInfo(1, "Ler");
    static final HabitInfo CORRER = new HabitInfo(2, "Correr");
    static final HabitInfo NADAR = new HabitInfo(3, "Nadar");

    private static Week week(LocalDate today, Map<Long, Set<LocalDate>> checks, Map<Long, Integer> goals) {
        return new Week(today, List.of(LER, CORRER, NADAR), checks, goals);
    }

    private static LocalDate day(int offset) {
        return MONDAY.plusDays(offset);
    }

    @Test
    void diasQueRestamContandoHoje() {
        assertThat(week(day(0), Map.of(), Map.of()).daysLeft()).isEqualTo(7);
        assertThat(week(day(4), Map.of(), Map.of()).daysLeft()).isEqualTo(3);
        assertThat(week(day(6), Map.of(), Map.of()).daysLeft()).isEqualTo(1);
    }

    @Test
    void pendentesIgnoramMarcadosHojeEMetasAtingidas() {
        Week week = week(day(5), Map.of(1L, Set.of(day(5)), 2L, Set.of(day(1), day(2))), Map.of(2L, 2));

        assertThat(NotificationRules.pendingToday(week)).containsExactly(NADAR);
    }

    @Test
    void marcacoesDaSemanaAnteriorNaoContamParaAMeta() {
        Week week = week(day(5), Map.of(2L, Set.of(MONDAY.minusDays(1))), Map.of(2L, 1));

        assertThat(NotificationRules.pendingToday(week)).containsExactly(LER, CORRER, NADAR);
    }

    @Test
    void emRiscoQuandoFaltamTantasMarcacoesQuantosDias() {
        Map<Long, Integer> goals = new HashMap<>(Map.of(1L, 3, 2L, 4, 3L, 2));
        // sexta: restam 3 dias. Ler 0/3 (risco), Correr 1/4 (risco), Nadar 0/2 (folga)
        Week week = week(day(4), Map.of(2L, Set.of(day(0))), goals);

        assertThat(NotificationRules.atRisk(week)).containsExactly(LER, CORRER);
    }

    @Test
    void semRiscoQuandoImpossivelAtingidaOuMarcadaHoje() {
        Week impossivel = week(day(4), Map.of(), Map.of(1L, 5));
        Week atingida = week(day(6), Map.of(1L, Set.of(day(0))), Map.of(1L, 1));
        Week marcadaHoje = week(day(4), Map.of(1L, Set.of(day(4))), Map.of(1L, 4));

        assertThat(NotificationRules.atRisk(impossivel)).isEmpty();
        assertThat(NotificationRules.atRisk(atingida)).isEmpty();
        assertThat(NotificationRules.atRisk(marcadaHoje)).isEmpty();
    }

    @Test
    void domingoPrecisandoDeUmaMarcacaoEstaEmRisco() {
        Week week = week(day(6), Map.of(1L, Set.of(day(0), day(1))), Map.of(1L, 3));

        assertThat(NotificationRules.atRisk(week)).containsExactly(LER);
    }

    // Mesmos casos de web/src/goals/progress.test.ts e dos rótulos de summaryLabel

    @Test
    void resumoSemMetasEVazio() {
        assertThat(NotificationRules.summary(week(day(6), Map.of(), Map.of()))).isEmpty();
    }

    @Test
    void resumoLimitaCadaMetaEArredonda() {
        // Ler 3/2 (conta 2), Correr 1/3: 3 de 5 = 60%
        Week week = week(day(6), Map.of(1L, Set.of(day(0), day(1), day(2)), 2L, Set.of(day(3))), Map.of(1L, 2, 2L, 3));

        assertThat(NotificationRules.summary(week)).hasValueSatisfying(summary -> {
            assertThat(summary.percent()).isEqualTo(60);
            assertThat(summary.label()).isEqualTo("Dá para melhorar");
        });
    }

    @Test
    void resumoSoChegaA100ComTudoCumprido() {
        Map<Long, Integer> goals = new HashMap<>();
        Map<Long, Set<LocalDate>> checks = new HashMap<>();
        List<HabitInfo> habits = new java.util.ArrayList<>();
        // 249 de 250 = 99,6%: não arredonda para "perfeita"
        for (long id = 1; id <= 50; id++) {
            habits.add(new HabitInfo(id, "H" + id));
            goals.put(id, 5);
            checks.put(id, id == 1 ? Set.of(day(0), day(1), day(2), day(3)) : Set.of(day(0), day(1), day(2), day(3), day(4)));
        }
        Week week = new Week(day(6), habits, checks, goals);

        assertThat(NotificationRules.summary(week).orElseThrow().percent()).isEqualTo(99);
    }

    @Test
    void rotulos() {
        assertThat(NotificationRules.label(100)).isEqualTo("Semana perfeita");
        assertThat(NotificationRules.label(70)).isEqualTo("Boa semana");
        assertThat(NotificationRules.label(69)).isEqualTo("Dá para melhorar");
        assertThat(NotificationRules.label(40)).isEqualTo("Dá para melhorar");
        assertThat(NotificationRules.label(39)).isEqualTo("Semana fraca");
    }

    @Test
    void nomesNaMensagem() {
        assertThat(NotificationRules.names(List.of(LER))).isEqualTo("Ler");
        assertThat(NotificationRules.names(List.of(LER, CORRER))).isEqualTo("Ler e Correr");
        assertThat(NotificationRules.names(List.of(LER, CORRER, NADAR))).isEqualTo("Ler, Correr e Nadar");
        assertThat(NotificationRules.names(List.of(LER, CORRER, NADAR, new HabitInfo(4, "Yoga"), new HabitInfo(5, "Dormir"))))
            .isEqualTo("Ler, Correr, Nadar e mais 2");
    }

    @Test
    void mensagens() {
        LocalDate today = day(6);
        assertThat(NotificationRules.dailyMessage(List.of(LER), today).body()).isEqualTo("Falta 1 hábito para marcar hoje: Ler.");
        assertThat(NotificationRules.atRiskMessage(List.of(LER, CORRER), today).body())
            .isEqualTo("Faça hoje para não perder a meta: Ler e Correr.");
        assertThat(NotificationRules.summaryMessage(new NotificationRules.Summary(80, "Boa semana"), List.of(), today).body())
            .isEqualTo("80% · Boa semana.");
    }
}
