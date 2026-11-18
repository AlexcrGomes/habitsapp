package br.com.habits.notification;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import br.com.habits.check.CheckRepository;
import br.com.habits.check.HabitCheck;
import br.com.habits.goal.GoalService;
import br.com.habits.habit.HabitRepository;
import br.com.habits.notification.NotificationRules.HabitInfo;
import br.com.habits.notification.NotificationRules.Message;
import br.com.habits.notification.NotificationRules.Week;
import br.com.habits.push.PushSender;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Envia os lembretes no horário de Brasília (spec 011, plan P6–P8). Roda a cada minuto e
 * envia o que vence numa janela de 15 minutos; a data do último envio garante no máximo uma
 * notificação de cada tipo por dia, mesmo se a API reiniciar.
 */
@Component
public class NotificationJob {

    static final LocalTime AT_RISK_TIME = LocalTime.of(9, 0);
    static final long WINDOW_MINUTES = 15;

    private static final Logger log = LoggerFactory.getLogger(NotificationJob.class);

    private final NotificationSettingsRepository settings;
    private final PushSubscriptionRepository subscriptions;
    private final HabitRepository habits;
    private final CheckRepository checks;
    private final GoalService goals;
    private final PushSender sender;
    private final TransactionTemplate transaction;
    private final ObjectMapper json;
    private final Clock clock;
    private final boolean enabled;

    public NotificationJob(NotificationSettingsRepository settings, PushSubscriptionRepository subscriptions,
                           HabitRepository habits, CheckRepository checks, GoalService goals, PushSender sender,
                           TransactionTemplate transaction, ObjectMapper json, Clock clock,
                           @Value("${habits.notifications.scheduler.enabled:true}") boolean enabled) {
        this.settings = settings;
        this.subscriptions = subscriptions;
        this.habits = habits;
        this.checks = checks;
        this.goals = goals;
        this.sender = sender;
        this.transaction = transaction;
        this.json = json;
        this.clock = clock;
        this.enabled = enabled;
    }

    @Scheduled(cron = "0 * * * * *", zone = "America/Sao_Paulo")
    public void tick() {
        if (enabled) {
            runAt(LocalDateTime.now(clock));
        }
    }

    /** Uma rodada do agendador no instante dado (os testes chamam direto). */
    public void runAt(LocalDateTime now) {
        for (NotificationSettings account : settings.findWithDevices()) {
            try {
                transaction.executeWithoutResult(status -> runFor(account.getUserId(), now));
            } catch (RuntimeException e) {
                // Um usuário com problema não impede os outros
                log.warn("Falha ao processar as notificações de um usuário: {}", e.getClass().getSimpleName());
            }
        }
    }

    private void runFor(Long userId, LocalDateTime now) {
        NotificationSettings account = settings.findById(userId).orElse(null);
        if (account == null) {
            return;
        }
        LocalDate today = now.toLocalDate();
        LocalTime time = now.toLocalTime();
        Week week = null;

        if (inWindow(AT_RISK_TIME, time) && !today.equals(account.getLastAtRiskOn())) {
            account.setLastAtRiskOn(today);
            if (account.isAtRiskEnabled()) {
                week = load(userId, today);
                List<HabitInfo> risky = NotificationRules.atRisk(week);
                if (!risky.isEmpty()) {
                    send(userId, NotificationRules.atRiskMessage(risky, today), now);
                }
            }
        }

        if (inWindow(account.getReminderTime(), time) && !today.equals(account.getLastDailyOn())) {
            account.setLastDailyOn(today);
            if (week == null) {
                week = load(userId, today);
            }
            reminder(account, week).ifPresent(message -> send(userId, message, now));
        }
        settings.save(account);
    }

    /** No horário do lembrete: o resumo de domingo substitui o lembrete (plan P9, P10). */
    private Optional<Message> reminder(NotificationSettings account, Week week) {
        LocalDate today = week.today();
        List<HabitInfo> pending = account.isDailyEnabled() ? NotificationRules.pendingToday(week) : List.of();
        if (today.getDayOfWeek() == DayOfWeek.SUNDAY && account.isSummaryEnabled()) {
            Optional<NotificationRules.Summary> summary = NotificationRules.summary(week);
            if (summary.isPresent()) {
                return Optional.of(NotificationRules.summaryMessage(summary.get(), pending, today));
            }
        }
        if (!pending.isEmpty()) {
            return Optional.of(NotificationRules.dailyMessage(pending, today));
        }
        return Optional.empty();
    }

    private Week load(Long userId, LocalDate today) {
        List<HabitInfo> active = habits.findByUserIdAndArchivedFalseOrderByPositionAscIdAsc(userId).stream()
            .map(habit -> new HabitInfo(habit.getId(), habit.getName()))
            .toList();
        LocalDate monday = Week.monday(today);
        Map<Long, Set<LocalDate>> byHabit = new HashMap<>();
        for (HabitCheck check : checks.findForUser(userId, monday, today)) {
            byHabit.computeIfAbsent(check.getHabitId(), id -> new HashSet<>()).add(check.getDay());
        }
        // Mesma referência da tela: a meta vigente no último dia da semana exibida
        return new Week(today, active, byHabit, goals.goalsAt(userId, monday.plusDays(6)));
    }

    private void send(Long userId, Message message, LocalDateTime now) {
        String payload;
        try {
            payload = json.writeValueAsString(Map.of(
                "title", message.title(), "body", message.body(), "tag", message.tag(), "url", "/"));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
        Duration ttl = timeToLive(now);
        for (PushSubscription subscription : subscriptions.findByUserIdOrderById(userId)) {
            if (sender.send(subscription.target(), payload, ttl) == PushSender.Result.EXPIRED) {
                subscriptions.delete(subscription);
            }
        }
    }

    /** Até a meia-noite de Brasília: nada sobre um dia que já passou chega ao aparelho (plan P7). */
    static Duration timeToLive(LocalDateTime now) {
        Duration untilMidnight = Duration.between(now, now.toLocalDate().plusDays(1).atStartOfDay());
        return untilMidnight.compareTo(Duration.ofSeconds(60)) < 0 ? Duration.ofSeconds(60) : untilMidnight;
    }

    static boolean inWindow(LocalTime start, LocalTime now) {
        long minutes = ChronoUnit.MINUTES.between(start, now);
        return !now.isBefore(start) && minutes < WINDOW_MINUTES;
    }
}
