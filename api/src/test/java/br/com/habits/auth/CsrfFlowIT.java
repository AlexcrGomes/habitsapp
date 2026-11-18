package br.com.habits.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import br.com.habits.IntegrationTest;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/**
 * Fluxo de CSRF e cookies por HTTP real, como o navegador faz. Não usa MockMvc: o pós-processador
 * csrf() do spring-security-test troca o repositório de tokens do filtro e mascararia o comportamento.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CsrfFlowIT extends IntegrationTest {

    @Autowired
    TestRestTemplate http;

    @Test
    void primeiraRequisicaoEntregaOTokenEOCadastroSoPassaComOHeader() {
        ResponseEntity<String> me = http.getForEntity("/api/auth/me", String.class);
        assertThat(me.getStatusCode().value()).isEqualTo(401);
        String xsrf = cookieValue(me, "XSRF-TOKEN");
        assertThat(xsrf).as("cookie XSRF-TOKEN").isNotNull();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add(HttpHeaders.COOKIE, "XSRF-TOKEN=" + xsrf);
        Map<String, String> body = Map.of("name", "Fia", "email", uniqueEmail(), "password", "senha-segura");

        ResponseEntity<String> semHeader = http.postForEntity("/api/auth/register", new HttpEntity<>(body, headers), String.class);
        assertThat(semHeader.getStatusCode().value()).isEqualTo(403);

        headers.add("X-XSRF-TOKEN", xsrf);
        ResponseEntity<String> comHeader = http.postForEntity("/api/auth/register", new HttpEntity<>(body, headers), String.class);
        assertThat(comHeader.getStatusCode().value()).isEqualTo(201);

        String sessionCookie = setCookie(comHeader, "SESSION");
        assertThat(sessionCookie).contains("HttpOnly").contains("SameSite=Lax");
        // Spec 010, RF-014: o login sobrevive a fechar o navegador/app por 7 dias
        assertThat(sessionCookie).contains("Max-Age=604800");
    }

    @Test
    void sairApagaOCookieDaSessao() {
        // Cadastro (entra logado) com o token CSRF da primeira requisição
        ResponseEntity<String> me = http.getForEntity("/api/auth/me", String.class);
        String xsrf = cookieValue(me, "XSRF-TOKEN");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add(HttpHeaders.COOKIE, "XSRF-TOKEN=" + xsrf);
        headers.add("X-XSRF-TOKEN", xsrf);
        Map<String, String> body = Map.of("name", "Gil", "email", uniqueEmail(), "password", "senha-segura");
        ResponseEntity<String> cadastro = http.postForEntity("/api/auth/register", new HttpEntity<>(body, headers), String.class);
        assertThat(cadastro.getStatusCode().value()).isEqualTo(201);
        String session = cookieValue(cadastro, "SESSION");

        // Logado, o token CSRF pode ter sido renovado: pega o atual como o frontend faz
        HttpHeaders logado = new HttpHeaders();
        logado.add(HttpHeaders.COOKIE, "SESSION=" + session);
        ResponseEntity<String> meLogado = http.exchange("/api/auth/me", HttpMethod.GET, new HttpEntity<>(logado), String.class);
        assertThat(meLogado.getStatusCode().value()).isEqualTo(200);
        String token = cookieValue(meLogado, "XSRF-TOKEN") != null ? cookieValue(meLogado, "XSRF-TOKEN") : xsrf;

        HttpHeaders sair = new HttpHeaders();
        sair.add(HttpHeaders.COOKIE, "SESSION=" + session + "; XSRF-TOKEN=" + token);
        sair.add("X-XSRF-TOKEN", token);
        ResponseEntity<String> logout = http.exchange("/api/auth/logout", HttpMethod.POST, new HttpEntity<>(sair), String.class);
        assertThat(logout.getStatusCode().value()).isEqualTo(204);
        assertThat(setCookie(logout, "SESSION")).as("cookie SESSION apagado").isNotNull().contains("Max-Age=0");
    }

    private static String setCookie(ResponseEntity<?> response, String name) {
        return response.getHeaders().getOrEmpty(HttpHeaders.SET_COOKIE).stream()
            .filter(cookie -> cookie.startsWith(name + "="))
            .findFirst()
            .orElse(null);
    }

    private static String cookieValue(ResponseEntity<?> response, String name) {
        String cookie = setCookie(response, name);
        return cookie == null ? null : cookie.substring(name.length() + 1, cookie.indexOf(';'));
    }
}
