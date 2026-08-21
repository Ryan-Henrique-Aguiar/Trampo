package br.com.trampo.backend.controller;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.AuthenticationDto;
import br.com.trampo.backend.dto.LoginResponseDto;
import br.com.trampo.backend.dto.RegisterDto;
import br.com.trampo.backend.dto.UserDto;
import br.com.trampo.backend.infra.security.TokenService;
import br.com.trampo.backend.mapper.user.UserMapper;
import br.com.trampo.backend.port.service.auth.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("api/v1/auth")
public class AuthenticationController {

    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final AuthService authService;
    private final UserMapper userMapper;

    public AuthenticationController(AuthenticationManager authenticationManager, TokenService tokenService, AuthService authService, UserMapper userMapper) {
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.authService = authService;
        this.userMapper = userMapper;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody @Validated AuthenticationDto data) {
        // Variável que obtem o valor de uma instância de uma classe do spring security
        var usernamePassword = new UsernamePasswordAuthenticationToken(data.email(), data.password());
        var auth = this.authenticationManager.authenticate(usernamePassword);
        var authenticatedUser = (Users) auth.getPrincipal();
        var token = tokenService.generateToken(authenticatedUser);
        var userDto = userMapper.toDto(authenticatedUser);

        return ResponseEntity.ok(new LoginResponseDto(token, userDto));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> me(@AuthenticationPrincipal Users user) {
        return ResponseEntity.ok(userMapper.toDto(user));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody @Validated RegisterDto data) {
        authService.register(data);
        return ResponseEntity.ok().body(
                Map.of("message", "Usuário criado com sucesso!")
        );
    }
}
