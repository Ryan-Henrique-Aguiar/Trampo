package br.com.trampo.backend.configuration;

import br.com.trampo.backend.implementation.dao.AddressPostgresDaoImpl;
import br.com.trampo.backend.implementation.dao.CategoryPostgresDaoImpl;
import br.com.trampo.backend.implementation.dao.users.UsersPostgresDaoImpl;
import br.com.trampo.backend.implementation.dao.TicketPostgresDaoImpl;
import br.com.trampo.backend.port.dao.AddressDao;
import br.com.trampo.backend.port.dao.CategoryDao;
import br.com.trampo.backend.port.dao.users.UsersDao;
import br.com.trampo.backend.port.dao.TicketDao;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

@Configuration
public class AppConfiguration {

    @Value("${db.url}")
    private String dbUrl;
    @Value("${db.User}")
    private String dbUser;
    @Value("${db.password}")
    private String dbPassword;

    /**
     * Bean central de conexão JDBC pura.
     * O Spring gerencia essa instância e a injeta nos DAOs abaixo.
     */

    @Bean
    public Connection connection() {
        try {
            return DriverManager.getConnection(dbUrl, dbUser, dbPassword);
        } catch (SQLException exception) {
            throw new RuntimeException("Erro ao conectar ao banco de dados", exception);
        }
    }

    @Bean
    public UsersDao usersDao(Connection connection) {
        return new UsersPostgresDaoImpl(connection);
    }

    @Bean
    public TicketDao getPatientDao(final Connection connection, final AddressDao addressDao) {
        return new TicketPostgresDaoImpl(connection, addressDao);
    }

    @Bean
    public AddressDao getMedicDao(final Connection connection) {
        return new AddressPostgresDaoImpl(connection);
    }

    @Bean
    public CategoryDao categoryDao(final Connection connection) {
        return new CategoryPostgresDaoImpl(connection);
    }

}
