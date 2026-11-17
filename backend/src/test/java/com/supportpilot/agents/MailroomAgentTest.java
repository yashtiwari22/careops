package com.supportpilot.agents;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.supportpilot.llm.MockLlmClient;
import com.supportpilot.ticket.Ticket;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class MailroomAgentTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("MailroomAgent handles MockLlmClient end to end")
    void mailroomWithRealMockLlmClient() {
        MockLlmClient mockLlm = new MockLlmClient(0, 0, 0.0);
        MailroomAgent agent = new MailroomAgent(mockLlm, objectMapper);

        Ticket ticket = new Ticket(
                UUID.randomUUID(),
                "test@example.com",
                "Alice",
                "Order #ORD-1042 delayed",
                "Where is my package? The tracking has not updated.",
                "idemp-2"
        );

        AgentResult result = agent.run(new AgentContext(ticket));
        assertTrue(result.success());
        assertEquals(AgentName.MAILROOM, result.agentName());
        assertNotNull(result.payload());

        MailroomResult mailroom = (MailroomResult) result.payload();
        assertEquals("ORDER_INQUIRY", mailroom.category());
        assertTrue(mailroom.priority().equals("HIGH") || mailroom.priority().equals("MEDIUM"));
    }
}
