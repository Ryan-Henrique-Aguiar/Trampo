package br.com.trampo.backend.port.service.users;
import br.com.trampo.backend.dto.RegisterDto;
import br.com.trampo.backend.dto.UserDto;

import java.util.List;


public interface UserService {

    List<UserDto> findAllUsers();
}
