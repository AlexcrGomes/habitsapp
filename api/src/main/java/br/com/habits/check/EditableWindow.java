package br.com.habits.check;

import static java.time.temporal.TemporalAdjusters.previousOrSame;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;

import org.springframework.stereotype.Component;

/**
 * Dias que podem ser marcados: da segunda-feira da semana anterior até hoje, no horário de
 * Brasília (spec 010, revisão 3; substitui "hoje e os 6 anteriores" da spec 004).
 */
@Component
public class EditableWindow {

    private final Clock clock;

    public EditableWindow(Clock clock) {
        this.clock = clock;
    }

    public LocalDate today() {
        return LocalDate.now(clock);
    }

    /** Primeiro dia editável: a segunda-feira da semana anterior à de hoje. */
    public LocalDate firstDay() {
        return today().with(previousOrSame(DayOfWeek.MONDAY)).minusWeeks(1);
    }

    public boolean contains(LocalDate day) {
        return !day.isAfter(today()) && !day.isBefore(firstDay());
    }
}
