package com.abdil.support.model;

public enum TicketCategory {
    PAYMENT("💰 Paiement"),
    RIDE("🚗 Course"),
    ACCOUNT("👤 Compte"),
    TECHNICAL("🔧 Technique"),
    DRIVER("🚖 Chauffeur"),
    OTHER("📝 Autre");

    private final String label;

    TicketCategory(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static TicketCategory fromString(String category) {
        for (TicketCategory c : TicketCategory.values()) {
            if (c.name().equalsIgnoreCase(category)) {
                return c;
            }
        }
        return OTHER;
    }
}