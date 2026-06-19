package com.abdil.support.repository;

import com.abdil.support.model.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // ============================================
    // MÉTHODES DE RECHERCHE
    // ============================================

    List<Ticket> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Ticket> findByUserIdAndStatus(Long userId, String status);

    Long countByStatus(String status);

    List<Ticket> findByPriorityAndStatus(String priority, String status);

    // ============================================
    // MÉTHODES DE PAGINATION
    // ============================================

    Page<Ticket> findByStatus(String status, Pageable pageable);

    Page<Ticket> findByPriority(String priority, Pageable pageable);

    Page<Ticket> findByAssignedTo(Long assignedTo, Pageable pageable);

    // ============================================
    // STATISTIQUES - Version Native SQL (Recommandée)
    // ============================================

    @Query(value = "SELECT AVG(rating) FROM support_tickets WHERE rating IS NOT NULL", nativeQuery = true)
    Double getAverageRating();

    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) FROM support_tickets WHERE resolved_at IS NOT NULL", nativeQuery = true)
    Double getAverageResponseTime();

    // ============================================
    // AUTRES RECHERCHES
    // ============================================

    @Query("SELECT t FROM Ticket t WHERE t.assignedTo = :agentId ORDER BY t.createdAt DESC")
    List<Ticket> findByAssignedTo(@Param("agentId") Long agentId);

    // ============================================
    // STATISTIQUES DÉTAILLÉES
    // ============================================

    @Query(value = """
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_count,
            COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_count,
            COUNT(CASE WHEN status = 'WAITING' THEN 1 END) as waiting_count,
            COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) as resolved_count,
            COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_count,
            COALESCE(AVG(rating), 0) as avg_rating,
            COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))), 0) as avg_response_time
        FROM support_tickets
    """, nativeQuery = true)
    Object[] getDetailedStats();

    @Query(value = """
        SELECT 
            category,
            COUNT(*) as count
        FROM support_tickets
        GROUP BY category
        ORDER BY count DESC
    """, nativeQuery = true)
    List<Object[]> getTicketsByCategory();

    @Query(value = """
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
        FROM support_tickets
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
    """, nativeQuery = true)
    List<Object[]> getTicketsLast7Days();
}