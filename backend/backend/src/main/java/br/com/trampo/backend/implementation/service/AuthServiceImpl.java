package br.com.trampo.backend.implementation.service;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.RegisterDto;
import br.com.trampo.backend.infra.exception.EmailAlreadyExistsException;
import br.com.trampo.backend.port.dao.CategoryDao;
import br.com.trampo.backend.port.dao.UsersCategoryDao;
import br.com.trampo.backend.port.dao.users.UsersDao;
import br.com.trampo.backend.port.service.auth.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.SQLException;

@Service
public class AuthServiceImpl implements AuthService {
    private final UsersDao usersDao;
    private final UsersCategoryDao usersCategoryDao;
    private final PasswordEncoder passwordEncoder;
    private final CategoryDao categoryDao;
    private final Connection connection;


    public AuthServiceImpl(
            UsersDao usersDao,
            UsersCategoryDao usersCategoryDao,
            PasswordEncoder passwordEncoder, CategoryDao categoryDao, Connection connection
    ) {
        this.usersDao = usersDao;
        this.usersCategoryDao = usersCategoryDao;
        this.passwordEncoder = passwordEncoder;
        this.categoryDao = categoryDao;
        this.connection = connection;
    }

    @Override
    public void register(RegisterDto data) {
        if (usersDao.findByEmail(data.email()).isPresent()) {
            throw new EmailAlreadyExistsException("Email já cadastrado");
        }
        if (data.provider() && data.categoryIds() != null) {
            for (Integer categoryId : data.categoryIds()) {
                if (categoryDao.findById(categoryId).isEmpty()) {
                    throw new RuntimeException(
                            "Categoria não encontrada: " + categoryId
                    );
                }
            }
        }
        try {
            //Inicia transação
            connection.setAutoCommit(false);

            String encryptedPassword =
                    passwordEncoder.encode(data.password());

            Users newUser = new Users(
                    data.email(),
                    encryptedPassword,
                    data.name(),
                    data.cpf(),
                    data.phone(),
                    data.city(),
                    data.state(),
                    data.provider()
            );
            Users savedUser = usersDao.save(newUser);
            // Salva relacionamentos com categorias
            if (data.provider() && data.categoryIds() != null) {
                for (Integer categoryId : data.categoryIds()) {
                    usersCategoryDao.save(
                            savedUser.getId(),
                            categoryId
                    );
                }
            }
            //Tudo funcionou
            connection.commit();

        } catch (Exception e) {

            try {
                connection.rollback();
            } catch (SQLException rollbackException) {
                throw new RuntimeException(
                        "Erro ao realizar rollback do cadastro",
                        rollbackException
                );
            }
            throw new RuntimeException(
                    "Erro ao cadastrar usuário",
                    e
            );
        } finally {
            try {
                connection.setAutoCommit(true);
            } catch (SQLException e) {
                throw new RuntimeException(
                        "Erro ao restaurar conexão",
                        e
                );
            }
        }
    }
}
