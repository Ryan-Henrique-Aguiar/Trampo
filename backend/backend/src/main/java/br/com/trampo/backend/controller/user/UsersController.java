package br.com.trampo.backend.controller.user;

import br.com.trampo.backend.domain.Users;
import br.com.trampo.backend.dto.UserDto;
import br.com.trampo.backend.port.service.users.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RestController
@RequestMapping("api/v1/user")
public class UsersController {

    private UserService usersService;

    public UsersController(UserService usersService) {
        this.usersService = usersService;
    }

    @CrossOrigin
    @GetMapping()
    public ResponseEntity<List<UserDto>> findAllUsers() {
        return ResponseEntity.ok().body(usersService.findAllUsers());
    }
}
