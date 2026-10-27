package br.com.trampo.backend.implementation.dao.user;
import br.com.trampo.backend.implementation.dao.users.UsersPostgresDaoImpl;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class UsersPostgresDaoImplTest {
    @Test
    void  updateAddressInDataBase() throws Exception {

        // Arrange: simular a conexão
        DataSource dataSource = mock(DataSource.class);
        Connection connection = mock(Connection.class);
        PreparedStatement statement =
                mock(PreparedStatement.class);

        String sql =
                "UPDATE users SET state = ?, city = ? WHERE id = ?";

        when(dataSource.getConnection())
                .thenReturn(connection);

        when(connection.prepareStatement(sql))
                .thenReturn(statement);

        UsersPostgresDaoImpl dao =
                new UsersPostgresDaoImpl(dataSource);

        // Act
        dao.updateLocation(
                1,
                "MG",
                "Santa Rita do Sapucaí"
        );

        // Assert
        verify(statement).setString(1, "MG");
        verify(statement).setString(
                2, "Santa Rita do Sapucaí"
        );
        verify(statement).setInt(3, 1);

        verify(statement).executeUpdate();
    }
}
