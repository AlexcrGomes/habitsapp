package br.com.habits.goal;

import java.time.Clock;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import br.com.habits.common.ApiException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Metas semanais (spec 006). Mudanças valem a partir de hoje; o passado guarda a meta da época. */
@Service
public class GoalService {

    public static final int MIN = 1;
    public static final int MAX = 7;

    private final GoalRepository goals;
    private final Clock clock;

    public GoalService(GoalRepository goals, Clock clock) {
        this.goals = goals;
        this.clock = clock;
    }

    /** Meta válida: nula (sem meta) ou de 1 a 7 dias por semana. */
    public static Integer validate(Integer goal) {
        if (goal != null && (goal < MIN || goal > MAX)) {
            throw ApiException.validation("goal", "A meta deve ser de " + MIN + " a " + MAX + " dias por semana.");
        }
        return goal;
    }

    /** Grava a meta a partir de hoje; no mesmo dia, a última escolha sobrescreve a anterior. */
    @Transactional
    public void set(Long habitId, Integer goal) {
        LocalDate today = LocalDate.now(clock);
        if (Objects.equals(current(habitId), validate(goal))) {
            return;
        }
        goals.save(new HabitGoal(habitId, today, goal));
    }

    @Transactional(readOnly = true)
    public Integer current(Long habitId) {
        return goals.findFirstByHabitIdAndValidFromLessThanEqualOrderByValidFromDesc(habitId, LocalDate.now(clock))
            .map(HabitGoal::getDaysPerWeek)
            .orElse(null);
    }

    /** habitId → meta vigente na data; hábitos sem meta ficam de fora. */
    @Transactional(readOnly = true)
    public Map<Long, Integer> goalsAt(Long userId, LocalDate at) {
        Map<Long, Integer> result = new HashMap<>();
        for (GoalRepository.GoalInEffect goal : goals.findInEffect(userId, at)) {
            if (goal.getDaysPerWeek() != null) {
                result.put(goal.getHabitId(), goal.getDaysPerWeek());
            }
        }
        return result;
    }

    public Map<Long, Integer> currentGoals(Long userId) {
        return goalsAt(userId, LocalDate.now(clock));
    }
}
