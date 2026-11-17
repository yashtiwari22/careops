package com.supportpilot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main application entry point for the CareOps AI Customer Support Platform.
 */
@SpringBootApplication
@EnableScheduling
public class CareOpsApplication {

    public static void main(String[] args) {
        SpringApplication.run(CareOpsApplication.class, args);
    }
}
