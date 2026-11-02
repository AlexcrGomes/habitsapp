package br.com.habits.common;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiError> handleApi(ApiException e) {
        return ResponseEntity.status(e.status()).body(e.toError());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> fields = new LinkedHashMap<>();
        for (FieldError error : e.getBindingResult().getFieldErrors()) {
            fields.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        String message = fields.values().stream().findFirst().orElse("Dados inválidos.");
        return ResponseEntity.badRequest().body(new ApiError("VALIDATION", message, fields, null));
    }

    @ExceptionHandler({
        HttpMessageNotReadableException.class,
        MethodArgumentTypeMismatchException.class,
        MissingServletRequestParameterException.class,
    })
    ResponseEntity<ApiError> handleBadRequest(Exception e) {
        return ResponseEntity.badRequest().body(new ApiError("BAD_REQUEST", "Requisição inválida."));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ApiError> handleNoResource(NoResourceFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError("NOT_FOUND", "Não encontrado."));
    }

    /** Corrida entre duas requisições que violam a mesma restrição única (ex.: nome de hábito). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiError> handleConflict(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ApiError("CONFLICT", "Não foi possível salvar: os dados conflitam com outro registro."));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> handleUnexpected(Exception e) {
        // Exceções do Spring MVC já trazem o status certo (405, 415…)
        if (e instanceof ErrorResponse errorResponse && errorResponse.getStatusCode().is4xxClientError()) {
            return ResponseEntity.status(errorResponse.getStatusCode()).body(new ApiError("BAD_REQUEST", "Requisição inválida."));
        }
        log.error("Erro inesperado", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ApiError("INTERNAL", "Erro inesperado. Tente novamente."));
    }
}
