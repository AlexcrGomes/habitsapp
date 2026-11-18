package br.com.habits.notification;

import static java.time.temporal.TemporalAdjusters.previousOrSame;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Regras das notificações (spec 011, plan P9–P11): funções puras sobre a semana atual de
 * segunda a domingo (spec 010), os hábitos ativos, as marcações e as metas vigentes.
 */
public final class NotificationRules {

    private NotificationRules() {
    }

    public record HabitInfo(long id, String name) {
    }

    /**
     * @param today  hoje, no horário de Brasília
     * @param active hábitos não arquivados, na ordem de exibição
     * @param checks marcações da semana atual: habitId → dias marcados
     * @param goals  habitId → meta vigente na semana (só hábitos com meta)
     */
    public record Week(LocalDate today, List<HabitInfo> active, Map<Long, Set<LocalDate>> checks,
                       Map<Long, Integer> goals) {

        public static LocalDate monday(LocalDate day) {
            return day.with(previousOrSame(DayOfWeek.MONDAY));
        }

        LocalDate monday() {
            return monday(today);
        }

        boolean checkedToday(HabitInfo habit) {
            return checks.getOrDefault(habit.id(), Set.of()).contains(today);
        }

        /** Marcações de segunda a domingo da semana de hoje. */
        int done(HabitInfo habit) {
            LocalDate monday = monday();
            LocalDate sunday = monday.plusDays(6);
            return (int) checks.getOrDefault(habit.id(), Set.of()).stream()
                .filter(day -> !day.isBefore(monday) && !day.isAfter(sunday))
                .count();
        }

        /** Dias que restam na semana, contando hoje (segunda = 7, domingo = 1). */
        int daysLeft() {
            return 8 - today.getDayOfWeek().getValue();
        }
    }

    public record Summary(int percent, String label) {
    }

    /** Mensagem mostrada no aparelho. */
    public record Message(String title, String body, String tag) {
    }

    /** Lembrete diário: sem marcação hoje e sem a meta da semana já atingida (RF-007). */
    public static List<HabitInfo> pendingToday(Week week) {
        return week.active().stream()
            .filter(habit -> !week.checkedToday(habit))
            .filter(habit -> {
                Integer goal = week.goals().get(habit.id());
                return goal == null || week.done(habit) < goal;
            })
            .toList();
    }

    /** Meta em risco: sem marcar hoje, a meta da semana deixa de ser possível (RF-008). */
    public static List<HabitInfo> atRisk(Week week) {
        return week.active().stream()
            .filter(habit -> week.goals().containsKey(habit.id()))
            .filter(habit -> !week.checkedToday(habit))
            .filter(habit -> {
                int missing = week.goals().get(habit.id()) - week.done(habit);
                return missing > 0 && missing == week.daysLeft();
            })
            .toList();
    }

    /** Mesmo cálculo do resumo da tela (web/src/goals/progress.ts); vazio sem metas (plan P10). */
    public static Optional<Summary> summary(Week week) {
        int achieved = 0;
        int total = 0;
        for (HabitInfo habit : week.active()) {
            Integer goal = week.goals().get(habit.id());
            if (goal == null) {
                continue;
            }
            achieved += Math.min(week.done(habit), goal);
            total += goal;
        }
        if (total == 0) {
            return Optional.empty();
        }
        int percent = achieved == total ? 100 : Math.min(99, (int) Math.round(100.0 * achieved / total));
        return Optional.of(new Summary(percent, label(percent)));
    }

    static String label(int percent) {
        if (percent >= 100) {
            return "Semana perfeita";
        }
        if (percent >= 70) {
            return "Boa semana";
        }
        if (percent >= 40) {
            return "Dá para melhorar";
        }
        return "Semana fraca";
    }

    public static Message dailyMessage(List<HabitInfo> pending, LocalDate today) {
        return new Message("Hora de marcar seus hábitos", missing(pending) + ": " + names(pending) + ".",
            "lembrete-" + today);
    }

    public static Message atRiskMessage(List<HabitInfo> habits, LocalDate today) {
        return new Message("Meta em risco", "Faça hoje para não perder a meta: " + names(habits) + ".",
            "meta-" + today);
    }

    /** Resumo de domingo; com o lembrete ligado e algo pendente, também lembra o que falta. */
    public static Message summaryMessage(Summary summary, List<HabitInfo> pending, LocalDate today) {
        String body = summary.percent() + "% · " + summary.label() + ".";
        if (!pending.isEmpty()) {
            body += " " + missing(pending) + ".";
        }
        return new Message("Resumo da semana", body, "lembrete-" + today);
    }

    private static String missing(List<HabitInfo> pending) {
        return pending.size() == 1
            ? "Falta 1 hábito para marcar hoje"
            : "Faltam " + pending.size() + " hábitos para marcar hoje";
    }

    /** "Ler", "Ler e Correr", "Ler, Correr e Nadar", "Ler, Correr, Nadar e mais 2". */
    static String names(List<HabitInfo> habits) {
        List<String> names = habits.stream().map(HabitInfo::name).toList();
        if (names.size() > 3) {
            return String.join(", ", names.subList(0, 3)) + " e mais " + (names.size() - 3);
        }
        if (names.size() == 1) {
            return names.get(0);
        }
        return String.join(", ", names.subList(0, names.size() - 1)) + " e " + names.get(names.size() - 1);
    }
}
