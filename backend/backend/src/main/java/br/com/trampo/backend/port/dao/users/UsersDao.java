package br.com.trampo.backend.port.dao.users;

import br.com.trampo.backend.domain.Users;

import java.util.List;
import java.util.Optional;

public interface UsersDao {
    Users save(Users user);

    Optional<Users> findById(long id);

    Optional<Users> findByEmail(String email);

    List<Users> findAll();
}
