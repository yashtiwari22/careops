package com.supportpilot.approval;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository for Approval entities.
 */
public interface ApprovalRepository extends JpaRepository<Approval, UUID> {
    List<Approval> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, Approval.Status status);
    Optional<Approval> findByTicketId(UUID ticketId);
}
