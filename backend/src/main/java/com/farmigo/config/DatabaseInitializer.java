package com.farmigo.config;

import com.farmigo.entity.Farmer;
import com.farmigo.entity.Product;
import com.farmigo.entity.User;
import com.farmigo.repository.FarmerRepository;
import com.farmigo.repository.ProductRepository;
import com.farmigo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);

    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        try {
            // Seed Admin User
            if (!userRepository.existsByEmailIgnoreCase("admin@farmigo.com")) {
                User admin = User.builder()
                        .name("Farmigo Admin")
                        .email("admin@farmigo.com")
                        .password(passwordEncoder.encode("admin123"))
                        .phone("9876543210")
                        .role("admin")
                        .profileImage("https://ui-avatars.com/api/?name=Farmigo+Admin&background=16a34a&color=fff")
                        .state("Telangana")
                        .district("Hyderabad")
                        .village("City Center")
                        .build();
                userRepository.save(admin);
                log.info("Initialized Admin account (admin@farmigo.com)");
            }

            // Seed Default Farmer Account (Ramesh Kumar)
            if (!userRepository.existsByEmailIgnoreCase("ramesh@farmigo.com")) {
                User farmerUser = User.builder()
                        .name("Ramesh Kumar")
                        .email("ramesh@farmigo.com")
                        .password(passwordEncoder.encode("farmer123"))
                        .phone("9123456789")
                        .role("farmer")
                        .profileImage("https://ui-avatars.com/api/?name=Ramesh+Kumar&background=f97316&color=fff")
                        .state("Telangana")
                        .district("Warangal")
                        .village("Green Village")
                        .farmName("Sunrise Organic Farm")
                        .farmSize("5 Acres")
                        .build();
                userRepository.save(farmerUser);

                Farmer farmer = Farmer.builder()
                        .user(farmerUser)
                        .name(farmerUser.getName())
                        .village(farmerUser.getVillage())
                        .district(farmerUser.getDistrict())
                        .state(farmerUser.getState())
                        .mobile(farmerUser.getPhone())
                        .profileImage(farmerUser.getProfileImage())
                        .status("active")
                        .build();
                farmerRepository.save(farmer);
                log.info("Initialized Farmer account (ramesh@farmigo.com)");
            }

            // Seed User Account (kudayk59@gmail.com) if not exists
            if (!userRepository.existsByEmailIgnoreCase("kudayk59@gmail.com")) {
                User kudayUser = User.builder()
                        .name("Uday Kiran")
                        .email("kudayk59@gmail.com")
                        .password(passwordEncoder.encode("uday1234"))
                        .phone("9988776655")
                        .role("farmer")
                        .profileImage("https://ui-avatars.com/api/?name=Uday+Kiran&background=0284c7&color=fff")
                        .state("Telangana")
                        .district("Hyderabad")
                        .village("Warangal")
                        .farmName("Kiran Agrotech Farm")
                        .farmSize("10 Acres")
                        .build();
                userRepository.save(kudayUser);

                Farmer farmer = Farmer.builder()
                        .user(kudayUser)
                        .name(kudayUser.getName())
                        .village(kudayUser.getVillage())
                        .district(kudayUser.getDistrict())
                        .state(kudayUser.getState())
                        .mobile(kudayUser.getPhone())
                        .profileImage(kudayUser.getProfileImage())
                        .status("active")
                        .build();
                farmerRepository.save(farmer);
                log.info("Initialized Farmer account (kudayk59@gmail.com)");
            }

        } catch (Exception e) {
            log.error("Error during database initialization: {}", e.getMessage(), e);
        }
    }
}
