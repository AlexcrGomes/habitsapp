package br.com.habits.goal;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/** Meta semanal do hábito a partir de uma data; daysPerWeek nulo = sem meta (spec 006). */
@Entity
@Table(name = "habit_goals")
@IdClass(HabitGoal.Key.class)
public class HabitGoal {

    @Id
    @Column(name = "habit_id")
    private Long habitId;

    @Id
    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "days_per_week")
    private Integer daysPerWeek;

    protected HabitGoal() {
    }

    public HabitGoal(Long habitId, LocalDate validFrom, Integer daysPerWeek) {
        this.habitId = habitId;
        this.validFrom = validFrom;
        this.daysPerWeek = daysPerWeek;
    }

    public Long getHabitId() {
        return habitId;
    }

    public LocalDate getValidFrom() {
        return validFrom;
    }

    public Integer getDaysPerWeek() {
        return daysPerWeek;
    }

    public static class Key implements Serializable {

        private Long habitId;
        private LocalDate validFrom;

        protected Key() {
        }

        public Key(Long habitId, LocalDate validFrom) {
            this.habitId = habitId;
            this.validFrom = validFrom;
        }

        @Override
        public boolean equals(Object other) {
            return other instanceof Key key && Objects.equals(habitId, key.habitId) && Objects.equals(validFrom, key.validFrom);
        }

        @Override
        public int hashCode() {
            return Objects.hash(habitId, validFrom);
        }
    }
}
