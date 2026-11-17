package com.supportpilot.agents;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.supportpilot.llm.LlmClient;
import org.springframework.stereotype.Component;

/**
 * Legacy wrapper for MailroomAgent (previously TriageAgent).
 */
@Component
public class TriageAgent extends MailroomAgent {

    public TriageAgent(LlmClient llmClient, ObjectMapper objectMapper) {
        super(llmClient, objectMapper);
    }
}
