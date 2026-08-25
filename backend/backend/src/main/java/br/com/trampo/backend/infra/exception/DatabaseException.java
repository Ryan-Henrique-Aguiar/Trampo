package br.com.trampo.backend.infra.exception;

import java.sql.SQLException;

public class DatabaseException extends RuntimeException {
    public DatabaseException(String message, SQLException exception) {
        super(message, exception);
    }
}
