package br.com.trampo.backend.infra.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.LocalDateTime;
import java.util.Map;

@ControllerAdvice
public class RestExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<RestErrorMessage> emailAlreadyExistsHandler(EmailAlreadyExistsException exception) {
        RestErrorMessage restErrorMessage = new RestErrorMessage(HttpStatus.CONFLICT, "Email já cadastrado!");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(restErrorMessage);
    }

    @ExceptionHandler(CategoryNotFoundException.class)
    public ResponseEntity<RestErrorMessage> categoryNotFoundHandler(CategoryNotFoundException exception) {
        RestErrorMessage threatResponse = new RestErrorMessage(HttpStatus.NOT_FOUND, "Categoria não encontrada");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(threatResponse);
    }

    @ExceptionHandler(InvalidCategoryException.class)
    public ResponseEntity<Object> handleCategoryExceptions(RuntimeException exception) {
        Map<String, Object> body = Map.of(
                "timestamp", LocalDateTime.now(),
                "status", HttpStatus.BAD_REQUEST.value(),
                "error", "Regra de negócio violada",
                "message", exception.getMessage()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(InvalidCpfException.class)
    public ResponseEntity<RestErrorMessage> invalidCpfHandler(
            InvalidCpfException exception
    ) {
        RestErrorMessage error = new RestErrorMessage(
                HttpStatus.BAD_REQUEST,
                exception.getMessage()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(error);
    }

    @ExceptionHandler(InvalidPhoneException.class)
    public ResponseEntity<RestErrorMessage> invalidPhoneHandler(
            InvalidPhoneException exception
    ) {
        RestErrorMessage error = new RestErrorMessage(
                HttpStatus.BAD_REQUEST,
                exception.getMessage()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(error);
    }

    @ExceptionHandler(CpfAlreadyExistsException.class)
    public ResponseEntity<RestErrorMessage> cpfAlreadyExistsHandler(
            CpfAlreadyExistsException exception
    ) {
        RestErrorMessage error = new RestErrorMessage(
                HttpStatus.CONFLICT,
                exception.getMessage()
        );

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(error);
    }

    @ExceptionHandler(PhoneAlreadyExistsException.class)
    public ResponseEntity<RestErrorMessage> phoneAlreadyExistsHandler(
            PhoneAlreadyExistsException exception
    ) {
        RestErrorMessage error = new RestErrorMessage(
                HttpStatus.CONFLICT,
                exception.getMessage()
        );

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(error);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<RestErrorMessage> badCredentialsHandler(
            BadCredentialsException exception
    ) {
        RestErrorMessage error = new RestErrorMessage(
                HttpStatus.UNAUTHORIZED,
                "Email ou senha inválidos"
        );

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(error);
    }

    @ExceptionHandler(UnauthorizedUserException.class)
    public ResponseEntity<RestErrorMessage> unauthorizedUserHandler(UnauthorizedUserException exception) {
        RestErrorMessage error = new RestErrorMessage(
                HttpStatus.UNAUTHORIZED,
                exception.getMessage()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(DatabaseException.class)
    public ResponseEntity<RestErrorMessage> databaseHandler(DatabaseException exception) {
        // Retorna 500 sem expor detalhes internos do SQL para a API
        RestErrorMessage error = new RestErrorMessage(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Erro de persistência no servidor. Tente novamente mais tarde."
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    // Fallback global para qualquer outra exceção não tratada
    @ExceptionHandler(Exception.class)
    public ResponseEntity<RestErrorMessage> genericHandler(Exception exception) {
        RestErrorMessage error = new RestErrorMessage(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocorreu um erro interno no servidor."
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
