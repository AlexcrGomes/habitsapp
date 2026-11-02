package br.com.habits.common;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Corpo de erro da API: código estável para o frontend e mensagem em pt-BR para o usuário. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(String code, String message, Map<String, String> fields, Long habitId) {

    public ApiError(String code, String message) {
        this(code, message, null, null);
    }
}
