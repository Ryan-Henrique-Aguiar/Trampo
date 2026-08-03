package br.com.trampo.backend.implementation.dao;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.port.dao.AddressDao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

public class AddressPostgresDaoImpl implements AddressDao {
    private final Connection connection;

    public AddressPostgresDaoImpl(Connection connection) {
        this.connection = connection;
    }

    @Override
    public Address save(Address address) throws SQLException {
        return saveWithConnection(address, this.connection);
    }

    @Override
    public Address saveWithConnection(Address address, Connection conn) throws SQLException {
        String sql = "INSERT INTO address (street, number, neighborhood, city, state, zip_code, complement) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, address.getStreet());
            stmt.setString(2, address.getNumber());
            stmt.setString(3, address.getNeighborhood());
            stmt.setString(4, address.getCity());
            stmt.setString(5, address.getState());
            stmt.setString(6, address.getZipCode());
            stmt.setString(7, address.getComplement());

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    address.setId(rs.getInt(1));
                }
            }
        }
        return address;
    }

    @Override
    public Optional<Address> findById(int id) throws SQLException {
        return Optional.empty();
    }
}
