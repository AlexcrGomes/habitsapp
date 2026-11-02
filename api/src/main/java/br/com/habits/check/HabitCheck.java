package br.com.habits.check;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/** Marcação: o hábito foi cumprido no dia. */
@Entity
@Table(name = "checks")
@IdClass(HabitCheck.Key.class)
public class HabitCheck {

    @Id
    @Column(name = "habit_id")
    private Long habitId;

    @Id
    private LocalDate day;

    protected HabitCheck() {
    }

    public HabitCheck(Long habitId, LocalDate day) {
        this.habitId = habitId;
        this.day = day;
    }

    public Long getHabitId() {
        return habitId;
    }

    public LocalDate getDay() {
        return day;
    }

    public static class Key implements Serializable {

        private Long habitId;
        private LocalDate day;

        protected Key() {
        }

        public Key(Long habitId, LocalDate day) {
            this.habitId = habitId;
            this.day = day;
        }

        @Override
        public boolean equals(Object other) {
            return other instanceof Key key && Objects.equals(habitId, key.habitId) && Objects.equals(day, key.day);
        }

        @Override
        public int hashCode() {
            return Objects.hash(habitId, day);
        }
    }
}
