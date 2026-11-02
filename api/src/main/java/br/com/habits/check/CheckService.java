package br.com.habits.check;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import br.com.habits.common.ApiException;
import br.com.habits.habit.Habit;
import br.com.habits.habit.HabitRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CheckService {

    private static final int MAX_RANGE_DAYS = 366;

    private final CheckRepository checks;
    private final HabitRepository habits;
    private final EditableWindow window;

    public CheckService(CheckRepository checks, HabitRepository habits, EditableWindow window) {
        this.checks = checks;
        this.habits = habits;
        this.window = window;
    }

    @Transactional(readOnly = true)
    public List<HabitCheck> list(Long userId, LocalDate from, LocalDate to) {
        if (to.isBefore(from) || ChronoUnit.DAYS.between(from, to) > MAX_RANGE_DAYS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_RANGE", "Período inválido.");
        }
        return checks.findForUser(userId, from, to);
    }

    /** Idempotente: marcar um dia já marcado não muda nada. */
    @Transactional
    public void mark(Long userId, Long habitId, LocalDate day) {
        requireEditable(userId, habitId, day);
        HabitCheck.Key key = new HabitCheck.Key(habitId, day);
        if (!checks.existsById(key)) {
            checks.save(new HabitCheck(habitId, day));
        }
    }

    @Transactional
    public void unmark(Long userId, Long habitId, LocalDate day) {
        requireEditable(userId, habitId, day);
        checks.deleteById(new HabitCheck.Key(habitId, day));
    }

    private void requireEditable(Long userId, Long habitId, LocalDate day) {
        Habit habit = habits.findByIdAndUserId(habitId, userId).orElseThrow(ApiException::notFound);
        if (habit.isArchived()) {
            throw new ApiException(HttpStatus.CONFLICT, "HABIT_ARCHIVED", "Hábitos arquivados não podem ser marcados.");
        }
        if (!window.contains(day)) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "NOT_EDITABLE",
                "Só é possível marcar hoje e os 6 dias anteriores.");
        }
    }
}
