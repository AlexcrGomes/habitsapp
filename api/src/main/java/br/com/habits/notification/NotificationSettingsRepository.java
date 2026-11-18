package br.com.habits.notification;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/** A chave é o próprio userId: uma linha por conta, sempre buscada pelo dono (Princípio III). */
public interface NotificationSettingsRepository extends JpaRepository<NotificationSettings, Long> {

    /** Contas com ao menos um aparelho ativo: as únicas que o agendador precisa olhar. */
    @Query("""
        select s from NotificationSettings s
        where exists (select 1 from PushSubscription p where p.userId = s.userId)
        order by s.userId
        """)
    List<NotificationSettings> findWithDevices();
}
