package com.supportpilot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Legacy application entry point (retained for backward compatibility).
 * Use {@link CareOpsApplication} instead.
 */
public class SupportPilotApplication extends CareOpsApplication {

    public static void main(String[] args) {
        CareOpsApplication.main(args);
    }
}
