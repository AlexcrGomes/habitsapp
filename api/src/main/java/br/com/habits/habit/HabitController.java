package br.com.habits.habit;

import java.util.List;

import br.com.habits.auth.AuthPrincipal;

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

    public HabitController(HabitService habitService) {
        this.habitService = habitService;
    }

    /** Nome e emoji são validados no serviço, para devolver os códigos de erro da spec 002. */
    public record HabitRequest(String name, String emoji) {
    }

    public record OrderRequest(@NotNull(message = "Informe a ordem dos hábitos.") List<Long> ids) {
    }

    public record HabitResponse(Long id, String name, String emoji, boolean archived) {

        static HabitResponse of(Habit habit) {
            return new HabitResponse(habit.getId(), habit.getName(), habit.getEmoji(), habit.isArchived());
        }
    }

    @GetMapping
    public List<HabitResponse> list(@AuthenticationPrincipal AuthPrincipal principal) {
        return habitService.list(principal.id()).stream().map(HabitResponse::of).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HabitResponse create(@AuthenticationPrincipal AuthPrincipal principal, @RequestBody HabitRequest body) {
        return HabitResponse.of(habitService.create(principal.id(), body.name(), body.emoji()));
    }

    @PatchMapping("/{id}")
    public HabitResponse update(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable Long id,
                                @RequestBody HabitRequest body) {
        return HabitResponse.of(habitService.update(principal.id(), id, body.name(), body.emoji()));
    }

    @PostMapping("/{id}/archive")
    public HabitResponse archive(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable Long id) {
        return HabitResponse.of(habitService.archive(principal.id(), id));
    }

    @PostMapping("/{id}/restore")
    public HabitResponse restore(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable Long id) {
        return HabitResponse.of(habitService.restore(principal.id(), id));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable Long id) {
        habitService.delete(principal.id(), id);
    }

    @PutMapping("/order")
    public List<HabitResponse> reorder(@AuthenticationPrincipal AuthPrincipal principal,
                                       @Valid @RequestBody OrderRequest body) {
        return habitService.reorder(principal.id(), body.ids()).stream().map(HabitResponse::of).toList();
    }
}
