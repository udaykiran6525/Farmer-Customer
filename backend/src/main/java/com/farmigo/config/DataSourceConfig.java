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
        log.info("Checking connection to MySQL database at: {}", mysqlUrl);
        try (Connection conn = DriverManager.getConnection(mysqlUrl, mysqlUsername, mysqlPassword)) {
            log.info("✅ Successfully connected to MySQL database (farmigo_db)!");
            return DataSourceBuilder.create()
                    .driverClassName(mysqlDriver)
                    .url(mysqlUrl)
                    .username(mysqlUsername)
                    .password(mysqlPassword)
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
