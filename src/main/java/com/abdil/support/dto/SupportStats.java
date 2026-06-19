package com.abdil.support.dto;

import lombok.Data;

@Data
public class SupportStats {
    private Long totalTickets;
    private Long openTickets;
    private Long inProgressTickets;
    private Long waitingTickets;
    private Long resolvedTickets;
    private Long closedTickets;
    private Double avgResponseTime;
    private Double satisfactionRate;
}