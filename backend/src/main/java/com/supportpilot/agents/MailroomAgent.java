package com.supportpilot.agents;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.supportpilot.llm.LlmClient;
import com.supportpilot.llm.LlmRequest;
import com.supportpilot.llm.LlmResponse;
import com.supportpilot.ticket.Ticket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * AI Agent responsible for classifying incoming support tickets into structured category, priority, and sentiment,
 * and routing to downstream specialists.
 */
@Component
public class MailroomAgent implements Agent {

    private static final Logger log = LoggerFactory.getLogger(MailroomAgent.class);
    private static final int MAX_PARSE_RETRIES = 2;

    private final LlmClient llmClient;
    private final ObjectMapper objectMapper;
    private final String promptTemplate;

    public MailroomAgent(LlmClient llmClient, ObjectMapper objectMapper) {
        this.llmClient = llmClient;
        this.objectMapper = objectMapper;
        this.promptTemplate = loadPromptTemplate();
    }

    private String loadPromptTemplate() {
        try {
            ClassPathResource resource = new ClassPathResource("prompts/mailroom_v1.txt");
            if (!resource.exists()) {
                resource = new ClassPathResource("prompts/triage_v1.txt");
            }
            try (InputStream is = resource.getInputStream()) {
                return new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            log.warn("Could not load prompts/mailroom_v1.txt from classpath, using fallback prompt", e);
            return "Classify customer ticket:\nSubject: {subject}\nBody: {body}\nReturn JSON with category, priority, sentiment, summary, routeToResolutionAgent, routeToActionAgent.";
        }
    }

    @Override
    public AgentName name() {
        return AgentName.MAILROOM;
    }

    @Override
    public AgentResult run(AgentContext context) {
        Ticket ticket = context.ticket();
        long startTime = System.currentTimeMillis();

        String systemPrompt = "You are MailroomAgent for CareOps. Output strictly valid JSON matching the schema.";
        String userPrompt = promptTemplate
                .replace("{subject}", ticket.getSubject())
                .replace("{body}", ticket.getBody())
                .replace("{customerName}", ticket.getCustomerName())
                .replace("{customerEmail}", ticket.getCustomerEmail());

        int totalPromptTokens = 0;
        int totalCompletionTokens = 0;
        LlmResponse lastResponse = null;
        MailroomResult mailroomResult = null;

        for (int attempt = 0; attempt <= MAX_PARSE_RETRIES; attempt++) {
            try {
                lastResponse = llmClient.chat(new LlmRequest(systemPrompt, userPrompt));
                totalPromptTokens += lastResponse.promptTokens();
                totalCompletionTokens += lastResponse.completionTokens();

                String cleanJson = cleanJsonOutput(lastResponse.content());
                mailroomResult = objectMapper.readValue(cleanJson, MailroomResult.class);

                // Validation passed
                break;
            } catch (Exception ex) {
                log.warn("Mailroom JSON parse attempt {} failed for ticket {}: {}", attempt + 1, ticket.getId(), ex.getMessage());
                if (attempt == MAX_PARSE_RETRIES) {
                    // Safe fallback default
                    mailroomResult = new MailroomResult(
                            "GENERAL",
                            "MEDIUM",
                            "NEUTRAL",
                            "Ticket mailroom sorting fallback",
                            true,
                            false
                    );
                } else {
                    userPrompt += "\nError: Invalid JSON output. Please respond with strict JSON only.";
                }
            }
        }

        long durationMs = System.currentTimeMillis() - startTime;
        String model = lastResponse != null ? lastResponse.model() : "mock-gemini-flash";
        var cost = lastResponse != null ? lastResponse.estimatedCostUsd() : java.math.BigDecimal.ZERO;

        return new AgentResult(
                name(),
                true,
                model,
                totalPromptTokens,
                totalCompletionTokens,
                cost,
                durationMs,
                mailroomResult,
                null,
                Map.of("category", mailroomResult.category(), "priority", mailroomResult.priority())
        );
    }

    private String cleanJsonOutput(String raw) {
        if (raw == null) return "{}";
        String trimmed = raw.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }
}

