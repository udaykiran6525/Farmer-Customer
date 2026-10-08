package com.farmigo.service;

import com.farmigo.dto.LoginRequest;
import com.farmigo.dto.RegisterRequest;
import com.farmigo.entity.BlockedUser;
import com.farmigo.entity.User;
import com.farmigo.entity.NotificationPreferences;
import com.farmigo.entity.SupportTicket;
import com.farmigo.entity.UserSession;
import com.farmigo.exception.ResourceNotFoundException;
import com.farmigo.repository.BlockedUserRepository;
import com.farmigo.repository.CustomerRepository;
import com.farmigo.repository.FarmerRepository;
import com.farmigo.repository.SupportTicketRepository;
import com.farmigo.repository.UserRepository;
import com.farmigo.repository.UserSessionRepository;
import com.farmigo.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final CloudinaryService cloudinaryService;
    private final SupportTicketRepository supportTicketRepository;
    private final UserSessionRepository userSessionRepository;
    private final BlockedUserRepository blockedUserRepository;

    @Transactional
    public Map<String, Object> register(RegisterRequest req, MultipartFile profileImageFile) {

        if (userRepository.existsByEmailIgnoreCase(req.getEmail())) {
            throw new IllegalArgumentException("Email already exists!");
        }
        if (userRepository.existsByPhone(req.getPhone())) {
            throw new IllegalArgumentException("Phone number already registered!");
        }

        String imageUrl = "";
        if (profileImageFile != null && !profileImageFile.isEmpty()) {
            imageUrl = cloudinaryService.uploadImage(profileImageFile);
        } else {
            imageUrl = "https://ui-avatars.com/api/?name=" + req.getName().replace(" ", "+") + "&background=f97316&color=fff&size=128";
        }

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail().toLowerCase())
                .password(passwordEncoder.encode(req.getPassword()))
                .phone(req.getPhone())
                .role(req.getRole() != null ? req.getRole().toLowerCase() : "customer")
                .profileImage(imageUrl)
                .state(req.getState())
                .district(req.getDistrict())
                .village(req.getVillage())
                .address(req.getAddress())
                .city(req.getCity())
                .pincode(req.getPincode())
                .farmName(req.getFarmName())
                .farmSize(req.getFarmSize())
                .crops(req.getCrops())
                .language(req.getLanguage() != null ? req.getLanguage() : "en")
                .build();

        userRepository.save(user);

        // Persist normalized role record in MySQL (Farmers / Customers tables)
        if ("farmer".equalsIgnoreCase(user.getRole())) {
            com.farmigo.entity.Farmer farmer = com.farmigo.entity.Farmer.builder()
                    .user(user)
                    .name(user.getName())
                    .village(user.getVillage())
                    .district(user.getDistrict())
                    .state(user.getState())
                    .mobile(user.getPhone())
                    .profileImage(user.getProfileImage())
                    .status("active")
                    .build();
            farmerRepository.save(farmer);
        } else if ("customer".equalsIgnoreCase(user.getRole())) {
            com.farmigo.entity.Customer customer = com.farmigo.entity.Customer.builder()
                    .user(user)
                    .name(user.getName())
                    .address(user.getAddress() != null ? user.getAddress() : (user.getCity() != null ? user.getCity() : ""))
                    .mobile(user.getPhone())
                    .build();
            customerRepository.save(customer);
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), req.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Account created successfully. Welcome to Farmigo.");
        res.put("token", token);
        res.put("user", user);
        return res;
    }

    public Map<String, Object> login(LoginRequest req) {
        String identifier = req.getIdentifier() != null ? req.getIdentifier() : (req.getEmail() != null ? req.getEmail() : req.getPhone());
        if (identifier == null) {
            throw new IllegalArgumentException("Email or phone is required");
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCaseOrPhone(identifier, identifier);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        User user = userOpt.get();

        Optional<BlockedUser> blockedOpt = blockedUserRepository.findByUserId(user.getId());
        if (blockedOpt.isPresent() && (blockedOpt.get().getIsActive() == null || blockedOpt.get().getIsActive())) {
            throw new IllegalArgumentException("Account blocked by Super Admin: " + (blockedOpt.get().getReason() != null ? blockedOpt.get().getReason() : "Contact support"));
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), req.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Login successful. Welcome back, " + user.getName().split(" ")[0] + ".");
        res.put("token", token);
        res.put("user", user);
        return res;
    }

    public Map<String, Object> getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("user", user);
        return res;
    }

    @Transactional
    public Map<String, Object> updateProfile(Long userId, RegisterRequest req, MultipartFile profileImageFile) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (req.getName() != null) user.setName(req.getName());
        if (req.getPhone() != null) user.setPhone(req.getPhone());
        if (req.getState() != null) user.setState(req.getState());
        if (req.getDistrict() != null) user.setDistrict(req.getDistrict());
        if (req.getVillage() != null) user.setVillage(req.getVillage());
        if (req.getAddress() != null) user.setAddress(req.getAddress());
        if (req.getCity() != null) user.setCity(req.getCity());
        if (req.getPincode() != null) user.setPincode(req.getPincode());
        if (req.getFarmName() != null) user.setFarmName(req.getFarmName());
        if (req.getFarmSize() != null) user.setFarmSize(req.getFarmSize());
        if (req.getCrops() != null) user.setCrops(req.getCrops());
        if (req.getLanguage() != null) user.setLanguage(req.getLanguage());
        if (req.getBankAccountDetails() != null) user.setBankAccountDetails(req.getBankAccountDetails());
        if (req.getUpiId() != null) user.setUpiId(req.getUpiId());
        if (req.getTimeZone() != null) user.setTimeZone(req.getTimeZone());

        if (Boolean.TRUE.equals(req.getRemoveProfileImage())) {
            String defaultUrl = "https://ui-avatars.com/api/?name=" + user.getName().replace(" ", "+") + "&background=2E7D32&color=fff&size=160";
            user.setProfileImage(defaultUrl);
        } else if (profileImageFile != null && !profileImageFile.isEmpty()) {
            String imageUrl = cloudinaryService.uploadImage(profileImageFile);
            if (!imageUrl.isEmpty()) {
                user.setProfileImage(imageUrl);
            }
        }

        userRepository.save(user);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Profile updated successfully.");
        res.put("user", user);
        return res;
    }

    @Transactional
    public Map<String, Object> uploadProfileImage(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty or missing");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds 5MB limit");
        }
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equalsIgnoreCase("image/jpeg") && !contentType.equalsIgnoreCase("image/jpg") && !contentType.equalsIgnoreCase("image/png") && !contentType.equalsIgnoreCase("image/webp"))) {
            throw new IllegalArgumentException("Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String imageUrl = cloudinaryService.uploadImage(file);
        if (imageUrl == null || imageUrl.isEmpty()) {
            throw new RuntimeException("Failed to upload image");
        }

        user.setProfileImage(imageUrl);
        userRepository.save(user);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Profile photo updated successfully.");
        res.put("profileImage", user.getProfileImage());
        res.put("updatedAt", user.getUpdatedAt());
        res.put("user", user);
        return res;
    }

    public Map<String, Object> getProfileImage(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("profileImage", user.getProfileImage());
        res.put("updatedAt", user.getUpdatedAt());
        return res;
    }

    @Transactional
    public Map<String, Object> removeProfileImage(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String defaultUrl = "https://ui-avatars.com/api/?name=" + user.getName().replace(" ", "+") + "&background=2E7D32&color=fff&size=160";
        user.setProfileImage(defaultUrl);
        userRepository.save(user);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Profile photo removed successfully.");
        res.put("profileImage", user.getProfileImage());
        res.put("updatedAt", user.getUpdatedAt());
        res.put("user", user);
        return res;
    }

    @Transactional
    public Map<String, Object> updateNotificationPreferences(Long userId, NotificationPreferences prefs) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (prefs != null) {
            user.setNotificationPreferences(prefs);
            userRepository.save(user);
        }
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Notification preferences updated successfully.");
        res.put("user", user);
        return res;
    }

    @Transactional
    public Map<String, Object> changePassword(Long userId, Map<String, String> payload) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String currentPassword = payload.get("currentPassword");
        String newPassword = payload.get("newPassword");
        if (currentPassword == null || newPassword == null || newPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("Current and new passwords are required.");
        }
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Password changed successfully.");
        return res;
    }

    @Transactional
    public Map<String, Object> toggleTwoFactor(Long userId, Boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setTwoFactorEnabled(enabled != null ? enabled : false);
        userRepository.save(user);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Two-factor authentication updated.");
        res.put("user", user);
        return res;
    }

    @Transactional
    public Map<String, Object> updateLanguage(Long userId, String language) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setLanguage(language != null && !language.trim().isEmpty() ? language : "en");
        userRepository.save(user);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Language preference updated.");
        res.put("user", user);
        return res;
    }

    @Transactional
    public Map<String, Object> updateRegion(Long userId, Map<String, String> payload) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (payload.get("state") != null) user.setState(payload.get("state"));
        if (payload.get("district") != null) user.setDistrict(payload.get("district"));
        if (payload.get("timeZone") != null) user.setTimeZone(payload.get("timeZone"));
        userRepository.save(user);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Region settings updated.");
        res.put("user", user);
        return res;
    }

    @Transactional
    public Map<String, Object> getActiveSessions(Long userId) {
        List<UserSession> sessions = userSessionRepository.findByUserIdAndIsActiveTrueOrderByLastActiveTimeDesc(userId);
        if (sessions.isEmpty()) {
            UserSession session = UserSession.builder()
                    .userId(userId)
                    .deviceName("Desktop / Web")
                    .browser("Chrome / Web Browser")
                    .ipAddress("127.0.0.1")
                    .loginTime(LocalDateTime.now())
                    .lastActiveTime(LocalDateTime.now())
                    .isActive(true)
                    .build();
            userSessionRepository.save(session);
            sessions.add(session);
        }
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("sessions", sessions);
        return res;
    }

    @Transactional
    public Map<String, Object> logoutSession(Long userId, Long sessionId) {
        Optional<UserSession> opt = userSessionRepository.findById(sessionId);
        if (opt.isPresent() && opt.get().getUserId().equals(userId)) {
            UserSession session = opt.get();
            session.setIsActive(false);
            userSessionRepository.save(session);
        }
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Device session logged out.");
        return res;
    }

    @Transactional
    public Map<String, Object> deleteAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        userRepository.delete(user);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Account deleted successfully.");
        return res;
    }

    @Transactional
    public Map<String, Object> submitSupportTicket(Long userId, Map<String, String> payload) {
        User user = userRepository.findById(userId).orElse(null);
        SupportTicket ticket = SupportTicket.builder()
                .userId(userId)
                .userName(payload.getOrDefault("userName", user != null ? user.getName() : "Farmer"))
                .userEmail(payload.getOrDefault("userEmail", user != null ? user.getEmail() : ""))
                .subject(payload.getOrDefault("subject", "Support Query"))
                .message(payload.getOrDefault("message", ""))
                .ticketType(payload.getOrDefault("ticketType", "SUPPORT"))
                .status("OPEN")
                .build();
        supportTicketRepository.save(ticket);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Ticket submitted successfully.");
        res.put("ticket", ticket);
        return res;
    }
}

