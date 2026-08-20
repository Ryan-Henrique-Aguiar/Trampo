package br.com.trampo.backend.implementation.service.users;

import br.com.trampo.backend.domain.Users;


import br.com.trampo.backend.dto.RegisterDto;
import br.com.trampo.backend.dto.UserDto;
import br.com.trampo.backend.port.dao.UsersCategoryDao;
import br.com.trampo.backend.port.dao.users.UsersDao;
import br.com.trampo.backend.port.service.users.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UsersDao usersDao;

    public UserServiceImpl(UsersDao usersDao, PasswordEncoder passwordEncoder, UsersCategoryDao usersCategoryDao) {
        this.usersDao = usersDao;
    }

    @Override
    public List<UserDto> findAllUsers() {

        List<UserDto> list = new ArrayList<>();

        for (Users user : usersDao.findAll()) {

            UserDto userDto = new UserDto(
                    user.getName(),
                    user.getRating() != null ? user.getRating() : 0.0,
                    user.getCompletedServicesCount(),
                    user.isProvider(),
                    user.getCategories()
            );

            list.add(userDto);
        }

        return list;
    }
}
