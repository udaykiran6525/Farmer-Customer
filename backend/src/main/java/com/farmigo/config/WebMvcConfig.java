package com.farmigo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/admin/login").setViewName("forward:/admin-login.html");
        registry.addViewController("/admin/dashboard").setViewName("forward:/admin-dashboard.html");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Ensure local uploads directory exists for image storage/fallback
        File uploadsDir = new File("uploads");
        if (!uploadsDir.exists()) {
            uploadsDir.mkdirs();
        }

        Path rootUploadsPath = Paths.get("uploads").toAbsolutePath().normalize();
        Path parentUploadsPath = Paths.get("..", "uploads").toAbsolutePath().normalize();
        Path backendUploadsPath = Paths.get("backend", "uploads").toAbsolutePath().normalize();

        // Serve uploaded files from all possible upload locations (root, parent, backend)
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(
                        rootUploadsPath.toUri().toString(),
                        parentUploadsPath.toUri().toString(),
                        backendUploadsPath.toUri().toString(),
                        "file:./uploads/",
                        "file:../uploads/",
                        "file:uploads/"
                );

        // Serve frontend files from ../frontend and ../frontend/public
        try {
            Path frontendPath = Paths.get("..", "frontend").toAbsolutePath().normalize();
            Path publicPath = Paths.get("..", "frontend", "public").toAbsolutePath().normalize();
            Path localFrontendPath = Paths.get("frontend").toAbsolutePath().normalize();
            Path localPublicPath = Paths.get("frontend", "public").toAbsolutePath().normalize();

            registry.addResourceHandler("/**")
                    .addResourceLocations(
                            frontendPath.toUri().toString(),
                            publicPath.toUri().toString(),
                            localFrontendPath.toUri().toString(),
                            localPublicPath.toUri().toString(),
                            "file:./frontend/",
                            "file:./frontend/public/",
                            "classpath:/static/",
                            "classpath:/public/"
                    );
        } catch (Exception e) {
            System.err.println("Error setting up frontend resource handlers: " + e.getMessage());
        }
    }

    @org.springframework.beans.factory.annotation.Value("${cors.allowed-origins:https://farmercustomer.vercel.app,http://localhost:3000,http://localhost:5000,http://localhost:5173,http://127.0.0.1:5500}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        java.util.List<String> origins = new java.util.ArrayList<>();
        if (allowedOrigins != null && !allowedOrigins.trim().isEmpty()) {
            for (String origin : allowedOrigins.split(",")) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty() && !origins.contains(trimmed)) {
                    origins.add(trimmed);
                }
            }
        }

        if (!origins.contains("https://farmercustomer.vercel.app")) {
            origins.add("https://farmercustomer.vercel.app");
        }
        if (!origins.contains("https://farmercustomer.vercel.app/")) {
            origins.add("https://farmercustomer.vercel.app/");
        }
        if (!origins.contains("https://*.vercel.app")) {
            origins.add("https://*.vercel.app");
        }
        if (!origins.contains("http://localhost:[*]")) {
            origins.add("http://localhost:[*]");
        }
        if (!origins.contains("http://127.0.0.1:[*]")) {
            origins.add("http://127.0.0.1:[*]");
        }
        if (!origins.contains("*")) {
            origins.add("*");
        }

        registry.addMapping("/**")
                .allowedOriginPatterns(origins.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD")
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "Content-Type", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
