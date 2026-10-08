package com.farmigo.controller;

import com.farmigo.security.UserPrincipal;
import com.farmigo.service.MiscService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MiscController {

    private final MiscService miscService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> res = new HashMap<>();
        res.put("status", "UP");
        res.put("database", "MySQL");
        res.put("backend", "Spring Boot");
        res.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/weather")
    public ResponseEntity<Map<String, Object>> getWeather(@RequestParam(required = false) String location) {
        return ResponseEntity.ok(miscService.getWeather(location));
    }

    @GetMapping("/government-schemes")
    public ResponseEntity<Map<String, Object>> getGovernmentSchemes(@RequestParam(required = false) String state) {
        return ResponseEntity.ok(miscService.getGovernmentSchemes(state));
    }

    @GetMapping("/notifications")
    public ResponseEntity<Map<String, Object>> getNotifications(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("count", 0);
            res.put("notifications", java.util.Collections.emptyList());
            return ResponseEntity.ok(res);
        }
        return ResponseEntity.ok(miscService.getNotifications(userPrincipal.getId()));
    }
}
