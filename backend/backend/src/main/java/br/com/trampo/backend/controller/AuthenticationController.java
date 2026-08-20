package br.com.trampo.backend.controller;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.AuthenticationDto;
import br.com.trampo.backend.dto.LoginResponseDto;
import br.com.trampo.backend.dto.RegisterDto;
import br.com.trampo.backend.dto.UserDto;
import br.com.trampo.backend.implementation.service.AuthenticationService;
import br.com.trampo.backend.infra.security.TokenService;
import br.com.trampo.backend.port.dao.users.UsersDao;
import br.com.trampo.backend.port.service.auth.AuthService;
import br.com.trampo.backend.port.service.users.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("api/v1/auth")
public class AuthenticationController {


    private final AuthenticationManager authenticationManager;
    private final UsersDao usersDao;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final AuthService authService;
    public AuthenticationController(AuthenticationManager authenticationManager, UsersDao usersDao, PasswordEncoder passwordEncoder, TokenService tokenService, AuthService authService) {
        this.authenticationManager = authenticationManager;
        this.usersDao = usersDao;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.authService = authService;
    }


    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody @Validated AuthenticationDto data) {
        // Variável que obtem o valor de uma instância de uma classe do spring security
        var usernamePassword = new UsernamePasswordAuthenticationToken(data.email(), data.password());
        var auth = this.authenticationManager.authenticate(usernamePassword);
        var authenticatedUser = (Users) auth.getPrincipal();
        var token = tokenService.generateToken(authenticatedUser);
        var userDto = new UserDto(
                authenticatedUser.getId(),
                authenticatedUser.getName(),
                authenticatedUser.getRating(),
                authenticatedUser.isProvider(),
                authenticatedUser.isAvailableForUrgency(),
                authenticatedUser.getCreatedServicesCount(),
                authenticatedUser.getServiceStartDate(),
                authenticatedUser.getCompletedServicesCount(),
                authenticatedUser.getCity(),
                authenticatedUser.getState()
        );

        return ResponseEntity.ok(new LoginResponseDto(token, userDto));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody @Validated RegisterDto data) {
        authService.register(data);
        return ResponseEntity.ok().body(
                Map.of("message", "Usuário criado com sucesso!")
        );
    }
}
