package com.wafap.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

/**
 * Gateway service for executing iptables and dnsmasq commands via sudo scripts
 * Security: Only whitelisted scripts in configured directory can be executed
 */
@Service
public class IptablesGateway {

    private static final Logger logger = LoggerFactory.getLogger(IptablesGateway.class);

    // Security: Regex patterns for input validation
    private static final Pattern MAC_ADDRESS_PATTERN = Pattern.compile("^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$");
    private static final Pattern IPV4_ADDRESS_PATTERN = Pattern.compile("^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$");
    private static final Pattern IPV6_ADDRESS_PATTERN = Pattern.compile("^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:$");

    @Value("${wafap.iptables.sudo-script-path:/opt/wafap/scripts}")
    private String scriptPath;

    @Value("${wafap.iptables.ban-script:ban-device.sh}")
    private String banScript;

    @Value("${wafap.iptables.unban-script:unban-device.sh}")
    private String unbanScript;

    @Value("${wafap.iptables.reload-script:reload-firewall.sh}")
    private String reloadScript;

    @Value("${wafap.dnsmasq.blacklist-file:/etc/dnsmasq.d/blacklist.conf}")
    private String blacklistFile;

    /**
     * Ban a device by MAC and IP address
     */
    public boolean banDevice(String macAddress, String ipAddress) {
        logger.info("Banning device: MAC={}, IP={}", macAddress, ipAddress);

        // Security: Validate inputs before passing to shell scripts
        if (!isValidMacAddress(macAddress)) {
            logger.error("Invalid MAC address format: {}", macAddress);
            throw new IllegalArgumentException("Invalid MAC address format");
        }

        if (!isValidIpAddress(ipAddress)) {
            logger.error("Invalid IP address format: {}", ipAddress);
            throw new IllegalArgumentException("Invalid IP address format");
        }

        try {
            // Execute ban script with MAC and IP as arguments
            int exitCode = executeScript(banScript, macAddress, ipAddress);

            if (exitCode == 0) {
                logger.info("Successfully banned device: {}", macAddress);
                return true;
            } else {
                logger.error("Failed to ban device {}: exit code {}", macAddress, exitCode);
                return false;
            }
        } catch (Exception e) {
            logger.error("Error banning device {}: {}", macAddress, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Unban (allow) a device by MAC and IP address
     */
    public boolean unbanDevice(String macAddress, String ipAddress) {
        logger.info("Unbanning device: MAC={}, IP={}", macAddress, ipAddress);

        // Security: Validate inputs before passing to shell scripts
        if (!isValidMacAddress(macAddress)) {
            logger.error("Invalid MAC address format: {}", macAddress);
            throw new IllegalArgumentException("Invalid MAC address format");
        }

        if (!isValidIpAddress(ipAddress)) {
            logger.error("Invalid IP address format: {}", ipAddress);
            throw new IllegalArgumentException("Invalid IP address format");
        }

        try {
            int exitCode = executeScript(unbanScript, macAddress, ipAddress);

            if (exitCode == 0) {
                logger.info("Successfully unbanned device: {}", macAddress);
                return true;
            } else {
                logger.error("Failed to unban device {}: exit code {}", macAddress, exitCode);
                return false;
            }
        } catch (Exception e) {
            logger.error("Error unbanning device {}: {}", macAddress, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Reload firewall and dnsmasq configuration
     */
    public boolean reloadFirewall() {
        logger.info("Reloading firewall configuration");

        try {
            int exitCode = executeScript(reloadScript);

            if (exitCode == 0) {
                logger.info("Successfully reloaded firewall");
                return true;
            } else {
                logger.error("Failed to reload firewall: exit code {}", exitCode);
                return false;
            }
        } catch (Exception e) {
            logger.error("Error reloading firewall: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Execute a whitelisted sudo script
     */
    private int executeScript(String scriptName, String... args) throws IOException, InterruptedException {
        // Security: Validate script path
        Path fullScriptPath = Paths.get(scriptPath, scriptName).normalize();

        if (!fullScriptPath.startsWith(scriptPath)) {
            throw new SecurityException("Script path traversal attempt detected: " + scriptName);
        }

        if (!Files.exists(fullScriptPath)) {
            throw new IOException("Script not found: " + fullScriptPath);
        }

        if (!Files.isExecutable(fullScriptPath)) {
            throw new IOException("Script is not executable: " + fullScriptPath);
        }

        // Build command
        String[] command = new String[args.length + 2];
        command[0] = "sudo";
        command[1] = fullScriptPath.toString();
        System.arraycopy(args, 0, command, 2, args.length);

        // Execute
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        // Read output
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                logger.debug("Script output: {}", line);
            }
        }

        // Wait for completion (max 30 seconds)
        boolean finished = process.waitFor(30, TimeUnit.SECONDS);

        if (!finished) {
            process.destroyForcibly();
            throw new IOException("Script execution timed out: " + scriptName);
        }

        return process.exitValue();
    }

    /**
     * Validate MAC address format
     * Security: Prevents command injection via MAC address parameter
     */
    private boolean isValidMacAddress(String macAddress) {
        if (macAddress == null || macAddress.isEmpty()) {
            return false;
        }
        return MAC_ADDRESS_PATTERN.matcher(macAddress).matches();
    }

    /**
     * Validate IP address format (IPv4 or IPv6)
     * Security: Prevents command injection via IP address parameter
     */
    private boolean isValidIpAddress(String ipAddress) {
        if (ipAddress == null || ipAddress.isEmpty()) {
            return false;
        }
        return IPV4_ADDRESS_PATTERN.matcher(ipAddress).matches() ||
               IPV6_ADDRESS_PATTERN.matcher(ipAddress).matches();
    }
}
