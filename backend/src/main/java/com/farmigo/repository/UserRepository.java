package com.farmigo.repository;

import com.farmigo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByEmailIgnoreCaseOrPhone(String email, String phone);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByPhone(String phone);
    long countByRoleIgnoreCase(String role);
    java.util.List<User> findByRoleIgnoreCase(String role);
}
