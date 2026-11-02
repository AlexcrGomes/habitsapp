package br.com.habits.common;

import java.util.Map;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final Map<String, String> fields;
    private final Long habitId;

    public ApiException(HttpStatus status, String code, String message) {
        this(status, code, message, null, null);
    }

    public ApiException(HttpStatus status, String code, String message, Map<String, String> fields, Long habitId) {
        super(message);
        this.status = status;
        this.code = code;
        this.fields = fields;
        this.habitId = habitId;
    }

    /** Recurso inexistente ou de outro usuário: as duas situações respondem igual (Princípio III). */
    public static ApiException notFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Não encontrado.");
    }

    public static ApiException validation(String field, String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", message, Map.of(field, message), null);
    }

    public HttpStatus status() {
        return status;
    }

    public ApiError toError() {
        return new ApiError(code, getMessage(), fields, habitId);
    }
}
