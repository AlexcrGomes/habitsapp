package br.com.habits.habit;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;

import br.com.habits.IntegrationTest;

import org.junit.jupiter.api.Test;

/** Regras da spec 002, agora aplicadas pela API (spec 005, US4). */
class HabitIT extends IntegrationTest {

    @Test
    void criaComNomeAparadoEApenasOPrimeiroEmoji() throws Exception {
        Session session = newUser();

        perform(session, post("/api/habits"), Map.of("name", "  Programar ", "emoji", "👩‍💻 extra"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Programar"))
            .andExpect(jsonPath("$.emoji").value("👩‍💻"))
            .andExpect(jsonPath("$.archived").value(false));
    }

    /** Spec 012, US1: objetivo opcional, aparado, até 60 caracteres; PATCH sem o campo mantém. */
    @Test
    void objetivoOpcionalAparadoEMantidoQuandoAusente() throws Exception {
        Session session = newUser();

        long ler = body(perform(session, post("/api/habits"),
                Map.of("name", "Ler", "emoji", "", "objective", "  Ler pelo menos 10 páginas  "))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.objective").value("Ler pelo menos 10 páginas"))
            .andReturn()).get("id").asLong();
        perform(session, post("/api/habits"), Map.of("name", "Correr", "emoji", "", "objective", "   "))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.objective").value(nullValue()));
        perform(session, post("/api/habits"), Map.of("name", "Meditar", "emoji", ""))
            .andExpect(jsonPath("$.objective").value(nullValue()));

        // Sem o campo (cliente antigo): mantém
        perform(session, patch("/api/habits/" + ler), Map.of("name", "Ler", "emoji", "📚"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.objective").value("Ler pelo menos 10 páginas"));
        // Presente: substitui
        perform(session, patch("/api/habits/" + ler), Map.of("name", "Ler", "emoji", "", "objective", "Ler 20 páginas"))
            .andExpect(jsonPath("$.objective").value("Ler 20 páginas"));

        // Arquivar e restaurar mantém
        perform(session, post("/api/habits/" + ler + "/archive")).andExpect(jsonPath("$.objective").value("Ler 20 páginas"));
        perform(session, post("/api/habits/" + ler + "/restore")).andExpect(jsonPath("$.objective").value("Ler 20 páginas"));
        perform(session, get("/api/habits")).andExpect(jsonPath("$[?(@.name == 'Ler')].objective", contains("Ler 20 páginas")));

        // "" e null explícito removem
        perform(session, patch("/api/habits/" + ler), Map.of("name", "Ler", "emoji", "", "objective", ""))
            .andExpect(jsonPath("$.objective").value(nullValue()));
        perform(session, patch("/api/habits/" + ler), Map.of("name", "Ler", "emoji", "", "objective", "Voltou"))
            .andExpect(jsonPath("$.objective").value("Voltou"));
        java.util.Map<String, Object> semObjetivo = new java.util.HashMap<>(Map.of("name", "Ler", "emoji", ""));
        semObjetivo.put("objective", null);
        perform(session, patch("/api/habits/" + ler), semObjetivo)
            .andExpect(jsonPath("$.objective").value(nullValue()));
    }

    @Test
    void validaTamanhoDoObjetivo() throws Exception {
        Session session = newUser();

        perform(session, post("/api/habits"), Map.of("name", "Ler", "emoji", "", "objective", "x".repeat(60)))
            .andExpect(status().isCreated());
        perform(session, post("/api/habits"), Map.of("name", "Correr", "emoji", "", "objective", "x".repeat(61)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION"))
            .andExpect(jsonPath("$.fields.objective").value("O objetivo deve ter no máximo 60 caracteres."))
            .andExpect(jsonPath("$.message").value("O objetivo deve ter no máximo 60 caracteres."));
        // Nada foi criado com o objetivo inválido
        perform(session, get("/api/habits")).andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void validaNome() throws Exception {
        Session session = newUser();

        perform(session, post("/api/habits"), Map.of("name", "   ", "emoji", ""))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION"))
            .andExpect(jsonPath("$.message").value("Informe o nome do hábito."));

        perform(session, post("/api/habits"), Map.of("name", "x".repeat(31), "emoji", ""))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("O nome pode ter no máximo 30 caracteres."));
    }

    @Test
    void nomesUnicosEntreAtivosEArquivadosSemDiferenciarMaiusculas() throws Exception {
        Session session = newUser();
        createHabit(session, "Meditar");
        long arquivado = createHabit(session, "Ler");
        perform(session, post("/api/habits/" + arquivado + "/archive")).andExpect(status().isOk());

        perform(session, post("/api/habits"), Map.of("name", " meditar ", "emoji", ""))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("DUPLICATE_NAME"));

        perform(session, post("/api/habits"), Map.of("name", "LER", "emoji", ""))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("ARCHIVED_DUPLICATE"))
            .andExpect(jsonPath("$.habitId").value(arquivado));
    }

    @Test
    void limiteDeDezAtivosInclusiveAoRestaurar() throws Exception {
        Session session = newUser();
        long arquivado = createHabit(session, "Arquivado");
        perform(session, post("/api/habits/" + arquivado + "/archive")).andExpect(status().isOk());
        for (int i = 1; i <= 10; i++) {
            createHabit(session, "Hábito " + i);
        }

        perform(session, post("/api/habits"), Map.of("name", "Décimo primeiro", "emoji", ""))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("LIMIT_REACHED"));
        perform(session, post("/api/habits/" + arquivado + "/restore"))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("LIMIT_REACHED"));
    }

    @Test
    void editarArquivarRestaurarNoFimEExcluirSoArquivado() throws Exception {
        Session session = newUser();
        long corrida = createHabit(session, "Corrida");
        createHabit(session, "Água");

        perform(session, patch("/api/habits/" + corrida), Map.of("name", "Correr", "emoji", "🏃"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Correr"))
            .andExpect(jsonPath("$.emoji").value("🏃"));

        perform(session, delete("/api/habits/" + corrida))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("NOT_ARCHIVED"));

        perform(session, post("/api/habits/" + corrida + "/archive")).andExpect(jsonPath("$.archived").value(true));
        perform(session, get("/api/habits")).andExpect(jsonPath("$[*].name", contains("Água", "Correr")));

        perform(session, post("/api/habits/" + corrida + "/restore")).andExpect(jsonPath("$.archived").value(false));
        perform(session, get("/api/habits")).andExpect(jsonPath("$[*].name", contains("Água", "Correr")));

        perform(session, post("/api/habits/" + corrida + "/archive")).andExpect(status().isOk());
        perform(session, delete("/api/habits/" + corrida)).andExpect(status().isNoContent());
        perform(session, get("/api/habits")).andExpect(jsonPath("$", hasSize(1)));

        // O nome fica livre depois da exclusão definitiva
        createHabit(session, "Correr");
    }

    @Test
    void reordenaAtivos() throws Exception {
        Session session = newUser();
        long a = createHabit(session, "A");
        long b = createHabit(session, "B");
        long c = createHabit(session, "C");

        perform(session, put("/api/habits/order"), Map.of("ids", List.of(c, a, b)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].name", contains("C", "A", "B")));
        perform(session, get("/api/habits")).andExpect(jsonPath("$[*].name", contains("C", "A", "B")));

        perform(session, put("/api/habits/order"), Map.of("ids", List.of(c, a)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_ORDER"));
        perform(session, put("/api/habits/order"), Map.of("ids", List.of(c, a, a)))
            .andExpect(status().isBadRequest());
    }
}
