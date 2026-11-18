package br.com.habits.notification;

import java.time.OffsetDateTime;

import br.com.habits.push.PushSender;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Aparelho com notificações ativas: a inscrição de push do navegador (spec 011, plan P4). */
@Entity
@Table(name = "push_subscriptions")
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    private String endpoint;

    private String p256dh;

    private String auth;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected PushSubscription() {
    }

    public PushSubscription(Long userId, String endpoint, String p256dh, String auth) {
        this.userId = userId;
        this.endpoint = endpoint;
        this.p256dh = p256dh;
        this.auth = auth;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getEndpoint() {
        return endpoint;
    }

    /** Mesmo aparelho, outra conta (ou chaves renovadas): a inscrição passa para quem a enviou. */
    public void reassign(Long userId, String p256dh, String auth) {
        this.userId = userId;
        this.p256dh = p256dh;
        this.auth = auth;
    }

    public PushSender.Target target() {
        return new PushSender.Target(endpoint, p256dh, auth);
    }
}
