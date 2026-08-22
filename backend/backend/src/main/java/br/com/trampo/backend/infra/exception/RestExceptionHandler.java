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
    private ResponseEntity<RestErrorMessage> emailAlreadyExistsHandler(EmailAlreadyExistsException exception) {
        RestErrorMessage restErrorMessage = new RestErrorMessage(HttpStatus.CONFLICT, "Email já cadastrado!");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(restErrorMessage);
    }

    @ExceptionHandler(CategoryNotFoundException.class)
    private ResponseEntity<RestErrorMessage> categoryNotFoundHandler(CategoryNotFoundException exception) {
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
    private ResponseEntity<RestErrorMessage> invalidCpfHandler(
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
    private ResponseEntity<RestErrorMessage> invalidPhoneHandler(
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
    private ResponseEntity<RestErrorMessage> cpfAlreadyExistsHandler(
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
    private ResponseEntity<RestErrorMessage> phoneAlreadyExistsHandler(
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
    private ResponseEntity<RestErrorMessage> badCredentialsHandler(
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
}
