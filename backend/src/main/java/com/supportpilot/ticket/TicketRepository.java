package com.supportpilot.ticket;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository for Ticket entities.
 */
public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    Optional<Ticket> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);

    Optional<Ticket> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query(value = """
        SELECT * FROM tickets t
        WHERE t.tenant_id = :tenantId
          AND (CAST(:status AS text) IS NULL OR t.status = CAST(:status AS text))
          AND (CAST(:priority AS text) IS NULL OR t.priority = CAST(:priority AS text))
          AND (CAST(:category AS text) IS NULL OR t.category = CAST(:category AS text))
          AND (CAST(:search AS text) IS NULL
               OR LOWER(t.subject) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
               OR LOWER(t.customer_name) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
               OR LOWER(t.customer_email) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))
        ORDER BY t.created_at DESC
    """, nativeQuery = true)
    List<Ticket> findFiltered(
            @Param("tenantId") UUID tenantId,
            @Param("status") String status,
            @Param("priority") String priority,
            @Param("category") String category,
            @Param("search") String search
    );

    List<Ticket> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    @Query("SELECT t.status, COUNT(t) FROM Ticket t WHERE t.tenantId = :tenantId GROUP BY t.status")
    List<Object[]> countByStatusForTenant(@Param("tenantId") UUID tenantId);

    long countByTenantId(UUID tenantId);
}
