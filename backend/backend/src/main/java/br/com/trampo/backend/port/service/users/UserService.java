package br.com.trampo.backend.port.service.users;
import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.UserDto;
import br.com.trampo.backend.dto.user.UrgentProviderDto;

import java.util.List;


public interface UserService {

    List<UserDto> findAllUsers();

    List<UrgentProviderDto> findProvidersAvailableForUrgency(
            Users user,
            Integer categoryId,
            String state,
            String city
    );

    boolean updateUrgencyAvailability(Users user, boolean available);
}
