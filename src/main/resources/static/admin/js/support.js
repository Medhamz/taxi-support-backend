// Configuration
const API_BASE_URL = 'https://taxi-support-backend.onrender.com/api/support';

let currentTicketId = null;
let pollingInterval = null;
let lastMessageId = 0;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    loadPage('dashboard');

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page) {
                loadPage(page);
                document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    loadStats();
});

// ==================== CHARGEMENT DES PAGES ====================
function loadPage(page) {
    const content = document.getElementById('mainContent');

    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'tickets':
            loadTicketsPage();
            break;
        case 'messages':
            loadMessagesPage();
            break;
        case 'settings':
            loadSettingsPage();
            break;
        default:
            loadDashboard();
            break;
    }
}

// ==================== DASHBOARD ====================
function loadDashboard() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="fas fa-chart-pie text-primary"></i> Dashboard Support</h2>
            <div>
                <button class="btn btn-primary" onclick="refreshDashboard()">
                    <i class="fas fa-sync-alt"></i> Rafraîchir
                </button>
            </div>
        </div>

        <div class="row g-3" id="statsRow">
            <div class="col-md-3 col-6">
                <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <small class="text-secondary">Total Tickets</small>
                            <h3 class="mb-0" id="statTotal">0</h3>
                        </div>
                        <div class="icon bg-primary bg-opacity-25 text-primary">
                            <i class="fas fa-ticket-alt"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-6">
                <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <small class="text-secondary">En Attente</small>
                            <h3 class="mb-0" id="statOpen">0</h3>
                        </div>
                        <div class="icon bg-warning bg-opacity-25 text-warning">
                            <i class="fas fa-clock"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-6">
                <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <small class="text-secondary">En Cours</small>
                            <h3 class="mb-0" id="statInProgress">0</h3>
                        </div>
                        <div class="icon bg-info bg-opacity-25 text-info">
                            <i class="fas fa-spinner"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-6">
                <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <small class="text-secondary">Résolus</small>
                            <h3 class="mb-0" id="statResolved">0</h3>
                        </div>
                        <div class="icon bg-success bg-opacity-25 text-success">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-12">
                <div class="ticket-list">
                    <h6 class="mb-3">
                        <i class="fas fa-exclamation-triangle text-danger"></i>
                        Tickets Urgents
                        <span class="badge bg-danger ms-2" id="urgentCount">0</span>
                    </h6>
                    <div id="urgentTickets">
                        <div class="text-center text-secondary">Chargement...</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    loadStats();
    loadUrgentTickets();
}

// ==================== STATISTIQUES ====================
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        const stats = await response.json();

        // Mettre à jour les chiffres dans le dashboard
        document.getElementById('statTotal').textContent = stats.totalTickets || 0;
        document.getElementById('statOpen').textContent = stats.openTickets || 0;
        document.getElementById('statInProgress').textContent = stats.inProgressTickets || 0;
        document.getElementById('statResolved').textContent = stats.resolvedTickets || 0;

        // ✅ BADGE "Tickets" : Affiche le nombre TOTAL de tickets
        const openCountBadge = document.getElementById('openCount');
        if (openCountBadge) {
            const totalTickets = stats.totalTickets || 0;
            openCountBadge.textContent = totalTickets;
            openCountBadge.style.display = 'inline-block';
        }

        // ✅ BADGE "Chat" : Affiche uniquement les tickets EN ATTENTE (WAITING)
        const unreadCountBadge = document.getElementById('unreadCount');
        if (unreadCountBadge) {
            const waitingTickets = stats.waitingTickets || 0;
            unreadCountBadge.textContent = waitingTickets;
            unreadCountBadge.style.display = 'inline-block';
        }

        console.log('📊 Stats mises à jour:', {
            total: stats.totalTickets,
            open: stats.openTickets,
            inProgress: stats.inProgressTickets,
            waiting: stats.waitingTickets,
            resolved: stats.resolvedTickets,
            closed: stats.closedTickets,
            chatCount: stats.waitingTickets || 0
        });

    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

// ==================== TICKETS URGENTS ====================
async function loadUrgentTickets() {
    try {
        const response = await fetch(`${API_BASE_URL}/tickets/urgent`);
        const tickets = await response.json();

        const container = document.getElementById('urgentTickets');
        const countEl = document.getElementById('urgentCount');

        if (countEl) countEl.textContent = tickets.length;

        if (!tickets || tickets.length === 0) {
            container.innerHTML = `
                <div class="text-center text-secondary py-3">
                    <i class="fas fa-check-circle fa-2x text-success mb-2 d-block"></i>
                    Aucun ticket urgent
                </div>
            `;
            return;
        }

        container.innerHTML = tickets.map(ticket => `
            <div class="ticket-item priority-${ticket.priority.toLowerCase()}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${ticket.subject}</h6>
                        <small class="text-secondary">
                            <i class="fas fa-user"></i> ${ticket.userName || 'Utilisateur'}
                            | ${ticket.category}
                            | ${new Date(ticket.createdAt).toLocaleString()}
                        </small>
                    </div>
                    <div>
                        <span class="badge badge-status ${ticket.status.toLowerCase()}">
                            ${getStatusLabel(ticket.status)}
                        </span>
                        <button class="btn btn-sm btn-primary ms-2" onclick="openTicket(${ticket.id})">
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erreur chargement tickets urgents:', error);
    }
}

// ==================== LISTE DES TICKETS ====================
async function loadTickets(filters = {}) {
    try {
        let url = `${API_BASE_URL}/tickets?page=0&size=50`;
        if (filters.status) url += `&status=${filters.status}`;
        if (filters.priority) url += `&priority=${filters.priority}`;
        if (filters.category) url += `&category=${filters.category}`;

        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('Erreur chargement tickets:', error);
        return { content: [] };
    }
}

function getStatusLabel(status) {
    const labels = { 'OPEN': 'Ouvert', 'IN_PROGRESS': 'En cours', 'WAITING': 'En attente', 'RESOLVED': 'Résolu', 'CLOSED': 'Fermé' };
    return labels[status] || status;
}

function getStatusBadgeClass(status) {
    const classes = {
        'OPEN': 'badge-open',
        'IN_PROGRESS': 'badge-in_progress',
        'WAITING': 'badge-waiting',
        'RESOLVED': 'badge-resolved',
        'CLOSED': 'badge-closed'
    };
    return classes[status] || 'badge-secondary';
}

// ==================== PAGE TICKETS ====================
function loadTicketsPage() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="fas fa-ticket-alt text-primary"></i> Tous les tickets</h2>
            <button class="btn btn-outline-primary" onclick="loadTicketsPage()">
                <i class="fas fa-sync-alt"></i> Rafraîchir
            </button>
        </div>

        <div class="card p-3 mb-3">
            <div class="row g-2">
                <div class="col-md-3">
                    <select class="form-control" id="filterStatus" onchange="applyFilters()">
                        <option value="">Tous les statuts</option>
                        <option value="OPEN">Ouvert</option>
                        <option value="IN_PROGRESS">En cours</option>
                        <option value="WAITING">En attente</option>
                        <option value="RESOLVED">Résolu</option>
                        <option value="CLOSED">Fermé</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <select class="form-control" id="filterPriority" onchange="applyFilters()">
                        <option value="">Toutes les priorités</option>
                        <option value="URGENT">Urgent</option>
                        <option value="HIGH">Élevée</option>
                        <option value="MEDIUM">Moyenne</option>
                        <option value="LOW">Basse</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="ticket-list">
            <div id="ticketListTable">
                <div class="text-center text-secondary">Chargement...</div>
            </div>
        </div>
    `;

    loadTicketListTable();
}

// ==================== TABLEAU DES TICKETS AVEC ACTIONS ====================
async function loadTicketListTable() {
    try {
        const status = document.getElementById('filterStatus')?.value;
        const priority = document.getElementById('filterPriority')?.value;

        const data = await loadTickets({ status, priority });
        const container = document.getElementById('ticketListTable');

        if (!container) return;

        if (!data.content || data.content.length === 0) {
            container.innerHTML = `<div class="text-center text-secondary py-3"><i class="fas fa-inbox fa-2x mb-2 d-block"></i>Aucun ticket</div>`;
            return;
        }

        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Sujet</th>
                        <th>Utilisateur</th>
                        <th>Catégorie</th>
                        <th>Statut</th>
                        <th>Priorité</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.content.map(ticket => `
                        <tr>
                            <td>${ticket.ticketNumber || ticket.id}</td>
                            <td>${ticket.subject || 'Sans sujet'}</td>
                            <td>${ticket.userName || 'Anonyme'}</td>
                            <td>${ticket.category || 'GENERAL'}</td>
                            <td>
                                <select class="form-select form-select-sm status-select" data-ticket-id="${ticket.id}" style="background:#141833; color:#fff; border-color:rgba(255,255,255,0.1);">
                                    <option value="OPEN" ${ticket.status === 'OPEN' ? 'selected' : ''}>Ouvert</option>
                                    <option value="IN_PROGRESS" ${ticket.status === 'IN_PROGRESS' ? 'selected' : ''}>En cours</option>
                                    <option value="WAITING" ${ticket.status === 'WAITING' ? 'selected' : ''}>En attente</option>
                                    <option value="RESOLVED" ${ticket.status === 'RESOLVED' ? 'selected' : ''}>Résolu</option>
                                    <option value="CLOSED" ${ticket.status === 'CLOSED' ? 'selected' : ''}>Fermé</option>
                                </select>
                            </td>
                            <td>
                                <select class="form-select form-select-sm priority-select" data-ticket-id="${ticket.id}" style="background:#141833; color:#fff; border-color:rgba(255,255,255,0.1);">
                                    <option value="LOW" ${ticket.priority === 'LOW' ? 'selected' : ''}>Basse</option>
                                    <option value="MEDIUM" ${ticket.priority === 'MEDIUM' ? 'selected' : ''}>Moyenne</option>
                                    <option value="HIGH" ${ticket.priority === 'HIGH' ? 'selected' : ''}>Haute</option>
                                    <option value="URGENT" ${ticket.priority === 'URGENT' ? 'selected' : ''}>Urgent</option>
                                </select>
                            </td>
                            <td>${new Date(ticket.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-sm btn-success me-1" onclick="openTicket(${ticket.id})" title="Voir les messages">
                                    <i class="fas fa-comment"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteTicket(${ticket.id})" title="Supprimer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', function() {
                const ticketId = this.dataset.ticketId;
                const newStatus = this.value;
                updateTicketStatus(ticketId, newStatus);
            });
        });

        document.querySelectorAll('.priority-select').forEach(select => {
            select.addEventListener('change', function() {
                const ticketId = this.dataset.ticketId;
                const newPriority = this.value;
                updateTicketPriority(ticketId, newPriority);
            });
        });

    } catch (error) {
        console.error('Erreur chargement tickets:', error);
    }
}

// ==================== GESTION DES TICKETS ====================

async function deleteTicket(ticketId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Ticket supprimé avec succès', 'success');
            loadTicketListTable();
            loadStats();
        } else {
            const errorText = await response.text();
            showNotification('Erreur lors de la suppression: ' + errorText, 'danger');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion lors de la suppression', 'danger');
    }
}

async function updateTicketStatus(ticketId, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status-simple?status=${status}`, {
            method: 'PATCH'
        });

        if (response.ok) {
            showNotification(`Statut mis à jour vers ${getStatusLabel(status)}`, 'success');
            loadTicketListTable();
            loadStats();
            loadUrgentTickets();
        } else {
            const errorText = await response.text();
            showNotification('Erreur lors de la mise à jour du statut: ' + errorText, 'danger');
            loadTicketListTable();
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion lors de la mise à jour', 'danger');
        loadTicketListTable();
    }
}

async function updateTicketPriority(ticketId, priority) {
    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/priority?priority=${priority}`, {
            method: 'PATCH'
        });

        if (response.ok) {
            showNotification(`Priorité mise à jour vers ${priority}`, 'success');
            loadTicketListTable();
            loadUrgentTickets();
        } else {
            const errorText = await response.text();
            showNotification('Erreur lors de la mise à jour de la priorité: ' + errorText, 'danger');
            loadTicketListTable();
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de connexion lors de la mise à jour', 'danger');
        loadTicketListTable();
    }
}

function showNotification(message, type = 'info') {
    const colors = {
        'success': '#2ED573',
        'danger': '#FF4757',
        'warning': '#FFA502',
        'info': '#6C63FF'
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #141833;
        color: #fff;
        padding: 15px 25px;
        border-radius: 10px;
        border-left: 4px solid ${colors[type] || '#6C63FF'};
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        z-index: 9999;
        max-width: 400px;
        animation: slideIn 0.3s ease;
        font-size: 14px;
    `;
    notification.innerHTML = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

function applyFilters() {
    loadTicketListTable();
}

// ==================== OUVERTURE D'UN TICKET ====================
function openTicket(ticketId) {
    currentTicketId = ticketId;
    loadPage('messages');
}

// ==================== MESSAGES / CHAT ====================
function loadMessagesPage() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="fas fa-comments text-primary"></i> Messages</h2>
            <div>
                <button class="btn btn-outline-primary me-2" onclick="refreshMessages()">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </div>

        <div class="row g-3">
            <div class="col-md-4">
                <div class="ticket-list">
                    <h6 class="mb-3"><i class="fas fa-list"></i> Tickets actifs</h6>
                    <div class="mb-3">
                        <input type="text" class="form-control" placeholder="Rechercher..." id="ticketSearch" onkeyup="filterTickets(this.value)">
                    </div>
                    <div id="ticketList" style="max-height: 500px; overflow-y: auto;">
                        <div class="text-center text-secondary">Chargement...</div>
                    </div>
                </div>
            </div>

            <div class="col-md-8">
                <div class="ticket-list">
                    <div id="chatHeader" class="mb-3">
                        <h6 class="mb-1"><i class="fas fa-comment-dots text-primary"></i> Sélectionnez un ticket</h6>
                        <small class="text-secondary">Choisissez un ticket dans la liste pour commencer</small>
                    </div>

                    <div id="chatContainer" class="chat-container" style="display: none; height: 350px; overflow-y: auto;">
                        <!-- Messages -->
                    </div>

                    <div id="chatInput" style="display: none;" class="mt-3">
                        <div class="d-flex gap-2">
                            <input type="text" class="form-control" id="messageInput" placeholder="Écrivez votre message..."
                                   onkeypress="if(event.key==='Enter' && !event.shiftKey){sendMessage();event.preventDefault();}">
                            <button class="btn btn-primary" onclick="sendMessage()">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    loadTicketListChat().then(() => {
        if (currentTicketId) {
            selectTicket(currentTicketId);
        }
    });
}

// ==================== CHARGEMENT DES TICKETS POUR LE CHAT (AVEC DIFFÉRENCIATION) ====================
async function loadTicketListChat() {
    try {
        const data = await loadTickets();
        const container = document.getElementById('ticketList');
        if (!container) return;

        if (!data.content || data.content.length === 0) {
            container.innerHTML = `<div class="text-center text-secondary py-3"><i class="fas fa-inbox fa-2x mb-2 d-block"></i>Aucun ticket</div>`;
            return;
        }

        // ✅ Affichage des tickets avec différenciation pour les tickets résolus
        container.innerHTML = data.content.map(ticket => {
            const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
            const statusLabel = getStatusLabel(ticket.status);
            const statusBadgeClass = getStatusBadgeClass(ticket.status);

            return `
                <div class="ticket-item priority-${ticket.priority.toLowerCase()} ${ticket.id === currentTicketId ? 'border border-primary' : ''} ${isResolved ? 'ticket-resolved' : ''}"
                     data-ticket-id="${ticket.id}" onclick="selectTicket(${ticket.id})">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="mb-1 mt-1">
                                ${ticket.subject || 'Sans Sujet'}
                                ${isResolved ? ' <i class="fas fa-check-circle text-success" title="Ticket résolu"></i>' : ''}
                            </h6>
                            <small class="text-secondary">
                                <i class="fas fa-user"></i> ${ticket.userName || 'Anonyme'}
                                <span class="badge ${statusBadgeClass} ms-2">${statusLabel}</span>
                            </small>
                        </div>
                        ${isResolved ? '<span class="badge bg-success ms-2"><i class="fas fa-check"></i> Résolu</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Ajouter un séparateur ou un titre pour les tickets résolus si nécessaire
        // On peut aussi filtrer pour ne montrer que les tickets non résolus

    } catch (error) {
        console.error('Erreur chargement liste tickets:', error);
    }
}

// ==================== SÉLECTION D'UN TICKET ====================
function selectTicket(ticketId) {
    currentTicketId = ticketId;
    loadTicketMessages(ticketId);

    document.querySelectorAll('.ticket-item').forEach(el => el.classList.remove('border', 'border-primary'));
    const activeItem = document.querySelector(`.ticket-item[data-ticket-id="${ticketId}"]`);
    if (activeItem) activeItem.classList.add('border', 'border-primary');

    startPolling(ticketId);
}

// ==================== CHARGEMENT DES MESSAGES ====================
async function loadTicketMessages(ticketId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`);
        const ticket = await response.json();

        const header = document.getElementById('chatHeader');
        if (header) {
            const statusLabel = getStatusLabel(ticket.status);
            const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
            header.innerHTML = `
                <h6>Ticket #${ticket.ticketNumber || ticket.id} - ${ticket.subject}</h6>
                <small class="text-secondary">
                    ${ticket.userName || 'Utilisateur'}
                    <span class="badge ${getStatusBadgeClass(ticket.status)} ms-2">${statusLabel}</span>
                    ${isResolved ? ' <span class="badge bg-success"><i class="fas fa-check"></i> Terminé</span>' : ''}
                </small>
            `;
        }

        const container = document.getElementById('chatContainer');
        const input = document.getElementById('chatInput');

        if (container && input) {
            container.style.display = 'block';
            input.style.display = 'block';

            if (!ticket.messages || ticket.messages.length === 0) {
                container.innerHTML = `<div class="text-center text-secondary py-5"><p>Aucun message. Commencez la conversation !</p></div>`;
                return;
            }

            if (ticket.messages.length > 0) {
                lastMessageId = ticket.messages[ticket.messages.length - 1].id || 0;
            }

            container.innerHTML = ticket.messages.map(msg => {
                const isUser = msg.senderType === 'USER';
                return `
                    <div class="message ${isUser ? '' : 'user'}">
                        <div class="bubble">
                            ${isUser ? `<small class="text-info d-block mb-1">${msg.senderName || 'Client'}</small>` : ''}
                            <p class="mb-0">${msg.message || msg.content || 'Message'}</p>
                            <div class="time">${new Date(msg.createdAt || Date.now()).toLocaleTimeString()}</div>
                        </div>
                    </div>
                `;
            }).join('');
            container.scrollTop = container.scrollHeight;
        }
    } catch (error) {
        console.error('Erreur chargement messages:', error);
    }
}

// ==================== POLLING ====================
function startPolling(ticketId) {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }

    pollingInterval = setInterval(() => {
        checkNewMessages(ticketId);
    }, 2000);
}

async function checkNewMessages(ticketId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`);
        const ticket = await response.json();

        if (!ticket.messages || ticket.messages.length === 0) return;

        const lastMsg = ticket.messages[ticket.messages.length - 1];
        if (lastMsg.id > lastMessageId) {
            const container = document.getElementById('chatContainer');
            if (container) {
                const emptyMsg = container.querySelector('.text-secondary');
                if (emptyMsg) emptyMsg.remove();

                const newMessages = ticket.messages.filter(msg => msg.id > lastMessageId);
                newMessages.forEach(msg => {
                    const isUser = msg.senderType === 'USER';
                    const div = document.createElement('div');
                    div.className = `message ${isUser ? '' : 'user'}`;
                    div.innerHTML = `
                        <div class="bubble">
                            ${isUser ? `<small class="text-info d-block mb-1">${msg.senderName || 'Client'}</small>` : ''}
                            <p class="mb-0">${msg.message || msg.content || 'Message'}</p>
                            <div class="time">${new Date(msg.createdAt || Date.now()).toLocaleTimeString()}</div>
                        </div>
                    `;
                    container.appendChild(div);
                });
                container.scrollTop = container.scrollHeight;
                lastMessageId = lastMsg.id;
            }
        }
    } catch (error) {
        console.error('Erreur polling:', error);
    }
}

// ==================== ENVOYER UN MESSAGE ====================
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message || !currentTicketId) {
        alert('Veuillez écrire un message');
        return;
    }

    try {
        const messageRequest = {
            message: message,
            senderId: 999,
            senderType: 'AGENT',
            senderName: 'Admin Support',
            messageType: 'TEXT'
        };

        console.log('📤 Envoi du message:', messageRequest);

        const response = await fetch(`${API_BASE_URL}/tickets/${currentTicketId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageRequest)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Message envoyé:', result);
            input.value = '';
            await loadTicketMessages(currentTicketId);
        } else {
            const errorText = await response.text();
            console.error('❌ Erreur envoi message:', errorText);
            alert('Erreur lors de l\'envoi du message: ' + errorText);
        }
    } catch (error) {
        console.error('❌ Erreur envoi message:', error);
        alert('Erreur de connexion: ' + error.message);
    }
}

// ==================== PARAMÈTRES ====================
function loadSettingsPage() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <h2><i class="fas fa-cog text-primary"></i> Paramètres</h2>
        <div class="card p-4 mt-3">
            <h5>Configuration du support</h5>
            <p class="text-secondary">API Base URL: ${API_BASE_URL}</p>
            <hr>
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="autoRefresh" checked>
                <label class="form-check-label" for="autoRefresh">Auto-raffraîchissement (polling 2s)</label>
            </div>
            <button class="btn btn-primary mt-3" onclick="refreshDashboard()">
                <i class="fas fa-sync-alt"></i> Forcer le rafraîchissement
            </button>
        </div>
    `;
}

// ==================== FONCTIONS UTILITAIRES ====================
function refreshDashboard() {
    loadStats();
    loadUrgentTickets();
    loadTicketListTable();
}

function refreshMessages() {
    loadTicketListChat();
    if (currentTicketId) {
        loadTicketMessages(currentTicketId);
        startPolling(currentTicketId);
    }
}

function filterTickets(query) {
    document.querySelectorAll('.ticket-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
    });
}

// ==================== EXPOSITION GLOBALE ====================
window.loadPage = loadPage;
window.selectTicket = selectTicket;
window.sendMessage = sendMessage;
window.refreshDashboard = refreshDashboard;
window.refreshMessages = refreshMessages;
window.filterTickets = filterTickets;
window.openTicket = openTicket;
window.applyFilters = applyFilters;
window.loadTicketsPage = loadTicketsPage;
window.deleteTicket = deleteTicket;
window.updateTicketStatus = updateTicketStatus;
window.updateTicketPriority = updateTicketPriority;

// Nettoyer le polling quand on quitte la page
window.addEventListener('beforeunload', function() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});