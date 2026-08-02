package br.com.trampo.backend.port.dao;

import br.com.trampo.backend.domain.Address;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Optional;

public interface AddressDao {
    Address save(Address address) throws SQLException;

    Address saveWithConnection(Address address, Connection conn) throws SQLException;

    Optional<Address> findById(int id) throws SQLException;
}
