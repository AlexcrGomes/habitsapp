package br.com.habits.push;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.Signature;
import java.security.interfaces.ECPrivateKey;
import java.time.Duration;
import java.time.Instant;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Chaves VAPID do servidor (RFC 8292), lidas do .env (spec 011, plan P2). Sem chaves válidas,
 * {@link #available()} é falso e as notificações aparecem como indisponíveis.
 */
@Component
public class VapidKeys {

    static final Duration TOKEN_VALIDITY = Duration.ofHours(12);

    private static final ObjectMapper JSON = new ObjectMapper();

    private final String publicKey;
    private final ECPrivateKey privateKey;
    private final String subject;

    public VapidKeys(@Value("${habits.vapid.public-key:}") String publicKey,
                     @Value("${habits.vapid.private-key:}") String privateKey,
                     @Value("${habits.vapid.subject:mailto:contato@example.com}") String subject) {
        ECPrivateKey parsed = null;
        String publicKeyOrNull = null;
        if (!publicKey.isBlank() && !privateKey.isBlank()) {
            try {
                EcKeys.publicKey(Base64Url.decode(publicKey.trim()));
                parsed = EcKeys.privateKey(Base64Url.decode(privateKey.trim()));
                publicKeyOrNull = publicKey.trim();
            } catch (GeneralSecurityException | IllegalArgumentException e) {
                throw new IllegalStateException("Chaves VAPID inválidas: gere de novo com scripts/gerar-vapid.sh", e);
            }
        }
        this.publicKey = publicKeyOrNull;
        this.privateKey = parsed;
        this.subject = subject.isBlank() ? "mailto:contato@example.com" : subject.trim();
    }

    public boolean available() {
        return privateKey != null;
    }

    /** Chave pública em base64url, entregue ao navegador para a inscrição (applicationServerKey). */
    public String publicKey() {
        return publicKey;
    }

    /** Cabeçalho Authorization do envio: {@code vapid t=<JWT ES256>, k=<chave pública>}. */
    public String authorization(String endpoint, Instant now) throws GeneralSecurityException {
        if (!available()) {
            throw new IllegalStateException("Chaves VAPID não configuradas");
        }
        URI uri = URI.create(endpoint);
        String audience = uri.getScheme() + "://" + uri.getRawAuthority();
        String header = Base64Url.encode("{\"typ\":\"JWT\",\"alg\":\"ES256\"}".getBytes(StandardCharsets.UTF_8));
        String claims;
        try {
            claims = Base64Url.encode(JSON.writeValueAsBytes(java.util.Map.of(
                "aud", audience,
                "exp", now.plus(TOKEN_VALIDITY).getEpochSecond(),
                "sub", subject)));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
        String signingInput = header + "." + claims;
        // P1363 = r || s com 32 bytes cada, o formato que o JWS exige (em vez do DER padrão do JDK)
        Signature signer = Signature.getInstance("SHA256withECDSAinP1363Format");
        signer.initSign(privateKey);
        signer.update(signingInput.getBytes(StandardCharsets.US_ASCII));
        String token = signingInput + "." + Base64Url.encode(signer.sign());
        return "vapid t=" + token + ", k=" + publicKey;
    }
}
