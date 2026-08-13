package br.com.trampo.backend.implementation.service.users;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.UserDto;
import br.com.trampo.backend.port.dao.users.UsersDao;
import br.com.trampo.backend.port.service.users.UserService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UsersDao usersDao;

    public UserServiceImpl(UsersDao usersDao) {
        this.usersDao = usersDao;
    }

    @Override
    public List<UserDto> findAllUsers() {
        List<UserDto> list = new ArrayList<>();
        UserDto userDto = new UserDto();
        for (Users user : usersDao.findAll()) {
            userDto.setName(user.getName());
            userDto.setRating(user.getRating());
            userDto.setCompleted_services_count(user.getCompletedServicesCount());
            list.add(userDto);
        }
        return list;
    }
}
