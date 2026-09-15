package br.com.trampo.backend.implementation.service.users;

import br.com.trampo.backend.domain.Users;


import br.com.trampo.backend.dto.user.UrgentProviderDto;
import br.com.trampo.backend.dto.user.UpdateProfileDto;
import br.com.trampo.backend.dto.user.UpdateLocationDto;
import br.com.trampo.backend.dto.user.UpdatePasswordDto;
import br.com.trampo.backend.dto.user.UpdateCategoriesDto;
import br.com.trampo.backend.infra.exception.EmailAlreadyExistsException;
import br.com.trampo.backend.infra.exception.CpfAlreadyExistsException;
import br.com.trampo.backend.infra.exception.PhoneAlreadyExistsException;
import br.com.trampo.backend.infra.exception.InvalidCpfException;
import br.com.trampo.backend.infra.exception.InvalidPhoneException;
import br.com.trampo.backend.infra.exception.UnauthorizedUserException;
import br.com.trampo.backend.infra.exception.InvalidRequestException;
import br.com.trampo.backend.infra.exception.InvalidCategoryException;
import br.com.trampo.backend.infra.exception.CategoryNotFoundException;
import br.com.trampo.backend.infra.validation.CpfValidator;
import br.com.trampo.backend.infra.validation.PhoneValidator;
import br.com.trampo.backend.port.dao.users.UsersDao;
import br.com.trampo.backend.port.dao.UsersCategoryDao;
import br.com.trampo.backend.port.dao.CategoryDao;
import br.com.trampo.backend.port.service.tools.FileStorageService;
import br.com.trampo.backend.port.service.users.UserService;
import org.springframework.core.io.Resource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    private final UsersDao usersDao;
    private final PasswordEncoder passwordEncoder;
    private final UsersCategoryDao usersCategoryDao;
    private final CategoryDao categoryDao;

    private final FileStorageService fileStorageService;

    public UserServiceImpl(UsersDao usersDao, PasswordEncoder passwordEncoder,
                           UsersCategoryDao usersCategoryDao, CategoryDao categoryDao, FileStorageService fileStorageService) {
        this.usersDao = usersDao;
        this.passwordEncoder = passwordEncoder;
        this.usersCategoryDao = usersCategoryDao;
        this.categoryDao = categoryDao;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    @Override
    public Users updateProfile(Users user, UpdateProfileDto data) {
        if (user == null || user.getId() == null) {
            throw new UnauthorizedUserException("Usuário não autenticado.");
        }
        if (data == null || data.name() == null || data.email() == null
                || data.cpf() == null || data.phone() == null) {
            throw new InvalidRequestException("Nome, e-mail, CPF e telefone são obrigatórios.");
        }

        String name = data.name().trim();
        String email = data.email().trim();
        String cpf = CpfValidator.normalize(data.cpf());
        String phone = PhoneValidator.normalize(data.phone());

        if (name.isEmpty() || name.length() > 100) {
            throw new InvalidRequestException("Nome inválido.");
        }
        if (email.length() > 150 || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new InvalidRequestException("E-mail inválido.");
        }
        if (!cpf.equals(user.getCpf()) && !CpfValidator.isValid(cpf)) {
            throw new InvalidCpfException("CPF inválido.");
        }
        if (!phone.equals(user.getPhone()) && !PhoneValidator.isValid(phone)) {
            throw new InvalidPhoneException("Telefone inválido.");
        }
        if (usersDao.findByEmail(email).filter(other -> !other.getId().equals(user.getId())).isPresent()) {
            throw new EmailAlreadyExistsException("E-mail já cadastrado.");
        }
        if (usersDao.findByCpf(cpf).filter(other -> !other.getId().equals(user.getId())).isPresent()) {
            throw new CpfAlreadyExistsException("CPF já cadastrado.");
        }
        if (usersDao.findByPhone(phone).filter(other -> !other.getId().equals(user.getId())).isPresent()) {
            throw new PhoneAlreadyExistsException("Telefone já cadastrado.");
        }

        usersDao.updateProfile(user.getId(), name, email, cpf, phone);
        return usersDao.findById(user.getId())
                .orElseThrow(() -> new UnauthorizedUserException("Usuário não encontrado."));
    }

    @Transactional
    @Override
    public Users updateLocation(Users user, UpdateLocationDto data) {
        if (user == null || user.getId() == null) {
            throw new UnauthorizedUserException("Usuário não autenticado.");
        }
        if (data == null || data.state() == null || data.city() == null) {
            throw new InvalidRequestException("Estado e cidade são obrigatórios.");
        }

        String state = data.state().trim().toUpperCase();
        String city = data.city().trim();
        if (!state.matches("[A-Z]{2}") || city.isEmpty() || city.length() > 100) {
            throw new InvalidRequestException("Estado ou cidade inválidos.");
        }

        usersDao.updateLocation(user.getId(), state, city);
        return usersDao.findById(user.getId())
                .orElseThrow(() -> new UnauthorizedUserException("Usuário não encontrado."));
    }

    @Transactional
    @Override
    public void updatePassword(Users user, UpdatePasswordDto data) {
        if (user == null || user.getId() == null) {
            throw new UnauthorizedUserException("Usuário não autenticado.");
        }
        if (data == null || data.currentPassword() == null || data.newPassword() == null) {
            throw new InvalidRequestException("Senha atual e nova senha são obrigatórias.");
        }
        if (!passwordEncoder.matches(data.currentPassword(), user.getPassword())) {
            throw new InvalidRequestException("Senha atual incorreta.");
        }
        if (data.newPassword().length() < 6) {
            throw new InvalidRequestException("A nova senha deve possuir pelo menos 6 caracteres.");
        }

        usersDao.updatePassword(user.getId(), passwordEncoder.encode(data.newPassword()));
    }

    @Transactional(readOnly = true)
    @Override
    public List<Integer> findCategoryIds(Users user) {
        if (user == null || user.getId() == null) {
            throw new UnauthorizedUserException("Usuário não autenticado.");
        }
        return usersCategoryDao.findCategoryIdsByUserId(user.getId());
    }

    @Transactional
    @Override
    public List<Integer> updateCategories(Users user, UpdateCategoriesDto data) {
        if (user == null || user.getId() == null) {
            throw new UnauthorizedUserException("Usuário não autenticado.");
        }
        if (data == null || data.categoryIds() == null || data.categoryIds().isEmpty()) {
            throw new InvalidCategoryException("Selecione pelo menos uma categoria.");
        }
        if (data.categoryIds().contains(null)
                || data.categoryIds().stream().distinct().count() != data.categoryIds().size()) {
            throw new InvalidCategoryException("Lista de categorias inválida.");
        }
        for (Integer categoryId : data.categoryIds()) {
            if (categoryDao.findById(categoryId).isEmpty()) {
                throw new CategoryNotFoundException("Categoria não encontrada: " + categoryId);
            }
        }

        usersCategoryDao.updateCategoriesAndActivateProvider(user.getId(), data.categoryIds());
        return usersCategoryDao.findCategoryIdsByUserId(user.getId());
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

    @Transactional(readOnly = true)
    @Override
    public int countProvidersAvailableForUrgency(Users user) {
        if (user == null || user.getId() == null) {
            throw new InvalidRequestException("Usuário autenticado é obrigatório.");
        }

        if (user.getState() == null || user.getState().isBlank()
                || user.getCity() == null || user.getCity().isBlank()) {
            throw new InvalidRequestException("Cidade e estado do usuário são obrigatórios.");
        }

        return usersDao.countProvidersAvailableForUrgency(
                user.getId(),
                user.getState(),
                user.getCity()
        );
    }

    @Transactional
    @Override
    public boolean updateUrgencyAvailability(Users user, boolean available) {
        if (user == null || user.getId() == null) {
            throw new InvalidRequestException("Usuário autenticado é obrigatório.");
        }

        if (!user.isProvider()) {
            throw new InvalidRequestException("Apenas prestadores podem alterar a disponibilidade para urgências.");
        }

        usersDao.updateUrgencyAvailability(user.getId(), available);
        return available;
    }

    @Override
    public void updateProfileImage(Integer userId, MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Imagem não pode ser vazia");
        }

        Users user = usersDao.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Usuário não encontrado")
                );

        String oldImagePath = user.getProfileImagePath();

        String newImagePath = fileStorageService.save(
                file,
                "users/" + userId
        );

        usersDao.updateProfileImage(
                userId,
                newImagePath
        );

        if (oldImagePath != null && !oldImagePath.isBlank()) {
            fileStorageService.delete(oldImagePath);
        }
    }

    @Override
    public Resource getProfileImage(Integer userId) {

        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("Usuário não encontrado.");
        }

        Users user = usersDao.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Usuário não encontrado.")
                );

        String filePath = user.getProfileImagePath();

        if (filePath == null || filePath.isBlank()) {
            throw new IllegalArgumentException("Usuário não possui foto de perfil.");
        }

        return fileStorageService.load(filePath);
    }

    @Override
    public void deleteProfileImage(Integer userId) {

        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("Usuário não encontrado.");
        }

        Users user = usersDao.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Usuário não encontrado.")
                );

        String filePath = user.getProfileImagePath();

        if (filePath == null || filePath.isBlank()) {
            return;
        }

        fileStorageService.delete(filePath);

        usersDao.updateProfileImage(userId, null);
    }
}
