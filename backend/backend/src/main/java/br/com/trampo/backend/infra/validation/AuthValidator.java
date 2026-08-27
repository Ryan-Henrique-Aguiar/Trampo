package br.com.trampo.backend.infra.validation;

import br.com.trampo.backend.dto.AuthenticationDto;
import br.com.trampo.backend.dto.RegisterDto;
import br.com.trampo.backend.infra.exception.InvalidRequestException;

import java.util.regex.Pattern;

public final class AuthValidator {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private AuthValidator() {
    }

    public static void validateLogin(AuthenticationDto data) {
        if (data == null) {
            throw new InvalidRequestException("Dados de login são obrigatórios");
        }

        validateEmail(data.email());

        if (isBlank(data.password())) {
            throw new InvalidRequestException("Senha é obrigatória");
        }
    }

    public static void validateRegister(RegisterDto data) {
        if (data == null) {
            throw new InvalidRequestException("Dados de cadastro são obrigatórios");
        }

        validateEmail(data.email());

        if (isBlank(data.password())) {
            throw new InvalidRequestException("Senha é obrigatória");
        }

        if (data.password().length() < 6) {
            throw new InvalidRequestException(
                    "A senha deve possuir pelo menos 6 caracteres"
            );
        }

        if (isBlank(data.name())) {
            throw new InvalidRequestException("Nome é obrigatório");
        }

        if (isBlank(data.phone())) {
            throw new InvalidRequestException("Telefone é obrigatório");
        }

        if (isBlank(data.cpf())) {
            throw new InvalidRequestException("CPF é obrigatório");
        }

        if (isBlank(data.city())) {
            throw new InvalidRequestException("Cidade é obrigatória");
        }

        if (isBlank(data.state()) || !data.state().matches("[A-Z]{2}")) {
            throw new InvalidRequestException("Estado inválido");
        }

        if (data.categoryIds() == null) {
            throw new InvalidRequestException("Categorias são obrigatórias");
        }
    }

    private static void validateEmail(String email) {
        if (isBlank(email)) {
            throw new InvalidRequestException("Email é obrigatório");
        }

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new InvalidRequestException("Email inválido");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
