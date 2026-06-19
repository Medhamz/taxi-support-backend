package com.abdil.support.repository;

import com.abdil.support.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByTicketIdOrderByCreatedAtAsc(Long ticketId);

    List<Message> findByTicketIdAndSenderIdNotAndIsReadFalse(Long ticketId, Long senderId);

    Long countByTicketIdAndSenderIdNotAndIsReadFalse(Long ticketId, Long senderId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.ticketId = :ticketId AND m.isRead = false")
    Long countUnreadByTicketId(@Param("ticketId") Long ticketId);
}