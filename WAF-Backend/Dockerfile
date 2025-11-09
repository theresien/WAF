# Multi-stage build for WAF-AP Manager
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copy pom.xml and download dependencies (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

# Install required packages
RUN apk add --no-cache \
    bash \
    iptables \
    dnsmasq \
    sudo

# Create application user
RUN addgroup -S wafap && adduser -S wafap -G wafap

WORKDIR /app

# Copy JAR from builder
COPY --from=builder /app/target/*.jar app.jar

# Copy scripts
COPY scripts /opt/wafap/scripts
RUN chmod +x /opt/wafap/scripts/*.sh

# Create directories
RUN mkdir -p /var/lib/dnsmasq /etc/dnsmasq.d /var/log/wafap && \
    chown -R wafap:wafap /var/lib/dnsmasq /etc/dnsmasq.d /var/log/wafap

# Configure sudo (in production, use sudoers.d properly)
RUN echo "wafap ALL=(ALL) NOPASSWD: /opt/wafap/scripts/*.sh" >> /etc/sudoers

USER wafap

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
