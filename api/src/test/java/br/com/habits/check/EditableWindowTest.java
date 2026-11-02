package br.com.habits.check;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;

import br.com.habits.config.ClockConfig;

import org.junit.jupiter.api.Test;

class EditableWindowTest {

    private static EditableWindow at(String instant) {
        return new EditableWindow(Clock.fixed(Instant.parse(instant), ClockConfig.ZONE));
    }

    @Test
    void hojeEOsSeisDiasAnteriores() {
        EditableWindow window = at("2026-10-31T15:00:00Z");

        assertThat(window.contains(LocalDate.of(2026, 10, 31))).isTrue();
        assertThat(window.contains(LocalDate.of(2026, 10, 25))).isTrue();
        assertThat(window.contains(LocalDate.of(2026, 10, 24))).isFalse();
        assertThat(window.contains(LocalDate.of(2026, 11, 1))).isFalse();
    }

    @Test
    void hojeSegueOHorarioDeBrasilia() {
        // 02:00 UTC de 01/11 ainda é 23:00 de 31/10 em Brasília
        EditableWindow window = at("2026-11-01T02:00:00Z");

        assertThat(window.today()).isEqualTo(LocalDate.of(2026, 10, 31));
        assertThat(window.contains(LocalDate.of(2026, 11, 1))).isFalse();
    }

    @Test
    void atravessaAViradaDoAno() {
        EditableWindow window = at("2027-01-02T12:00:00Z");

        assertThat(window.contains(LocalDate.of(2026, 12, 27))).isTrue();
        assertThat(window.contains(LocalDate.of(2026, 12, 26))).isFalse();
    }
}
