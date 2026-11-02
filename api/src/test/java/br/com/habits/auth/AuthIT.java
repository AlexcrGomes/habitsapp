package br.com.habits.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import br.com.habits.IntegrationTest;
import br.com.habits.user.UserRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

/** Spec 005 — US1 (cadastro), US2 (login/logout/sessão), US6 (troca de senha) e Princípio VII. */
class AuthIT extends IntegrationTest {

    @Autowired
    UserRepository users;

    private MvcResult login(String email, String password) throws Exception {
        return mvc.perform(post("/api/auth/login").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", email, "password", password))))
            .andReturn();
    }

    @Test
    void cadastroCriaContaJaLogadaENaoDevolveSenha() throws Exception {
        String email = uniqueEmail();
        Session session = register("  Ana Souza ", email, "senha-segura");

        perform(session, get("/api/auth/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Ana Souza"))
            .andExpect(jsonPath("$.email").value(email))
            .andExpect(jsonPath("$.weekMode").value("rolling"))
            .andExpect(jsonPath("$.password").doesNotExist())
            .andExpect(jsonPath("$.passwordHash").doesNotExist());

        assertThat(users.findByEmail(email).orElseThrow().getPasswordHash()).startsWith("$2");
    }

    @Test
    void emailDuplicadoSemDiferenciarMaiusculasNemEspacos() throws Exception {
        String email = uniqueEmail();
        register("Bia", email.toUpperCase(), "senha-segura");

        mvc.perform(post("/api/auth/register").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("name", "Outra", "email", "  " + email + " ", "password", "outra-senha"))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("EMAIL_TAKEN"))
            .andExpect(jsonPath("$.message").value("Este e-mail já está cadastrado."));
    }

    @Test
    void validacoesDoCadastro() throws Exception {
        mvc.perform(post("/api/auth/register").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("name", " ", "email", "invalido", "password", "curta"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION"))
            .andExpect(jsonPath("$.fields.name").value("Informe o nome."))
            .andExpect(jsonPath("$.fields.email").value("Informe um e-mail válido."))
            .andExpect(jsonPath("$.fields.password").value("A senha deve ter pelo menos 8 caracteres."));
    }

    @Test
    void loginComSucessoAceitaEmailComMaiusculasETrocaOIdDaSessao() throws Exception {
        String email = uniqueEmail();
        Session cadastro = register("Caio", email, "senha-segura");

        MvcResult result = login(" " + email.toUpperCase() + " ", "senha-segura");
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        Session session = sessionFrom(result);
        assertThat(session.cookie().getValue()).isNotEqualTo(cadastro.cookie().getValue());

        perform(session, get("/api/auth/me")).andExpect(status().isOk());
    }

    @Test
    void falhaDeLoginNaoRevelaSeOEmailExiste() throws Exception {
        String email = uniqueEmail();
        register("Duda", email, "senha-segura");

        MvcResult senhaErrada = login(email, "senha-errada");
        MvcResult emailInexistente = login(uniqueEmail(), "senha-segura");

        assertThat(senhaErrada.getResponse().getStatus()).isEqualTo(401);
        assertThat(emailInexistente.getResponse().getStatus()).isEqualTo(401);
        assertThat(body(senhaErrada)).isEqualTo(body(emailInexistente));
        assertThat(body(senhaErrada).get("message").asText()).isEqualTo("E-mail ou senha inválidos.");
    }

    @Test
    void semSessaoAsRotasRespondem401() throws Exception {
        mvc.perform(get("/api/auth/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        mvc.perform(get("/api/habits")).andExpect(status().isUnauthorized());
    }

    @Test
    void logoutEncerraASessao() throws Exception {
        Session session = newUser();

        perform(session, post("/api/auth/logout")).andExpect(status().isNoContent());

        perform(session, get("/api/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void requisicaoQueAlteraDadosSemCsrfERecusada() throws Exception {
        Session session = newUser();

        mvc.perform(post("/api/habits").cookie(session.cookie())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Ler\"}"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void trocaDeSenha() throws Exception {
        String email = uniqueEmail();
        Session session = register("Eva", email, "senha-antiga");

        perform(session, put("/api/me/password"), Map.of("currentPassword", "errada", "newPassword", "senha-nova-1"))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("WRONG_PASSWORD"))
            .andExpect(jsonPath("$.message").value("Senha atual incorreta."));

        perform(session, put("/api/me/password"), Map.of("currentPassword", "senha-antiga", "newPassword", "curta"))
            .andExpect(status().isBadRequest());

        perform(session, put("/api/me/password"), Map.of("currentPassword", "senha-antiga", "newPassword", "senha-nova-1"))
            .andExpect(status().isNoContent());

        // Continua logado (6.1) e só a nova senha funciona (6.3)
        perform(session, get("/api/auth/me")).andExpect(status().isOk());
        assertThat(login(email, "senha-antiga").getResponse().getStatus()).isEqualTo(401);
        assertThat(login(email, "senha-nova-1").getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void preferenciaDeSemanaFicaNaConta() throws Exception {
        Session session = newUser();

        perform(session, put("/api/me/settings"), Map.of("weekMode", "calendar"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.weekMode").value("calendar"));
        perform(session, get("/api/auth/me")).andExpect(jsonPath("$.weekMode").value("calendar"));

        perform(session, put("/api/me/settings"), Map.of("weekMode", "mensal"))
            .andExpect(status().isBadRequest());
    }
}
