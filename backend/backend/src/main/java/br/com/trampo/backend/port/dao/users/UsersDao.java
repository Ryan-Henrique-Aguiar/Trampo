package br.com.trampo.backend.port.dao.users;

import br.com.trampo.backend.domain.Users;

import java.util.List;
import java.util.Optional;

public interface UsersDao {
    Users save(Users user);

    Optional<Users> findById(long id);

    Optional<Users> findByEmail(String email);

    Optional<Users> findByCpf(String cpf);

    Optional<Users> findByPhone(String phone);

    void updateProfile(int userId, String name, String email, String cpf, String phone);

    void updateLocation(int userId, String state, String city);

    void updatePassword(int userId, String encodedPassword);

    List<Users> findProvidersAvailableForUrgency(
            int userId,
            int categoryId,
            String state,
            String city
    );

    int countProvidersAvailableForUrgency(
            int userId,
            String state,
            String city
    );

    void updateUrgencyAvailability(int userId, boolean available);
}
