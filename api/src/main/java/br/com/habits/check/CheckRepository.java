package br.com.habits.check;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CheckRepository extends JpaRepository<HabitCheck, HabitCheck.Key> {

    /** Só marcações de hábitos do usuário (Princípio III). */
    @Query("""
        select c from HabitCheck c
        where c.habitId in (select h.id from Habit h where h.userId = :userId)
          and c.day between :from and :to
        order by c.day, c.habitId
        """)
    List<HabitCheck> findForUser(@Param("userId") Long userId, @Param("from") LocalDate from, @Param("to") LocalDate to);
}
