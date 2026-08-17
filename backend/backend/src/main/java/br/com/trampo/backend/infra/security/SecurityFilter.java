package br.com.trampo.backend.infra.security;

import br.com.trampo.backend.port.dao.users.UsersDao;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class SecurityFilter extends OncePerRequestFilter {

    @Autowired
    private final TokenService tokenService;
    private final UsersDao usersDao;

    public SecurityFilter(TokenService tokenService, UsersDao usersDao) {
        this.tokenService = tokenService;
        this.usersDao = usersDao;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        var token = this.recoverToken(request);

        if (token != null) {
            var login = tokenService.validateToken(token);

            //  Verifica se o login não veio vazio (JWT inválido/expirado)
            if (login != null && !login.isEmpty()) {
                var userOptional = usersDao.findByEmail(login);

                // Autentica apenas se o usuário for encontrado no banco sem lançar exceção de filtro
                if (userOptional.isPresent()) {
                    UserDetails userDetails = userOptional.get();
                    var auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                    // Define o usuário no contexto do Spring Security
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        }

        // Continua a execução do filtro para as próximas etapas da requisição
        filterChain.doFilter(request, response);
    }

    private String recoverToken(HttpServletRequest request) {
        var header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        return header.replace("Bearer ", "");
    }
}
