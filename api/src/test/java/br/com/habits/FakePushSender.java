package br.com.habits;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import br.com.habits.push.PushSender;

/** Envio falso dos testes: guarda as mensagens e devolve o resultado configurado por endpoint. */
public class FakePushSender implements PushSender {

    public record Sent(Target target, String payload, Duration ttl) {
    }

    private final List<Sent> sent = new ArrayList<>();
    private final Map<String, Result> results = new HashMap<>();

    @Override
    public synchronized Result send(Target target, String payload, Duration ttl) {
        sent.add(new Sent(target, payload, ttl));
        return results.getOrDefault(target.endpoint(), Result.DELIVERED);
    }

    public synchronized List<Sent> sent() {
        return List.copyOf(sent);
    }

    public synchronized void respond(String endpoint, Result result) {
        results.put(endpoint, result);
    }

    public synchronized void clear() {
        sent.clear();
        results.clear();
    }
}
