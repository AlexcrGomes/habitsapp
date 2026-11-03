package br.com.habits.habit;

import java.text.BreakIterator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import br.com.habits.common.ApiException;
import br.com.habits.goal.GoalService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Regras da spec 002, antes em script.js, agora aplicadas pelo servidor. */
@Service
public class HabitService {

    public static final int MAX_ACTIVE = 10;
    public static final int MAX_NAME = 30;
    private static final int MAX_EMOJI = 32;

    private final HabitRepository habits;
    private final GoalService goals;

    public HabitService(HabitRepository habits, GoalService goals) {
        this.habits = habits;
        this.goals = goals;
    }

    @Transactional(readOnly = true)
    public List<Habit> list(Long userId) {
        return habits.findByUserIdOrderByArchivedAscPositionAscIdAsc(userId);
    }

    @Transactional
    public Habit create(Long userId, String name, String emoji, Integer goal) {
        String validName = validateName(userId, name, null);
        GoalService.validate(goal);
        if (habits.countByUserIdAndArchivedFalse(userId) >= MAX_ACTIVE) {
            throw limitReached();
        }
        Habit habit = habits.save(new Habit(userId, validName, firstGrapheme(emoji), habits.maxActivePosition(userId) + 1));
        goals.set(habit.getId(), goal);
        return habit;
    }

    /** Substitui nome, emoji e meta (spec 006: a meta nova vale a partir de hoje). */
    @Transactional
    public Habit update(Long userId, Long id, String name, String emoji, Integer goal) {
        Habit habit = find(userId, id);
        habit.setName(validateName(userId, name, id));
        habit.setEmoji(firstGrapheme(emoji));
        goals.set(habit.getId(), GoalService.validate(goal));
        return habit;
    }

    @Transactional
    public Habit archive(Long userId, Long id) {
        Habit habit = find(userId, id);
        habit.setArchived(true);
        return habit;
    }

    /** Volta para o fim da lista de ativos, respeitando o limite. */
    @Transactional
    public Habit restore(Long userId, Long id) {
        Habit habit = find(userId, id);
        if (!habit.isArchived()) {
            return habit;
        }
        if (habits.countByUserIdAndArchivedFalse(userId) >= MAX_ACTIVE) {
            throw limitReached();
        }
        habit.setPosition(habits.maxActivePosition(userId) + 1);
        habit.setArchived(false);
        return habit;
    }

    /** Só hábitos arquivados podem ser excluídos; as marcações saem junto (on delete cascade). */
    @Transactional
    public void delete(Long userId, Long id) {
        Habit habit = find(userId, id);
        if (!habit.isArchived()) {
            throw new ApiException(HttpStatus.CONFLICT, "NOT_ARCHIVED", "Arquive o hábito antes de excluí-lo.");
        }
        habits.delete(habit);
    }

    /** ids deve conter exatamente todos os hábitos ativos do usuário, na nova ordem. */
    @Transactional
    public List<Habit> reorder(Long userId, List<Long> ids) {
        List<Habit> active = habits.findByUserIdAndArchivedFalseOrderByPositionAscIdAsc(userId);
        Map<Long, Habit> byId = new HashMap<>();
        active.forEach(habit -> byId.put(habit.getId(), habit));

        for (Long id : ids) {
            if (!byId.containsKey(id)) {
                // Hábito de outro usuário, arquivado ou inexistente
                throw ApiException.notFound();
            }
        }
        if (ids.size() != active.size() || new HashSet<>(ids).size() != ids.size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ORDER", "A nova ordem deve conter todos os hábitos ativos.");
        }

        for (int i = 0; i < ids.size(); i++) {
            byId.get(ids.get(i)).setPosition(i);
        }
        return list(userId);
    }

    Habit find(Long userId, Long id) {
        return habits.findByIdAndUserId(id, userId).orElseThrow(ApiException::notFound);
    }

    private String validateName(Long userId, String name, Long ignoreId) {
        String trimmed = name == null ? "" : name.trim();
        if (trimmed.isEmpty()) {
            throw ApiException.validation("name", "Informe o nome do hábito.");
        }
        if (trimmed.length() > MAX_NAME) {
            throw ApiException.validation("name", "O nome pode ter no máximo " + MAX_NAME + " caracteres.");
        }

        habits.findByUserIdAndName(userId, trimmed)
            .filter(existing -> !existing.getId().equals(ignoreId))
            .ifPresent(existing -> {
                if (!existing.isArchived()) {
                    throw new ApiException(HttpStatus.CONFLICT, "DUPLICATE_NAME", "Já existe um hábito com esse nome.");
                }
                throw new ApiException(HttpStatus.CONFLICT, "ARCHIVED_DUPLICATE",
                    "Há um hábito arquivado com esse nome.", Map.of("name", "Há um hábito arquivado com esse nome."),
                    existing.getId());
            });

        return trimmed;
    }

    /** Primeiro símbolo visível, preservando emojis compostos (ex.: 👩‍💻). */
    static String firstGrapheme(String text) {
        String trimmed = text == null ? "" : text.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        BreakIterator iterator = BreakIterator.getCharacterInstance();
        iterator.setText(trimmed);
        String grapheme = trimmed.substring(0, iterator.next());
        if (grapheme.length() > MAX_EMOJI) {
            throw ApiException.validation("emoji", "Emoji inválido.");
        }
        return grapheme;
    }

    private static ApiException limitReached() {
        return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "LIMIT_REACHED",
            "Limite de " + MAX_ACTIVE + " hábitos ativos atingido. Arquive um hábito para liberar espaço.");
    }
}
