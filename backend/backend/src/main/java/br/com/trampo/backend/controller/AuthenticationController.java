package br.com.trampo.backend.controller;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.AuthenticationDto;
import br.com.trampo.backend.dto.LoginResponseDto;
import br.com.trampo.backend.dto.RegisterDto;
import br.com.trampo.backend.dto.UserDto;
import br.com.trampo.backend.implementation.service.AuthenticationService;
import br.com.trampo.backend.infra.security.TokenService;
import br.com.trampo.backend.port.dao.users.UsersDao;
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

@RestController
@RequestMapping("api/v1/auth")
public class AuthenticationController {


    private final AuthenticationManager authenticationManager;
    private final UsersDao usersDao;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthenticationController(AuthenticationManager authenticationManager, UsersDao usersDao, PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.authenticationManager = authenticationManager;
        this.usersDao = usersDao;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }


    @PostMapping("/login")
    public ResponseEntity login(@RequestBody @Validated AuthenticationDto data) {
        // Variável que obtem o valor de uma instância de uma classe do spring security
        var usernamePassword = new UsernamePasswordAuthenticationToken(data.email(), data.password());
        var auth = this.authenticationManager.authenticate(usernamePassword);
        var token = tokenService.generateToken((Users) auth.getPrincipal());

        return ResponseEntity.ok(new LoginResponseDto(token));
    }

    @PostMapping("/register")
    public ResponseEntity register(@RequestBody @Validated RegisterDto data) {
        if (this.usersDao.findByEmail(data.email()).isPresent()) {
            return ResponseEntity.badRequest().build();
        }
        String encryptedPassword = passwordEncoder.encode(data.password());
        Users newUser = new Users(
                data.email(),
                encryptedPassword,
                data.name(),
                data.cpf(),
                data.phone(),
                data.city()
        );
        usersDao.save(newUser);

        return ResponseEntity.ok().build();
    }
}
