package br.com.trampo.backend.port.dao;

import br.com.trampo.backend.domain.Users;

import java.util.List;
import java.util.Optional;

public interface UsersDao {
    Users save(Users client);

    Optional<Users> findById(long id);

    List<Users> findAll();
}
