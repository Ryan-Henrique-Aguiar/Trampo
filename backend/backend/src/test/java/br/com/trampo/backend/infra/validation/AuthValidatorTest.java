package br.com.trampo.backend.infra.validation;

import br.com.trampo.backend.dto.AuthenticationDto;
import br.com.trampo.backend.dto.RegisterDto;
import br.com.trampo.backend.infra.exception.InvalidRequestException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AuthValidatorTest {

    @Test
    void shouldAcceptValidLogin() {
        AuthenticationDto login = new AuthenticationDto("maria@email.com", "123456");

        assertDoesNotThrow(() -> AuthValidator.validateLogin(login));
    }

    @Test
    void shouldRejectLoginWithInvalidEmail() {
        AuthenticationDto login = new AuthenticationDto("email-invalido", "123456");

        InvalidRequestException exception = assertThrows(
                InvalidRequestException.class,
                () -> AuthValidator.validateLogin(login)
        );

        assertEquals("Email inválido", exception.getMessage());
    }

    @Test
    void shouldAcceptValidRegistration() {
        RegisterDto cadastro = cadastroValido("123456");

        assertDoesNotThrow(() -> AuthValidator.validateRegister(cadastro));
    }

    @Test
    void shouldRejectRegistrationWithShortPassword() {
        RegisterDto cadastro = cadastroValido("12345");

        InvalidRequestException exception = assertThrows(
                InvalidRequestException.class,
                () -> AuthValidator.validateRegister(cadastro)
        );

        assertEquals("A senha deve possuir pelo menos 6 caracteres", exception.getMessage());
    }

    private RegisterDto cadastroValido(String senha) {
        return new RegisterDto(
                "maria@email.com",
                senha,
                "Maria Oliveira",
                "35999999999",
                "52998224725",
                "Pouso Alegre",
                "MG",
                false,
                List.of()
        );
    }
}
