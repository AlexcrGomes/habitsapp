package br.com.habits;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.security.GeneralSecurityException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECPoint;
import java.time.Clock;
import java.util.Base64;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import br.com.habits.config.ClockConfig;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.Cookie;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Base dos testes de integração: PostgreSQL real (Testcontainers) e relógio fixo em
 * sábado, 31/10/2026, meio-dia no horário de Brasília.
 */
@SpringBootTest(properties = "habits.notifications.scheduler.enabled=false")
@AutoConfigureMockMvc
@Import(IntegrationTest.FixedClockConfig.class)
public abstract class IntegrationTest {

    protected static final LocalDate TODAY = LocalDate.of(2026, 10, 31);

    // Um único contêiner para todas as classes: o contexto do Spring é reaproveitado entre elas
    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17.11-alpine");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        // Chaves VAPID geradas para os testes (spec 011): as notificações ficam disponíveis
        registry.add("habits.vapid.public-key", () -> VAPID[0]);
        registry.add("habits.vapid.private-key", () -> VAPID[1]);
    }

    /** [pública, privada] em base64url, como as do scripts/gerar-vapid.sh. */
    private static final String[] VAPID = generateVapidKeys();

    private static String[] generateVapidKeys() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
            generator.initialize(new ECGenParameterSpec("secp256r1"));
            KeyPair pair = generator.generateKeyPair();
            ECPoint w = ((ECPublicKey) pair.getPublic()).getW();
            byte[] publicKey = new byte[65];
            publicKey[0] = 0x04;
            copy32(w.getAffineX().toByteArray(), publicKey, 1);
            copy32(w.getAffineY().toByteArray(), publicKey, 33);
            byte[] privateKey = new byte[32];
            copy32(((ECPrivateKey) pair.getPrivate()).getS().toByteArray(), privateKey, 0);
            Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
            return new String[] {encoder.encodeToString(publicKey), encoder.encodeToString(privateKey)};
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private static void copy32(byte[] raw, byte[] out, int offset) {
        int length = Math.min(raw.length, 32);
        System.arraycopy(raw, raw.length - length, out, offset + 32 - length, length);
    }

    @TestConfiguration
    static class FixedClockConfig {

        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(TODAY.atTime(12, 0).atZone(ClockConfig.ZONE).toInstant(), ClockConfig.ZONE);
        }

        @Bean
        @Primary
        FakePushSender fakePushSender() {
            return new FakePushSender();
        }
    }

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper json;

    /** Cookie de sessão de um usuário logado. */
    protected record Session(Cookie cookie, long userId) {
    }

    protected static String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@teste.com";
    }

    protected Session register(String name, String email, String password) throws Exception {
        MvcResult result = mvc.perform(post("/api/auth/register").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("name", name, "email", email, "password", password))))
            .andExpect(status().isCreated())
            .andReturn();
        return sessionFrom(result);
    }

    protected Session newUser() throws Exception {
        return register("Ana", uniqueEmail(), "senha-segura");
    }

    protected Session sessionFrom(MvcResult result) throws Exception {
        Cookie cookie = result.getResponse().getCookie("SESSION");
        assertThat(cookie).as("cookie de sessão").isNotNull();
        return new Session(cookie, body(result).get("id").asLong());
    }

    protected ResultActions perform(Session session, MockHttpServletRequestBuilder request) throws Exception {
        return mvc.perform(request.with(csrf()).cookie(session.cookie()));
    }

    protected ResultActions perform(Session session, MockHttpServletRequestBuilder request, Object body) throws Exception {
        return perform(session, request.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)));
    }

    protected JsonNode body(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString());
    }

    protected long createHabit(Session session, String name) throws Exception {
        MvcResult result = perform(session, post("/api/habits"), Map.of("name", name, "emoji", ""))
            .andExpect(status().isCreated())
            .andReturn();
        return body(result).get("id").asLong();
    }
}
