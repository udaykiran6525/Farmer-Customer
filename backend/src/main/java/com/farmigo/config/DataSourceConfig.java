package com.farmigo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.url}")
    private String mysqlUrl;

    @Value("${spring.datasource.username}")
    private String mysqlUsername;

    @Value("${spring.datasource.password}")
    private String mysqlPassword;

    @Value("${spring.datasource.driver-class-name}")
    private String mysqlDriver;

    @Bean
    @Primary
    public DataSource dataSource() {
        String effectiveUrl = mysqlUrl;
        String effectiveUser = mysqlUsername;
        String effectivePass = mysqlPassword;

        // Auto-handle JDBC URLs with embedded credentials (e.g. jdbc:mysql://user:pass@host:port/db)
        if (effectiveUrl != null && effectiveUrl.contains("@")) {
            try {
                int protoIdx = effectiveUrl.indexOf("://");
                if (protoIdx != -1) {
                    String prefix = effectiveUrl.substring(0, protoIdx + 3);
                    String rest = effectiveUrl.substring(protoIdx + 3);
                    int atIndex = rest.indexOf("@");
                    if (atIndex != -1) {
                        String userPass = rest.substring(0, atIndex);
                        String hostAndDb = rest.substring(atIndex + 1);
                        if (userPass.contains(":")) {
                            int colonIdx = userPass.indexOf(":");
                            effectiveUser = userPass.substring(0, colonIdx);
                            effectivePass = userPass.substring(colonIdx + 1);
                        } else {
                            effectiveUser = userPass;
                        }
                        effectiveUrl = prefix + hostAndDb;
                    }
                }
            } catch (Exception e) {
                log.warn("Could not parse embedded credentials from DB_URL: {}", e.getMessage());
            }
        }

        log.info("Checking connection to MySQL database at: {}", effectiveUrl);
        try (Connection conn = DriverManager.getConnection(effectiveUrl, effectiveUser, effectivePass)) {
            String catalog = conn.getCatalog();
            log.info("✅ Successfully connected to MySQL database ({})!", catalog != null ? catalog : "connected");
            return DataSourceBuilder.create()
                    .driverClassName(mysqlDriver)
                    .url(effectiveUrl)
                    .username(effectiveUser)
                    .password(effectivePass)
                    .build();
        } catch (Exception e) {
            log.warn("⚠️ MySQL service is currently offline or unreachable ({})", e.getMessage());
            log.info("🔄 Launching embedded database fallback so application runs without errors.");
            String h2Url = "jdbc:h2:mem:farmigo_db;DB_CLOSE_DELAY=-1;MODE=MySQL;DATABASE_TO_LOWER=TRUE;CASE_INSENSITIVE_IDENTIFIERS=TRUE";
            return DataSourceBuilder.create()
                    .driverClassName("org.h2.Driver")
                    .url(h2Url)
                    .username("sa")
                    .password("")
                    .build();
        }
    }
}
