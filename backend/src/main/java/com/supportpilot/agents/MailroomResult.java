package com.supportpilot.agents;

/**
 * Structured output model for MailroomAgent classification and routing.
 */
public record MailroomResult(
    String category,
    String priority,
    String sentiment,
    String summary,
    boolean routeToResolutionAgent,
    boolean routeToActionAgent
) {}

