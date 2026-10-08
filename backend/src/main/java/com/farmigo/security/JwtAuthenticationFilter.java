package com.farmigo.security;

import com.farmigo.repository.BlockedUserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private AdminUserDetailsService adminUserDetailsService;

    @Autowired
    private BlockedUserRepository blockedUserRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String subject = tokenProvider.getSubjectFromJWT(jwt);
                UserDetails userDetails = null;

                if (subject != null && subject.startsWith("ADMIN_")) {
                    Long adminId = Long.parseLong(subject.substring(6));
                    userDetails = adminUserDetailsService.loadUserById(adminId);
                } else if (subject != null) {
                    Long userId = Long.parseLong(subject);
                    if (blockedUserRepository != null) {
                        java.util.Optional<com.farmigo.entity.BlockedUser> blockedOpt = blockedUserRepository.findByUserId(userId);
                        if (blockedOpt.isPresent() && (blockedOpt.get().getIsActive() == null || blockedOpt.get().getIsActive())) {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"success\":false,\"message\":\"Account blocked by Super Admin\"}");
                            return;
                        }
                    }
                    userDetails = customUserDetailsService.loadUserById(userId);
                }

                if (userDetails != null) {
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ex) {
            System.err.println("Could not set user authentication in security context: " + ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
