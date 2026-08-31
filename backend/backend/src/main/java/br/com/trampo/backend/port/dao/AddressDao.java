package br.com.trampo.backend.port.dao;

import br.com.trampo.backend.domain.Address;
import br.com.trampo.backend.domain.Users;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Optional;

public interface AddressDao {
    Address save(Address address) throws SQLException;

    Address update(Address address) throws SQLException;

    Optional<Address> findById(int id) throws SQLException;
}
