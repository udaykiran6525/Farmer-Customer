package com.farmigo.security;

import com.farmigo.entity.AdminUser;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;

@Getter
public class AdminPrincipal implements UserDetails {

    private Long id;
    private String name;
    private String email;
    private String password;
    private Collection<? extends GrantedAuthority> authorities;
    private AdminUser adminUser;

    public AdminPrincipal() {
    }

    public AdminPrincipal(Long id, String name, String email, String password, Collection<? extends GrantedAuthority> authorities, AdminUser adminUser) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.authorities = authorities;
        this.adminUser = adminUser;
    }

    public static AdminPrincipal create(AdminUser adminUser) {
        String roleName = adminUser.getRole() != null ? adminUser.getRole().toUpperCase() : "SUPER_ADMIN";
        if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName;
        }
        List<GrantedAuthority> authorities = Arrays.asList(
                new SimpleGrantedAuthority(roleName),
                new SimpleGrantedAuthority("ROLE_ADMIN"),
                new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")
        );

        return new AdminPrincipal(
                adminUser.getId(),
                adminUser.getName(),
                adminUser.getEmail(),
                adminUser.getPassword(),
                authorities,
                adminUser
        );
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public AdminUser getAdminUser() { return adminUser; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}
