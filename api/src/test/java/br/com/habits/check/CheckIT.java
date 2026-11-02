package br.com.habits.check;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.Map;

import br.com.habits.IntegrationTest;

import org.junit.jupiter.api.Test;

/** Janela editável da spec 004 (hoje + 6 anteriores, horário de Brasília) aplicada pela API. */
class CheckIT extends IntegrationTest {

    private String url(long habitId, LocalDate day) {
        return "/api/checks/" + habitId + "/" + day;
    }

    @Test
    void marcaHojeEOsSeisDiasAnteriores() throws Exception {
        Session session = newUser();
        long habit = createHabit(session, "Ler");

        perform(session, put(url(habit, TODAY))).andExpect(status().isNoContent());
        perform(session, put(url(habit, TODAY.minusDays(6)))).andExpect(status().isNoContent());
        // Idempotente
        perform(session, put(url(habit, TODAY))).andExpect(status().isNoContent());

        perform(session, get("/api/checks").param("from", TODAY.minusDays(6).toString()).param("to", TODAY.toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[*].day", contains(TODAY.minusDays(6).toString(), TODAY.toString())))
            .andExpect(jsonPath("$[0].habitId").value(habit));
    }

    @Test
    void recusaDiasForaDaJanela() throws Exception {
        Session session = newUser();
        long habit = createHabit(session, "Ler");

        perform(session, put(url(habit, TODAY.minusDays(7))))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("NOT_EDITABLE"));
        perform(session, put(url(habit, TODAY.plusDays(1))))
            .andExpect(status().isUnprocessableEntity());
        perform(session, delete(url(habit, TODAY.minusDays(7))))
            .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void desmarcaEPreservaMarcacoesAoEditarOHabito() throws Exception {
        Session session = newUser();
        long habit = createHabit(session, "Ler");
        perform(session, put(url(habit, TODAY))).andExpect(status().isNoContent());
        perform(session, put(url(habit, TODAY.minusDays(1)))).andExpect(status().isNoContent());

        perform(session, delete(url(habit, TODAY))).andExpect(status().isNoContent());
        perform(session, patch("/api/habits/" + habit), Map.of("name", "Leitura", "emoji", "📚")).andExpect(status().isOk());

        perform(session, get("/api/checks").param("from", TODAY.minusDays(6).toString()).param("to", TODAY.toString()))
            .andExpect(jsonPath("$[*].day", contains(TODAY.minusDays(1).toString())));
    }

    @Test
    void habitoArquivadoNaoPodeSerMarcadoEExcluirApagaAsMarcacoes() throws Exception {
        Session session = newUser();
        long habit = createHabit(session, "Ler");
        perform(session, put(url(habit, TODAY))).andExpect(status().isNoContent());
        perform(session, post("/api/habits/" + habit + "/archive")).andExpect(status().isOk());

        perform(session, put(url(habit, TODAY.minusDays(1))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("HABIT_ARCHIVED"));

        perform(session, delete("/api/habits/" + habit)).andExpect(status().isNoContent());
        perform(session, get("/api/checks").param("from", TODAY.toString()).param("to", TODAY.toString()))
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void parametrosInvalidos() throws Exception {
        Session session = newUser();
        long habit = createHabit(session, "Ler");

        perform(session, put("/api/checks/" + habit + "/31-10-2026")).andExpect(status().isBadRequest());
        perform(session, get("/api/checks").param("from", TODAY.toString()).param("to", TODAY.minusDays(1).toString()))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_RANGE"));
        perform(session, get("/api/checks").param("from", TODAY.minusDays(400).toString()).param("to", TODAY.toString()))
            .andExpect(status().isBadRequest());
    }
}
