package br.com.habits.habit;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Toda consulta recebe o userId: não existe busca de hábito sem o dono (Princípio III). */
public interface HabitRepository extends JpaRepository<Habit, Long> {

    Optional<Habit> findByIdAndUserId(Long id, Long userId);

    /** Ativos na ordem de exibição, depois os arquivados. */
    List<Habit> findByUserIdOrderByArchivedAscPositionAscIdAsc(Long userId);

    List<Habit> findByUserIdAndArchivedFalseOrderByPositionAscIdAsc(Long userId);

    long countByUserIdAndArchivedFalse(Long userId);

    @Query("select h from Habit h where h.userId = :userId and lower(h.name) = lower(:name)")
    Optional<Habit> findByUserIdAndName(@Param("userId") Long userId, @Param("name") String name);

    @Query("select coalesce(max(h.position), -1) from Habit h where h.userId = :userId and h.archived = false")
    int maxActivePosition(@Param("userId") Long userId);
}
