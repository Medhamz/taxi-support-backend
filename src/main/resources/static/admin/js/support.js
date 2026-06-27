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
        case 'agents':
            loadAgentsPage();
            break;
        case 'categories':
            loadCategoriesPage();
            break;
        case 'quick-responses':
            loadQuickResponsesPage();
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

        document.getElementById('statTotal').textContent = stats.totalTickets || stats.total || 0;
        document.getElementById('statOpen').textContent = stats.openTickets || stats.open || 0;
        document.getElementById('statInProgress').textContent = stats.inProgressTickets || stats.inProgress || 0;
        document.getElementById('statResolved').textContent = stats.resolvedTickets || stats.resolved || 0;

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

    loadTicketList().then(() => {
        if (currentTicketId) {
            selectTicket(currentTicketId);
        }
    });
}

// ==================== CHARGEMENT DES TICKETS ====================
async function loadTicketList() {
    try {
        const data = await loadTickets();
        const container = document.getElementById('ticketList');
        if (!container) return;

        if (!data.content || data.content.length === 0) {
            container.innerHTML = `<div class="text-center text-secondary py-3"><i class="fas fa-inbox fa-2x mb-2 d-block"></i>Aucun ticket</div>`;
            return;
        }

        container.innerHTML = data.content.map(ticket => `
            <div class="ticket-item priority-${ticket.priority.toLowerCase()} ${ticket.id === currentTicketId ? 'border border-primary' : ''}"
                 data-ticket-id="${ticket.id}" onclick="selectTicket(${ticket.id})">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1 mt-1">${ticket.subject || 'Sans Sujet'}</h6>
                        <small class="text-secondary"><i class="fas fa-user"></i> ${ticket.userName || 'Anonyme'}</small>
                    </div>
                </div>
            </div>
        `).join('');

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

    // Démarrer le polling pour ce ticket
    startPolling(ticketId);
}

// ==================== CHARGEMENT DES MESSAGES API ====================
async function loadTicketMessages(ticketId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`);
        const ticket = await response.json();

        const header = document.getElementById('chatHeader');
        if (header) {
            header.innerHTML = `<h6>Ticket #${ticket.ticketNumber || ticket.id} - ${ticket.subject}</h6>`;
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

            // Mettre à jour lastMessageId pour le polling
            if (ticket.messages.length > 0) {
                lastMessageId = ticket.messages[ticket.messages.length - 1].id || 0;
            }

            container.innerHTML = ticket.messages.map(msg => {
                const isUser = msg.senderType === 'USER';
                return `
                    <div class="message ${isUser ? '' : 'user'}">
                        <div class="bubble">
                            ${!isUser ? `<small class="text-warning d-block mb-1">${msg.senderName || 'Agent Support'}</small>` : ''}
                            <p class="mb-0">${msg.content || msg.message}</p>
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

// ==================== POLLING POUR NOUVEAUX MESSAGES ====================
function startPolling(ticketId) {
    // Arrêter l'ancien polling
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }

    // Démarrer le nouveau polling (toutes les 2 secondes)
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
            // Nouveaux messages ! Les afficher
            const container = document.getElementById('chatContainer');
            if (container) {
                // Supprimer le message "Aucun message" s'il existe
                const emptyMsg = container.querySelector('.text-secondary');
                if (emptyMsg) emptyMsg.remove();

                // Ajouter les nouveaux messages
                const newMessages = ticket.messages.filter(msg => msg.id > lastMessageId);
                newMessages.forEach(msg => {
                    const isUser = msg.senderType === 'USER';
                    const div = document.createElement('div');
                    div.className = `message ${isUser ? '' : 'user'}`;
                    div.innerHTML = `
                        <div class="bubble">
                            ${!isUser ? `<small class="text-warning d-block mb-1">${msg.senderName || 'Agent Support'}</small>` : ''}
                            <p class="mb-0">${msg.content || msg.message}</p>
                            <div class="time">${new Date(msg.createdAt || Date.now()).toLocaleTimeString()}</div>
                        </div>
                    `;
                    container.appendChild(div);
                });
                container.scrollTop = container.scrollHeight;

                // Mettre à jour lastMessageId
                lastMessageId = lastMsg.id;
            }
        }
    } catch (error) {
        console.error('Erreur polling messages:', error);
    }
}

// ==================== ENVOYER UN MESSAGE ====================
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message || !currentTicketId) return;

    try {
        const chatMessage = {
            ticketId: currentTicketId,
            senderId: 1,
            senderType: 'AGENT',
            senderName: 'Support Agent',
            content: message,
            messageType: 'TEXT'
        };

        const response = await fetch(`${API_BASE_URL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chatMessage)
        });

        if (response.ok) {
            input.value = '';
            // Recharger les messages pour voir le nouveau message
            await loadTicketMessages(currentTicketId);
        } else {
            console.error('Erreur envoi message:', await response.text());
            alert('Erreur lors de l\'envoi du message');
        }
    } catch (error) {
        console.error('Erreur envoi message:', error);
        alert('Erreur de connexion');
    }
}

function refreshDashboard() { loadStats(); loadUrgentTickets(); }
function refreshMessages() {
    loadTicketList();
    if (currentTicketId) {
        loadTicketMessages(currentTicketId);
        // Redémarrer le polling
        startPolling(currentTicketId);
    }
}
function filterTickets(query) {
    document.querySelectorAll('.ticket-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
    });
}

// Exposé globalement
window.loadPage = loadPage;
window.selectTicket = selectTicket;
window.sendMessage = sendMessage;
window.refreshDashboard = refreshDashboard;
window.refreshMessages = refreshMessages;
window.filterTickets = filterTickets;
window.openTicket = openTicket;

// Nettoyer le polling quand on quitte la page
window.addEventListener('beforeunload', function() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});