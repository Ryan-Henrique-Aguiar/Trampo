package br.com.trampo.backend.infra.security;

import br.com.trampo.backend.domain.Users;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.stereotype.Service;

import java.time.Instant;


/**
 * @Service indica ao Spring que esta classe é um serviço de negócio (Bean).
 * Ela será gerenciada pelo container do Spring para ser injetada em outras classes.
 */
@Service
public class TokenService {

    /**
     * @Value injeta a chave secreta definida no arquivo de propriedades (application.properties ou yml).
     * Essa chave é essencial para assinar e validar a autenticidade do token JWT.
     */
    @Value("${api.security.token.secret}")
    private String secret;

    /**
     * Gera um token JWT para um usuário autenticado.
     *
     * @param user Objeto com os dados do usuário.
     * @return String representando o JWT assinado.
     */
    public String generateToken(Users user) {
        try {
            // Define o algoritmo de criptografia HMAC256 utilizando a chave secreta.
            Algorithm algorithm = Algorithm.HMAC256(secret);

            // Constrói o JWT definindo suas alegações (claims) principais:
            String token = JWT.create()
                    .withIssuer("auth-api")               // Define quem emitindo o token (emissor).
                    .withSubject(user.getEmail())        // Define o dono do token (identificador, no caso, o e-mail).
                    .withExpiresAt(getTokenExpirationDate()) // Define o momento exato em que o token expira.
                    .sign(algorithm);                     // Assina o token com a chave secreta para garantir a integridade.

            return token;
        } catch (JWTCreationException exception) {
            // Captura falhas de criação (ex: chave nula ou algoritmo inválido) e lança uma exceção de tempo de execução.
            throw new RuntimeException("Erro ao gerar token", exception);
        }
    }

    /**
     * Valida se um token JWT recebido é autêntico, não expirou e pertence a este emissor.
     *
     * @param token String do JWT recebido na requisição HTTP.
     * @return O e-mail do usuário se for válido, ou uma String vazia caso contrário.
     */
    public String validateToken(String token) {
        try {
            // Reutiliza o mesmo algoritmo e chave secreta para checar a assinatura do token.
            Algorithm algorithm = Algorithm.HMAC256(secret);

            return JWT.require(algorithm)
                    .withIssuer("auth-api") // Garante que o token veio da própria aplicação ("auth-api").
                    .build()                // Constrói o verificador com as regras definidas.
                    .verify(token)          // Decodifica, valida a assinatura e checa se a expiração já passou.
                    .getSubject();          // Extrai o identificador do usuário (e-mail) configurado na criação.

        } catch (JWTVerificationException exception) {
            // Se o token for inválido, adulterado ou expirado, retorna String vazia.
            return "";
        }
    }

    /**
     * Método utilitário privado para calcular a data de expiração do token.
     *
     * @return Instant representando a data/hora atual + 1 hora (3600 segundos).
     */
    private Instant getTokenExpirationDate() {
        return Instant.now().plusSeconds(3600);
    }
}
