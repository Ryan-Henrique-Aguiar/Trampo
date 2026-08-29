package br.com.trampo.backend.implementation.service;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.RegisterDto;
import br.com.trampo.backend.infra.exception.*;
import br.com.trampo.backend.infra.validation.AuthValidator;
import br.com.trampo.backend.infra.validation.CpfValidator;
import br.com.trampo.backend.infra.validation.PhoneValidator;
import br.com.trampo.backend.port.dao.CategoryDao;
import br.com.trampo.backend.port.dao.UsersCategoryDao;
import br.com.trampo.backend.port.dao.users.UsersDao;
import br.com.trampo.backend.port.service.auth.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {
    private final UsersDao usersDao;
    private final UsersCategoryDao usersCategoryDao;
    private final PasswordEncoder passwordEncoder;
    private final CategoryDao categoryDao;

    public AuthServiceImpl(
            UsersDao usersDao,
            UsersCategoryDao usersCategoryDao,
            PasswordEncoder passwordEncoder,
            CategoryDao categoryDao
    ) {
        this.usersDao = usersDao;
        this.usersCategoryDao = usersCategoryDao;
        this.passwordEncoder = passwordEncoder;
        this.categoryDao = categoryDao;
    }

    @Transactional
    @Override
    public void register(RegisterDto data) {
        AuthValidator.validateRegister(data);

        String normalizedCpf = CpfValidator.normalize(data.cpf());
        String normalizedPhone = PhoneValidator.normalize(data.phone());

        if (!CpfValidator.isValid(normalizedCpf)) {
            throw new InvalidCpfException("CPF inválido");
        }
        if (usersDao.findByCpf(normalizedCpf).isPresent()) {
            throw new CpfAlreadyExistsException("CPF já cadastrado");
        }

        if (!PhoneValidator.isValid(normalizedPhone)) {
            throw new InvalidPhoneException("Telefone inválido");
        }
        if (usersDao.findByPhone(normalizedPhone).isPresent()) {
            throw new PhoneAlreadyExistsException("Telefone já cadastrado");
        }

        if (usersDao.findByEmail(data.email()).isPresent()) {
            throw new EmailAlreadyExistsException("Email já cadastrado");
        }
        if (data.provider() && (data.categoryIds() == null || data.categoryIds().isEmpty())) {
            throw new InvalidCategoryException("Prestador deve possuir pelo menos uma categoria");
        }
        if (!data.provider() && data.categoryIds() != null && !data.categoryIds().isEmpty()) {
            throw new InvalidCategoryException("Cliente não possui categorias");
        }
        if (data.provider() && data.categoryIds() != null) {
            for (Integer categoryId : data.categoryIds()) {
                if (categoryDao.findById(categoryId).isEmpty()) {
                    throw new CategoryNotFoundException("Categoria não encontrada: " + categoryId);
                }
            }
        }

        String encryptedPassword = passwordEncoder.encode(data.password());

        Users newUser = new Users(
                data.email(),
                encryptedPassword,
                data.name(),
                normalizedCpf,
                normalizedPhone,
                data.city(),
                data.state(),
                data.provider()
        );

        Users savedUser = usersDao.save(newUser);

        if (data.provider() && data.categoryIds() != null) {
            for (Integer categoryId : data.categoryIds()) {
                usersCategoryDao.save(
                        savedUser.getId(),
                        categoryId
                );
            }
        }
    }
}