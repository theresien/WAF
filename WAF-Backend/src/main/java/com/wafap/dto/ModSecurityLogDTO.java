package com.wafap.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for ModSecurity JSON logs
 * Example format from ModSecurity audit log
 */
public record ModSecurityLogDTO(
    @JsonProperty("transaction")
    Transaction transaction
) {
    public record Transaction(
        @JsonProperty("client_ip")
        String clientIp,

        @JsonProperty("client_port")
        Integer clientPort,

        @JsonProperty("host_ip")
        String hostIp,

        @JsonProperty("host_port")
        Integer hostPort,

        @JsonProperty("request")
        Request request,

        @JsonProperty("response")
        Response response,

        @JsonProperty("messages")
        java.util.List<Message> messages
    ) {}

    public record Request(
        @JsonProperty("method")
        String method,

        @JsonProperty("uri")
        String uri,

        @JsonProperty("headers")
        java.util.Map<String, String> headers
    ) {}

    public record Response(
        @JsonProperty("status")
        Integer status
    ) {}

    public record Message(
        @JsonProperty("message")
        String message,

        @JsonProperty("details")
        Details details
    ) {}

    public record Details(
        @JsonProperty("ruleId")
        String ruleId,

        @JsonProperty("severity")
        Integer severity,

        @JsonProperty("msg")
        String msg,

        @JsonProperty("data")
        String data,

        @JsonProperty("file")
        String file,

        @JsonProperty("lineNumber")
        String lineNumber
    ) {}
}
