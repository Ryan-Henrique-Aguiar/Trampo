package br.com.trampo.backend.mapper.user;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.UserDto;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDto toDto(Users user) {
        return new UserDto(
                user.getId(),
                user.getName(),
                user.getRating(),
                user.isProvider(),
                user.isAvailableForUrgency(),
                user.getCreatedServicesCount(),
                user.getServiceStartDate(),
                user.getCompletedServicesCount(),
                user.getCity(),
                user.getState()
        );
    }
}
