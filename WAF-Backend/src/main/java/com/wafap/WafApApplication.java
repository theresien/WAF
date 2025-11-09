package com.wafap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.net.InetAddress;
import java.net.UnknownHostException;

@SpringBootApplication
@EnableScheduling
public class WafApApplication {

    private static final Logger logger = LoggerFactory.getLogger(WafApApplication.class);

    public static void main(String[] args) throws UnknownHostException {
        SpringApplication app = new SpringApplication(WafApApplication.class);
        Environment env = app.run(args).getEnvironment();

        String protocol = "http";
        String serverPort = env.getProperty("server.port", "8080");
        String contextPath = env.getProperty("server.servlet.context-path", "/api");
        String hostAddress = InetAddress.getLocalHost().getHostAddress();

        logger.info("""

                ----------------------------------------------------------
                Application '{}' is running!
                Access URLs:
                    Local:      {}://localhost:{}{}
                    External:   {}://{}:{}{}
                    Swagger UI: {}://localhost:{}{}swagger-ui.html
                    H2 Console: {}://localhost:{}{}h2-console
                Profile(s):     {}
                Java Version:   {}
                ----------------------------------------------------------
                """,
                env.getProperty("spring.application.name"),
                protocol, serverPort, contextPath,
                protocol, hostAddress, serverPort, contextPath,
                protocol, serverPort, contextPath,
                protocol, serverPort, contextPath,
                env.getActiveProfiles(),
                System.getProperty("java.version")
        );
    }
}
