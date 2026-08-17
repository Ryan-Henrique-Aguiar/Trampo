package br.com.trampo.backend.port.service.auth;

import br.com.trampo.backend.dto.RegisterDto;

public interface AuthService {

    void register(RegisterDto data);
}