package com.farmigo.controller;

import com.farmigo.dto.LoginRequest;
import com.farmigo.dto.RegisterRequest;
import com.farmigo.entity.NotificationPreferences;
import com.farmigo.security.UserPrincipal;
import com.farmigo.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping(value = "/register", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    public ResponseEntity<Map<String, Object>> register(@ModelAttribute RegisterRequest req,
                                                        @RequestParam(value = "profileImage", required = false) MultipartFile profileImage) {
        return ResponseEntity.ok(authService.register(req, profileImage));
    }

    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> registerJson(@RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req, null));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMe(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(authService.getMe(userPrincipal.getId()));
    }

    @PutMapping(value = "/profile", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    public ResponseEntity<Map<String, Object>> updateProfile(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                             @ModelAttribute RegisterRequest req,
                                                             @RequestParam(value = "profileImage", required = false) MultipartFile profileImage) {
        return ResponseEntity.ok(authService.updateProfile(userPrincipal.getId(), req, profileImage));
    }

    @PutMapping(value = "/profile", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> updateProfileJson(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                                 @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.updateProfile(userPrincipal.getId(), req, null));
    }

    @PostMapping(value = "/profile/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadProfileImage(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                                  @RequestParam("profileImage") MultipartFile profileImage) {
        return ResponseEntity.ok(authService.uploadProfileImage(userPrincipal.getId(), profileImage));
    }

    @PutMapping(value = "/profile/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> updateProfileImage(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                                  @RequestParam("profileImage") MultipartFile profileImage) {
        return ResponseEntity.ok(authService.uploadProfileImage(userPrincipal.getId(), profileImage));
    }

    @GetMapping("/profile/image")
    public ResponseEntity<Map<String, Object>> getProfileImage(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(authService.getProfileImage(userPrincipal.getId()));
    }

    @DeleteMapping("/profile/image")
    public ResponseEntity<Map<String, Object>> removeProfileImage(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(authService.removeProfileImage(userPrincipal.getId()));
    }

    @PutMapping("/notifications")
    public ResponseEntity<Map<String, Object>> updateNotifications(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                                   @RequestBody NotificationPreferences prefs) {
        return ResponseEntity.ok(authService.updateNotificationPreferences(userPrincipal.getId(), prefs));
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, Object>> changePassword(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                              @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(authService.changePassword(userPrincipal.getId(), payload));
    }

    @PutMapping("/2fa")
    public ResponseEntity<Map<String, Object>> toggleTwoFactor(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                               @RequestBody Map<String, Boolean> payload) {
        Boolean enabled = payload.getOrDefault("enabled", payload.get("twoFactorEnabled"));
        return ResponseEntity.ok(authService.toggleTwoFactor(userPrincipal.getId(), enabled));
    }

    @PutMapping("/language")
    public ResponseEntity<Map<String, Object>> updateLanguage(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                              @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(authService.updateLanguage(userPrincipal.getId(), payload.get("language")));
    }

    @PutMapping("/region")
    public ResponseEntity<Map<String, Object>> updateRegion(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(authService.updateRegion(userPrincipal.getId(), payload));
    }

    @GetMapping("/sessions")
    public ResponseEntity<Map<String, Object>> getActiveSessions(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(authService.getActiveSessions(userPrincipal.getId()));
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Map<String, Object>> logoutSession(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                             @PathVariable Long sessionId) {
        return ResponseEntity.ok(authService.logoutSession(userPrincipal.getId(), sessionId));
    }

    @DeleteMapping("/account")
    public ResponseEntity<Map<String, Object>> deleteAccount(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(authService.deleteAccount(userPrincipal.getId()));
    }

    @PostMapping("/support")
    public ResponseEntity<Map<String, Object>> submitSupportTicket(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                                   @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(authService.submitSupportTicket(userPrincipal.getId(), payload));
    }
}

