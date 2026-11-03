package br.com.habits.goal;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

import br.com.habits.auth.AuthPrincipal;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    public record GoalResponse(Long habitId, int daysPerWeek) {
    }

    /** Metas vigentes em `at` (o último dia da semana exibida). */
    @GetMapping
    public List<GoalResponse> list(@AuthenticationPrincipal AuthPrincipal principal,
                                   @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate at) {
        return goalService.goalsAt(principal.id(), at).entrySet().stream()
            .map(entry -> new GoalResponse(entry.getKey(), entry.getValue()))
            .sorted(Comparator.comparing(GoalResponse::habitId))
            .toList();
    }
}
