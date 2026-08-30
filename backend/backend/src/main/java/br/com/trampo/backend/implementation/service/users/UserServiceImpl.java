package br.com.trampo.backend.implementation.service.users;

import br.com.trampo.backend.domain.Users;


import br.com.trampo.backend.dto.UserDto;
import br.com.trampo.backend.dto.user.UrgentProviderDto;
import br.com.trampo.backend.infra.exception.InvalidRequestException;
import br.com.trampo.backend.port.dao.UsersCategoryDao;
import br.com.trampo.backend.port.dao.users.UsersDao;
import br.com.trampo.backend.port.service.users.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UsersDao usersDao;

    public UserServiceImpl(UsersDao usersDao, PasswordEncoder passwordEncoder, UsersCategoryDao usersCategoryDao) {
        this.usersDao = usersDao;
    }

    @Transactional(readOnly = true)
    @Override
    public List<UserDto> findAllUsers() {

        List<UserDto> list = new ArrayList<>();

        for (Users user : usersDao.findAll()) {
            UserDto userDto = new UserDto(
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

            list.add(userDto);
        }

        return list;
    }

    @Transactional(readOnly = true)
    @Override
    public List<UrgentProviderDto> findProvidersAvailableForUrgency(
            Users user,
            Integer categoryId,
            String state,
            String city
    ) {
        if (user == null || user.getId() == null) {
            throw new InvalidRequestException("Usuário autenticado é obrigatório.");
        }

        if (categoryId == null || state == null || state.isBlank() || city == null || city.isBlank()) {
            throw new InvalidRequestException("Categoria, estado e cidade são obrigatórios.");
        }

        return usersDao.findProvidersAvailableForUrgency(
                        user.getId(),
                        categoryId,
                        state,
                        city
                )
                .stream()
                .map(provider -> new UrgentProviderDto(
                        provider.getId(),
                        provider.getName(),
                        provider.getRating(),
                        provider.getPhone()
                ))
                .toList();
    }
}
