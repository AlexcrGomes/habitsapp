package br.com.habits.goal;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GoalRepository extends JpaRepository<HabitGoal, HabitGoal.Key> {

    interface GoalInEffect {

        Long getHabitId();

        Integer getDaysPerWeek();
    }

    /** Meta vigente em cada hábito do usuário na data (a linha mais recente até ela; Princípio III). */
    @Query(value = """
        select distinct on (g.habit_id) g.habit_id as habitId, g.days_per_week as daysPerWeek
        from habit_goals g
        join habits h on h.id = g.habit_id
        where h.user_id = :userId and g.valid_from <= :at
        order by g.habit_id, g.valid_from desc
        """, nativeQuery = true)
    List<GoalInEffect> findInEffect(@Param("userId") Long userId, @Param("at") LocalDate at);

    /** Uso interno: o chamador já conferiu que o hábito é do usuário. */
    Optional<HabitGoal> findFirstByHabitIdAndValidFromLessThanEqualOrderByValidFromDesc(Long habitId, LocalDate at);
}
