package com.supportpilot.tools;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository for DemoOrder entities.
 */
public interface DemoOrderRepository extends JpaRepository<DemoOrder, UUID> {
    Optional<DemoOrder> findByTenantIdAndOrderNumber(UUID tenantId, String orderNumber);
    List<DemoOrder> findByTenantIdAndCustomerEmail(UUID tenantId, String customerEmail);
}
