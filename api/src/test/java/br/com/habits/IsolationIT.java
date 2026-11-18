package br.com.habits;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

/**
 * Spec 005, US3 / Princípio III: o usuário B não lê nem altera nada do usuário A, em nenhuma rota.
 * Recurso alheio responde 404, como se não existisse.
 */
class IsolationIT extends IntegrationTest {

    @Test
    void usuarioBNaoAcessaNadaDoUsuarioA() throws Exception {
        Session a = newUser();
        Session b = newUser();

        long ativo = createHabit(a, "Ler");
        long arquivado = createHabit(a, "Correr");
        perform(a, patch("/api/habits/" + ativo), Map.of("name", "Ler", "emoji", "", "goal", 3)).andExpect(status().isOk());
        perform(a, put("/api/checks/" + ativo + "/" + TODAY)).andExpect(status().isNoContent());
        perform(a, post("/api/habits/" + arquivado + "/archive")).andExpect(status().isOk());
        perform(a, put("/api/me/settings"), Map.of("weekMode", "calendar")).andExpect(status().isOk());

        // Leitura: B não vê nada de A
        perform(b, get("/api/habits")).andExpect(jsonPath("$", hasSize(0)));
        perform(b, get("/api/checks").param("from", TODAY.minusDays(6).toString()).param("to", TODAY.toString()))
            .andExpect(jsonPath("$", hasSize(0)));
        perform(b, get("/api/goals").param("at", TODAY.toString())).andExpect(jsonPath("$", hasSize(0)));
        perform(b, get("/api/auth/me"))
            .andExpect(jsonPath("$.id").value(b.userId()))
            .andExpect(jsonPath("$.weekMode").value("rolling"));

        // Escrita: toda rota com id de A responde 404
        perform(b, patch("/api/habits/" + ativo), Map.of("name", "Invadido", "emoji", "")).andExpect(status().isNotFound());
        perform(b, patch("/api/habits/" + ativo), Map.of("name", "Ler", "emoji", "", "goal", 7)).andExpect(status().isNotFound());
        perform(b, post("/api/habits/" + ativo + "/archive")).andExpect(status().isNotFound());
        perform(b, post("/api/habits/" + arquivado + "/restore")).andExpect(status().isNotFound());
        perform(b, delete("/api/habits/" + arquivado)).andExpect(status().isNotFound());
        perform(b, put("/api/habits/order"), Map.of("ids", List.of(ativo))).andExpect(status().isNotFound());
        perform(b, put("/api/checks/" + ativo + "/" + TODAY.minusDays(1))).andExpect(status().isNotFound());
        perform(b, delete("/api/checks/" + ativo + "/" + TODAY)).andExpect(status().isNotFound());

        // B pode ter hábito com o mesmo nome, e reordenar os próprios não mexe nos de A
        long doB = createHabit(b, "Ler");
        perform(b, put("/api/habits/order"), Map.of("ids", List.of(doB))).andExpect(status().isOk());

        // Nada de A mudou
        perform(a, get("/api/habits"))
            .andExpect(jsonPath("$[*].name", contains("Ler", "Correr")))
            .andExpect(jsonPath("$[1].archived").value(true))
            .andExpect(jsonPath("$[0].goal").value(3));
        perform(a, get("/api/goals").param("at", TODAY.toString()))
            .andExpect(jsonPath("$[*].habitId", contains((int) ativo)))
            .andExpect(jsonPath("$[0].daysPerWeek").value(3));
        perform(a, get("/api/checks").param("from", TODAY.toString()).param("to", TODAY.toString()))
            .andExpect(jsonPath("$[*].habitId", contains((int) ativo)));
        perform(a, get("/api/auth/me")).andExpect(jsonPath("$.weekMode").value("calendar"));
    }

    /** Spec 011: preferências e aparelhos de notificação são de cada conta. */
    @Test
    void notificacoesSaoIsoladasPorUsuario() throws Exception {
        Session a = newUser();
        Session b = newUser();
        String aparelhoDeA = "https://fcm.googleapis.com/fcm/send/" + java.util.UUID.randomUUID();
        perform(a, put("/api/notifications/devices"), Map.of("endpoint", aparelhoDeA, "keys", Map.of(
            "p256dh", "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4",
            "auth", "BTBZMqHH6r4Tts7J_aSIgg"))).andExpect(status().isNoContent());
        perform(a, put("/api/notifications/settings"),
            Map.of("reminderTime", "21:15", "daily", false, "atRisk", true, "summary", true))
            .andExpect(status().isNoContent());

        // B vê os próprios padrões, não as preferências de A
        perform(b, get("/api/notifications"))
            .andExpect(jsonPath("$.reminderTime").value("20:00"))
            .andExpect(jsonPath("$.daily").value(true));
        // B não desativa o aparelho de A
        perform(b, delete("/api/notifications/devices"), Map.of("endpoint", aparelhoDeA))
            .andExpect(status().isNotFound());
        // B muda as próprias preferências sem mexer nas de A
        perform(b, put("/api/notifications/settings"),
            Map.of("reminderTime", "07:00", "daily", true, "atRisk", false, "summary", false))
            .andExpect(status().isNoContent());

        perform(a, get("/api/notifications"))
            .andExpect(jsonPath("$.reminderTime").value("21:15"))
            .andExpect(jsonPath("$.daily").value(false))
            .andExpect(jsonPath("$.atRisk").value(true));
        perform(a, delete("/api/notifications/devices"), Map.of("endpoint", aparelhoDeA))
            .andExpect(status().isNoContent());
    }
}
