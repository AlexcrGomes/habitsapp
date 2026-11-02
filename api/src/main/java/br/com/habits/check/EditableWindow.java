package br.com.habits.check;

import java.time.Clock;
import java.time.LocalDate;

import org.springframework.stereotype.Component;

/** Dias que podem ser marcados: hoje e os 6 anteriores, no horário de Brasília (spec 004). */
@Component
public class EditableWindow {

    public static final int DAYS = 7;

    private final Clock clock;

    public EditableWindow(Clock clock) {
        this.clock = clock;
    }

    public LocalDate today() {
        return LocalDate.now(clock);
    }

    public boolean contains(LocalDate day) {
        LocalDate today = today();
        return !day.isAfter(today) && !day.isBefore(today.minusDays(DAYS - 1));
    }
}
