package br.com.trampo.backend.port.dao;

import java.util.List;

public interface UsersCategoryDao {
    void save(Integer userId, Integer categoryId);

    List<Integer> findCategoryIdsByUserId(Integer userId);

    void updateCategoriesAndActivateProvider(Integer userId, List<Integer> categoryIds);
}
