package br.com.habits.notification;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    /** Uso interno do upsert: o endpoint é único por aparelho, de qualquer conta. */
    Optional<PushSubscription> findByEndpoint(String endpoint);

    Optional<PushSubscription> findByEndpointAndUserId(String endpoint, Long userId);

    List<PushSubscription> findByUserIdOrderById(Long userId);
}
