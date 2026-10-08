package com.farmigo.service;

import com.farmigo.entity.GovernmentScheme;
import com.farmigo.entity.Notification;
import com.farmigo.entity.User;
import com.farmigo.entity.WeatherCache;
import com.farmigo.repository.GovernmentSchemeRepository;
import com.farmigo.repository.NotificationRepository;
import com.farmigo.repository.UserRepository;
import com.farmigo.repository.WeatherCacheRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class MiscService {

    private final WeatherCacheRepository weatherCacheRepository;
    private final GovernmentSchemeRepository governmentSchemeRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public Map<String, Object> getWeather(String location) {
        String loc = (location != null && !location.trim().isEmpty()) ? location.trim() : "Hyderabad";
        Optional<WeatherCache> cacheOpt = weatherCacheRepository.findByLocationIgnoreCase(loc);
        
        WeatherCache cache;
        if (cacheOpt.isPresent()) {
            cache = cacheOpt.get();
        } else {
            cache = WeatherCache.builder()
                    .location(loc)
                    .temperature(28.5)
                    .condition("Sunny & Clear")
                    .humidity(65.0)
                    .forecastJson("{\"temp\": 28.5, \"condition\": \"Sunny\", \"humidity\": 65, \"wind\": \"12 km/h\"}")
                    .build();
            weatherCacheRepository.save(cache);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("weather", cache);
        return res;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getGovernmentSchemes(String state) {
        List<GovernmentScheme> schemes;
        if (state != null && !state.trim().isEmpty()) {
            schemes = governmentSchemeRepository.findByStateIgnoreCase(state);
        } else {
            schemes = governmentSchemeRepository.findAll();
        }

        if (schemes.isEmpty()) {
            GovernmentScheme defaultScheme = GovernmentScheme.builder()
                    .title("PM-KISAN Samman Nidhi")
                    .description("Financial assistance of Rs. 6000 per annum to all landholding farmer families.")
                    .state("All India")
                    .category("Financial Aid")
                    .benefit("Rs. 6000 / Year")
                    .link("https://pmkisan.gov.in")
                    .build();
            schemes = Collections.singletonList(defaultScheme);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("count", schemes.size());
        res.put("schemes", schemes);
        return res;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getNotifications(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("count", notifications.size());
        res.put("notifications", notifications);
        return res;
    }
}
