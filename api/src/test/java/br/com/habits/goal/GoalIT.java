package br.com.habits.goal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.Map;

import br.com.habits.IntegrationTest;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.ResultActions;

/** Metas semanais (spec 006): validação, histórico e meta vigente numa data. */
class GoalIT extends IntegrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    private long createHabit(Session session, String name, int goal) throws Exception {
        return body(perform(session, post("/api/habits"), Map.of("name", name, "emoji", "", "goal", goal))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.goal").value(goal))
            .andReturn()).get("id").asLong();
    }

    private ResultActions goalsAt(Session session, LocalDate at) throws Exception {
        return perform(session, get("/api/goals").param("at", at.toString())).andExpect(status().isOk());
    }

    @Test
    void metaOpcionalNaCriacao() throws Exception {
        Session session = newUser();
        long comMeta = createHabit(session, "Correr", 3);
        createHabit(session, "Ler");

        perform(session, get("/api/habits"))
            .andExpect(jsonPath("$[0].goal").value(3))
            .andExpect(jsonPath("$[1].goal").value(nullValue()));
        goalsAt(session, TODAY)
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].habitId").value(comMeta))
            .andExpect(jsonPath("$[0].daysPerWeek").value(3));
        // Antes de hoje o hábito ainda não tinha meta
        goalsAt(session, TODAY.minusDays(1)).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void metaInvalidaRecusada() throws Exception {
        Session session = newUser();
        long habit = createHabit(session, "Correr", 3);

        for (int invalida : new int[] {0, 8}) {
            perform(session, post("/api/habits"), Map.of("name", "Outro", "emoji", "", "goal", invalida))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION"))
                .andExpect(jsonPath("$.fields.goal").value("A meta deve ser de 1 a 7 dias por semana."));
            perform(session, patch("/api/habits/" + habit), Map.of("name", "Correr", "emoji", "", "goal", invalida))
                .andExpect(status().isBadRequest());
        }

        // Nada foi criado nem alterado
        perform(session, get("/api/habits"))
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].goal").value(3));
    }

    @Test
    void mudancaNoMesmoDiaSobrescreve() throws Exception {
        Session session = newUser();
        long habit = createHabit(session, "Correr", 3);

        perform(session, patch("/api/habits/" + habit), Map.of("name", "Correr", "emoji", "", "goal", 5))
            .andExpect(jsonPath("$.goal").value(5));
        perform(session, patch("/api/habits/" + habit), Map.of("name", "Correr", "emoji", "", "goal", 4))
            .andExpect(status().isOk());

        goalsAt(session, TODAY).andExpect(jsonPath("$[0].daysPerWeek").value(4));
        assertThat(jdbc.queryForObject("select count(*) from habit_goals where habit_id = ?", Integer.class, habit))
            .isEqualTo(1);
    }

    @Test
    void semanasPassadasGuardamAMetaDaEpoca() throws Exception {
        Session session = newUser();
        long habit = createHabit(session, "Correr");
        LocalDate antes = TODAY.minusDays(20);
        jdbc.update("insert into habit_goals (habit_id, valid_from, days_per_week) values (?, ?, 3)", habit, antes);

        perform(session, patch("/api/habits/" + habit), Map.of("name", "Correr", "emoji", "", "goal", 5))
            .andExpect(jsonPath("$.goal").value(5));

        goalsAt(session, TODAY).andExpect(jsonPath("$[0].daysPerWeek").value(5));
        goalsAt(session, TODAY.minusDays(7)).andExpect(jsonPath("$[0].daysPerWeek").value(3));
        goalsAt(session, antes).andExpect(jsonPath("$[0].daysPerWeek").value(3));
        goalsAt(session, antes.minusDays(1)).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void removerMetaNaoApagaOPassado() throws Exception {
        Session session = newUser();
        long habit = createHabit(session, "Correr");
        jdbc.update("insert into habit_goals (habit_id, valid_from, days_per_week) values (?, ?, 3)", habit, TODAY.minusDays(10));

        // PATCH sem goal = sem meta a partir de hoje
        perform(session, patch("/api/habits/" + habit), Map.of("name", "Correr", "emoji", ""))
            .andExpect(jsonPath("$.goal").value(nullValue()));

        goalsAt(session, TODAY).andExpect(jsonPath("$", hasSize(0)));
        goalsAt(session, TODAY.minusDays(1)).andExpect(jsonPath("$[0].daysPerWeek").value(3));
    }

    @Test
    void arquivarERestaurarMantemAMeta() throws Exception {
        Session session = newUser();
        long habit = createHabit(session, "Correr", 2);

        perform(session, post("/api/habits/" + habit + "/archive")).andExpect(jsonPath("$.goal").value(2));
        perform(session, post("/api/habits/" + habit + "/restore")).andExpect(jsonPath("$.goal").value(2));
        perform(session, get("/api/habits")).andExpect(jsonPath("$[*].goal", contains(2)));
    }

    @Test
    void dataObrigatoria() throws Exception {
        Session session = newUser();
        perform(session, get("/api/goals"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }
}
