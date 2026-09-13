package br.com.trampo.backend.controller.user;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.UserDto;
import br.com.trampo.backend.dto.user.UrgentProviderDto;
import br.com.trampo.backend.dto.user.UrgencyAvailabilityDto;
import br.com.trampo.backend.dto.user.UpdateProfileDto;
import br.com.trampo.backend.dto.user.UpdateProfileResponseDto;
import br.com.trampo.backend.dto.user.UpdateLocationDto;
import br.com.trampo.backend.dto.user.UpdatePasswordDto;
import br.com.trampo.backend.infra.security.TokenService;
import br.com.trampo.backend.mapper.user.UserMapper;
import br.com.trampo.backend.port.service.users.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/user")
public class UsersController {

    private final UserService usersService;
    private final UserMapper userMapper;
    private final TokenService tokenService;

    public UsersController(UserService usersService, UserMapper userMapper, TokenService tokenService) {
        this.usersService = usersService;
        this.userMapper = userMapper;
        this.tokenService = tokenService;
    }

    @PatchMapping("/profile")
    public ResponseEntity<UpdateProfileResponseDto> updateProfile(
            @AuthenticationPrincipal Users user,
            @RequestBody UpdateProfileDto data
    ) {
        Users updated = usersService.updateProfile(user, data);
        return ResponseEntity.ok(new UpdateProfileResponseDto(
                userMapper.toDto(updated),
                tokenService.generateToken(updated)
        ));
    }

    @PatchMapping("/location")
    public ResponseEntity<UserDto> updateLocation(
            @AuthenticationPrincipal Users user,
            @RequestBody UpdateLocationDto data
    ) {
        return ResponseEntity.ok(userMapper.toDto(usersService.updateLocation(user, data)));
    }

    @PatchMapping("/password")
    public ResponseEntity<Void> updatePassword(
            @AuthenticationPrincipal Users user,
            @RequestBody UpdatePasswordDto data
    ) {
        usersService.updatePassword(user, data);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/providers/urgent")
    public ResponseEntity<List<UrgentProviderDto>> findProvidersAvailableForUrgency(
            @AuthenticationPrincipal Users user,
            @RequestParam Integer categoryId,
            @RequestParam String state,
            @RequestParam String city
    ) {
        return ResponseEntity.ok(
                usersService.findProvidersAvailableForUrgency(user, categoryId, state, city)
        );
    }

    @GetMapping("/providers/urgent/count")
    public ResponseEntity<Integer> countProvidersAvailableForUrgency(
            @AuthenticationPrincipal Users user
    ) {
        return ResponseEntity.ok(
                usersService.countProvidersAvailableForUrgency(user)
        );
    }

    @PatchMapping("/urgency")
    public ResponseEntity<UrgencyAvailabilityDto> updateUrgencyAvailability(
            @AuthenticationPrincipal Users user,
            @RequestBody UrgencyAvailabilityDto dto
    ) {
        boolean available = usersService.updateUrgencyAvailability(
                user,
                dto.availableForUrgency()
        );
        return ResponseEntity.ok(new UrgencyAvailabilityDto(available));
    }
}
