package br.com.trampo.backend.port.dao;

public interface UsersCategoryDao {
    void save(Integer userId, Integer categoryId);
}
