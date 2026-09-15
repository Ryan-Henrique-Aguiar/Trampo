package br.com.trampo.backend.port.service.users;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.user.UrgentProviderDto;
import br.com.trampo.backend.dto.user.UpdateProfileDto;
import br.com.trampo.backend.dto.user.UpdateLocationDto;
import br.com.trampo.backend.dto.user.UpdatePasswordDto;
import br.com.trampo.backend.dto.user.UpdateCategoriesDto;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;


public interface UserService {

    Users updateProfile(Users user, UpdateProfileDto data);

    Users updateLocation(Users user, UpdateLocationDto data);

    void updatePassword(Users user, UpdatePasswordDto data);

    List<Integer> findCategoryIds(Users user);

    List<Integer> updateCategories(Users user, UpdateCategoriesDto data);

    List<UrgentProviderDto> findProvidersAvailableForUrgency(
            Users user,
            Integer categoryId,
            String state,
            String city
    );

    int countProvidersAvailableForUrgency(Users user);

    boolean updateUrgencyAvailability(Users user, boolean available);

    void updateProfileImage(Integer userId, MultipartFile file);

    Resource getProfileImage(Integer userId);

    void deleteProfileImage(Integer userId);
}
