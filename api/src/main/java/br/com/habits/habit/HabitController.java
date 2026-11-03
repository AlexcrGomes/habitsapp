package br.com.habits.habit;

import java.util.List;
import java.util.Map;

import br.com.habits.auth.AuthPrincipal;
import br.com.habits.goal.GoalService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/habits")
public class HabitController {

    private final HabitService habitService;
    private final GoalService goalService;

    public HabitController(HabitService habitService, GoalService goalService) {
        this.habitService = habitService;
        this.goalService = goalService;
    }

    /** Validados no serviço, para devolver os códigos de erro das specs 002 e 006. goal nulo = sem meta. */
    public record HabitRequest(String name, String emoji, Integer goal) {
    }

    public record OrderRequest(@NotNull(message = "Informe a ordem dos hábitos.") List<Long> ids) {
    }

    /** goal = meta vigente hoje, ou nulo. */
    public record HabitResponse(Long id, String name, String emoji, boolean archived, Integer goal) {

        static HabitResponse of(Habit habit, Integer goal) {
            return new HabitResponse(habit.getId(), habit.getName(), habit.getEmoji(), habit.isArchived(), goal);
        }
    }

    @GetMapping
    public List<HabitResponse> list(@AuthenticationPrincipal AuthPrincipal principal) {
        return withGoals(principal.id(), habitService.list(principal.id()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HabitResponse create(@AuthenticationPrincipal AuthPrincipal principal, @RequestBody HabitRequest body) {
        return HabitResponse.of(habitService.create(principal.id(), body.name(), body.emoji(), body.goal()), body.goal());
    }

    @PatchMapping("/{id}")
    public HabitResponse update(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable Long id,
                                @RequestBody HabitRequest body) {
        return HabitResponse.of(habitService.update(principal.id(), id, body.name(), body.emoji(), body.goal()), body.goal());
    }

    @PostMapping("/{id}/archive")
    public HabitResponse archive(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable Long id) {
        Habit habit = habitService.archive(principal.id(), id);
        return HabitResponse.of(habit, goalService.current(habit.getId()));
    }

    @PostMapping("/{id}/restore")
    public HabitResponse restore(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable Long id) {
        Habit habit = habitService.restore(principal.id(), id);
        return HabitResponse.of(habit, goalService.current(habit.getId()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable Long id) {
        habitService.delete(principal.id(), id);
    }

    @PutMapping("/order")
    public List<HabitResponse> reorder(@AuthenticationPrincipal AuthPrincipal principal,
                                       @Valid @RequestBody OrderRequest body) {
        return withGoals(principal.id(), habitService.reorder(principal.id(), body.ids()));
    }

    private List<HabitResponse> withGoals(Long userId, List<Habit> habits) {
        Map<Long, Integer> goals = goalService.currentGoals(userId);
        return habits.stream().map(habit -> HabitResponse.of(habit, goals.get(habit.getId()))).toList();
    }
}
