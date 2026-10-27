package br.com.trampo.backend.controller.user;


import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.infra.security.TokenService;
import br.com.trampo.backend.mapper.user.UserMapper;
import br.com.trampo.backend.port.service.users.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.sql.Connection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UsersControllerTest {
    @Mock
    private UserService usersService;

    @Mock
    private UserMapper userMapper;

    @Mock
    private TokenService tokenService;

    @InjectMocks
    private UsersController controller;

    @Test
    void returnCategoriesForUsers() {

        // Arrange: preparar os dados
        Users user = new Users();
        user.setId(1);

        List<Integer> categorias = List.of(1, 2, 3);

        when(usersService.findCategoryIds(user))
                .thenReturn(categorias);

        // Act: executar o método
        ResponseEntity<List<Integer>> response =
                controller.findCategories(user);

        // Assert: verificar o resultado
        assertEquals(200, response.getStatusCode().value());
        assertEquals(categorias, response.getBody());

        verify(usersService).findCategoryIds(user);
    }

}
