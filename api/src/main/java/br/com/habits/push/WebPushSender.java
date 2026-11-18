package br.com.habits.push;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.Clock;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** Envio Web Push com o HttpClient do JDK (spec 011, plan P2, P7, P12). */
@Component
public class WebPushSender implements PushSender {

    private static final Logger log = LoggerFactory.getLogger(WebPushSender.class);
    private static final Duration TIMEOUT = Duration.ofSeconds(10);

    private final VapidKeys vapid;
    private final Clock clock;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(TIMEOUT).build();

    public WebPushSender(VapidKeys vapid, Clock clock) {
        this.vapid = vapid;
        this.clock = clock;
    }

    @Override
    public Result send(Target target, String payload, Duration ttl) {
        try {
            byte[] body = WebPushEncryption.encrypt(payload.getBytes(StandardCharsets.UTF_8),
                Base64Url.decode(target.p256dh()), Base64Url.decode(target.auth()));
            HttpRequest request = HttpRequest.newBuilder(URI.create(target.endpoint()))
                .timeout(TIMEOUT)
                .header("Authorization", vapid.authorization(target.endpoint(), clock.instant()))
                .header("Content-Encoding", "aes128gcm")
                .header("Content-Type", "application/octet-stream")
                .header("TTL", Long.toString(Math.max(60, ttl.toSeconds())))
                .header("Urgency", "normal")
                .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                .build();
            int status = http.send(request, HttpResponse.BodyHandlers.discarding()).statusCode();
            if (status >= 200 && status < 300) {
                return Result.DELIVERED;
            }
            if (status == 404 || status == 410) {
                return Result.EXPIRED;
            }
            // Só o código: endereço e chaves do aparelho nunca vão para o log (Princípio VII)
            log.warn("Serviço de push recusou a notificação: HTTP {}", status);
            return Result.FAILED;
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            log.warn("Não foi possível cifrar a notificação: {}", e.getClass().getSimpleName());
            return Result.FAILED;
        } catch (IOException e) {
            log.warn("Falha de rede ao enviar a notificação: {}", e.getClass().getSimpleName());
            return Result.FAILED;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Result.FAILED;
        }
    }
}
