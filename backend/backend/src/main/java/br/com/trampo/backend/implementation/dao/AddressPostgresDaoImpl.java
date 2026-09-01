package br.com.trampo.backend.implementation.dao;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.infra.exception.DatabaseException;
import br.com.trampo.backend.port.dao.AddressDao;
import org.springframework.jdbc.datasource.DataSourceUtils;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

public class AddressPostgresDaoImpl implements AddressDao {

    private final DataSource dataSource;

    public AddressPostgresDaoImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Address save(Address address) {

        String sql = "INSERT INTO address (street, number, neighborhood, city, state, zip_code, complement, user_id) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id";

        try (Connection connection = dataSource.getConnection(); PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, address.getStreet());
            stmt.setString(2, address.getNumber());
            stmt.setString(3, address.getNeighborhood());
            stmt.setString(4, address.getCity());
            stmt.setString(5, address.getState());
            stmt.setString(6, address.getZipCode());
            stmt.setString(7, address.getComplement());
            stmt.setInt(8, address.getUser().getId());

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    address.setId(rs.getInt(1));
                }
            }
            return address;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao salvar endereço no banco de dados.", e);
        }
    }

    @Override
    public Address update(Address address) {
        String sql = """
                UPDATE address
                SET street = ?,
                    number = ?,
                    neighborhood = ?,
                    city = ?,
                    state = ?,
                    zip_code = ?,
                    complement = ?
                WHERE id = ?
                """;

        try (Connection connection = dataSource.getConnection(); PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, address.getStreet());
            statement.setString(2, address.getNumber());
            statement.setString(3, address.getNeighborhood());
            statement.setString(4, address.getCity());
            statement.setString(5, address.getState());
            statement.setString(6, address.getZipCode());
            statement.setString(7, address.getComplement());
            statement.setInt(8, address.getId());
            statement.executeUpdate();
            return address;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao atualizar endereço no banco de dados.", e);
        }
    }

    @Override
    public Optional<Address> findById(int id) {
        Connection connection = DataSourceUtils.getConnection(dataSource);
        // Lógica de busca deve ser implementada aqui futuramente
        return Optional.empty();
    }
}
