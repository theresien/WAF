package com.wafap.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@EnableAsync
public class SchedulerConfig {
    // Enables @Scheduled annotations for periodic tasks
    // Enables @Async for asynchronous method execution
}
