package br.com.habits.check;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;

import br.com.habits.config.ClockConfig;

import org.junit.jupiter.api.Test;

/** Spec 010, revisão 3: semana anterior inteira e semana atual até hoje (segunda a domingo). */
class EditableWindowTest {

    private static EditableWindow at(String instant) {
        return new EditableWindow(Clock.fixed(Instant.parse(instant), ClockConfig.ZONE));
    }

    @Test
    void numSabadoVaiDaSegundaDaSemanaAnteriorAteHoje() {
        EditableWindow window = at("2026-10-31T15:00:00Z"); // sábado; semana de 26/10

        assertThat(window.firstDay()).isEqualTo(LocalDate.of(2026, 10, 19));
        assertThat(window.contains(LocalDate.of(2026, 10, 31))).isTrue();
        assertThat(window.contains(LocalDate.of(2026, 10, 19))).isTrue();
        assertThat(window.contains(LocalDate.of(2026, 10, 18))).isFalse();
        assertThat(window.contains(LocalDate.of(2026, 11, 1))).as("futuro").isFalse();
    }

    @Test
    void numDomingoAJanelaTemQuatorzeDias() {
        EditableWindow window = at("2026-11-01T15:00:00Z");

        assertThat(window.contains(LocalDate.of(2026, 11, 1))).isTrue();
        assertThat(window.contains(LocalDate.of(2026, 10, 19))).isTrue();
        assertThat(window.contains(LocalDate.of(2026, 10, 18))).isFalse();
    }

    @Test
    void numaSegundaASemanaAnteriorInteiraContinuaEditavel() {
        EditableWindow window = at("2026-11-02T15:00:00Z");

        assertThat(window.firstDay()).isEqualTo(LocalDate.of(2026, 10, 26));
        assertThat(window.contains(LocalDate.of(2026, 11, 2))).isTrue();
        assertThat(window.contains(LocalDate.of(2026, 10, 26))).isTrue();
        assertThat(window.contains(LocalDate.of(2026, 10, 25))).isFalse();
        assertThat(window.contains(LocalDate.of(2026, 11, 3))).isFalse();
    }

    @Test
    void hojeSegueOHorarioDeBrasilia() {
        // 02:00 UTC de 02/11 (segunda) ainda é 23:00 de domingo, 01/11, em Brasília
        EditableWindow window = at("2026-11-02T02:00:00Z");

        assertThat(window.today()).isEqualTo(LocalDate.of(2026, 11, 1));
        assertThat(window.firstDay()).isEqualTo(LocalDate.of(2026, 10, 19));
        assertThat(window.contains(LocalDate.of(2026, 11, 2))).isFalse();
    }

    @Test
    void atravessaAViradaDoAno() {
        EditableWindow window = at("2027-01-02T12:00:00Z"); // sábado; semana de 28/12

        assertThat(window.contains(LocalDate.of(2026, 12, 21))).isTrue();
        assertThat(window.contains(LocalDate.of(2026, 12, 20))).isFalse();
    }
}
