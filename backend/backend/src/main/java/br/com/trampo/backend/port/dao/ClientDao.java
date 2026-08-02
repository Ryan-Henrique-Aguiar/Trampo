package br.com.trampo.backend.port.dao;

import br.com.trampo.backend.domain.user.Client;

import java.util.List;
import java.util.Optional;

public interface ClientDao {
    Client save(Client client);

    Optional<Client> findById(long id);

    List<Client> findAll();
}
