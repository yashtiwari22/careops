package com.supportpilot.queue;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository for QueueJob with PostgreSQL SKIP LOCKED concurrency.
 */
public interface QueueJobRepository extends JpaRepository<QueueJob, UUID> {

    @Query(value = """
        SELECT * FROM queue_jobs
        WHERE queue_name = :queueName
          AND (
            (status = 'PENDING' AND run_at <= CURRENT_TIMESTAMP)
            OR
            (status = 'PROCESSING' AND locked_until < CURRENT_TIMESTAMP)
          )
        ORDER BY run_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    """, nativeQuery = true)
    Optional<QueueJob> findNextAvailableJobForUpdate(@Param("queueName") String queueName);

    long countByStatus(QueueJob.Status status);

    java.util.List<QueueJob> findTop100ByStatusOrderByCreatedAtDesc(QueueJob.Status status);
}
