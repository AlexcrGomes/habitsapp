package br.com.habits.check;

import java.time.LocalDate;
import java.util.List;

import br.com.habits.auth.AuthPrincipal;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checks")
public class CheckController {

    private final CheckService checkService;

    public CheckController(CheckService checkService) {
        this.checkService = checkService;
    }

    public record CheckResponse(Long habitId, LocalDate day) {
    }

    @GetMapping
    public List<CheckResponse> list(@AuthenticationPrincipal AuthPrincipal principal,
                                    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return checkService.list(principal.id(), from, to).stream()
            .map(check -> new CheckResponse(check.getHabitId(), check.getDay()))
            .toList();
    }

    @PutMapping("/{habitId}/{day}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void mark(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable Long habitId,
                     @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day) {
        checkService.mark(principal.id(), habitId, day);
    }

    @DeleteMapping("/{habitId}/{day}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unmark(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable Long habitId,
                       @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day) {
        checkService.unmark(principal.id(), habitId, day);
    }
}
