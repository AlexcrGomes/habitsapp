package br.com.habits.push;

import java.time.Duration;

/** Entrega uma mensagem a um aparelho inscrito. Nos testes, é trocado por um falso. */
public interface PushSender {

    /** Aparelho de destino: endereço do serviço de push e as chaves do aparelho (base64url). */
    record Target(String endpoint, String p256dh, String auth) {
    }

    enum Result {
        /** O serviço de push aceitou a mensagem. */
        DELIVERED,
        /** A inscrição não existe mais (404/410): deve ser apagada. */
        EXPIRED,
        /** Erro passageiro ou desconhecido: só registrado no log. */
        FAILED
    }

    /**
     * @param payload mensagem em JSON (cifrada antes do envio)
     * @param ttl     tempo que o serviço de push guarda a mensagem se o aparelho estiver fora do ar
     */
    Result send(Target target, String payload, Duration ttl);
}
