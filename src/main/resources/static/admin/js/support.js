// Configuration
const API_BASE_URL = 'https://abdil-taxi-backend.onrender.com/api/support';
const WS_URL = 'https://abdil-taxi-backend.onrender.com/ws-support';

let stompClient = null;
let currentTicketId = null;
let currentUserId = null;
let currentUserType = 'AGENT';
let isConnected = false;

// Variables pour mémoriser les abonnements et éviter les doublons
let messageSubscription = null;
let typingSubscription = null;

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

    // Connect WebSocket
    connectWebSocket();

    // Charger les stats
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

        <!-- Statistiques -->
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

        <!-- Graphiques -->
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="ticket-list">
                    <h6 class="mb-3"><i class="fas fa-chart-bar text-primary"></i> Tickets par Catégorie</h6>
                    <canvas id="categoryChart" height="200"></canvas>
                </div>
            </div>
            <div class="col-md-6">
                <div class="ticket-list">
                    <h6 class="mb-3"><i class="fas fa-chart-line text-primary"></i> Évolution des Tickets</h6>
                    <canvas id="trendChart" height="200"></canvas>
                </div>
            </div>
        </div>

        <!-- Tickets Urgents -->
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
    loadCharts();
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

        const countBadge = document.getElementById('openTicketsCount');
        if (countBadge) countBadge.textContent = stats.openTickets || stats.open || 0;

    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

// ==================== GRAPHIQUES ====================
function loadCharts() {
    const ctx1 = document.getElementById('categoryChart');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Paiement', 'Course', 'Compte', 'Technique', 'Chauffeur', 'Autre'],
                datasets: [{
                    data: [12, 19, 8, 15, 7, 5],
                    backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } } }
        });
    }

    const ctx2 = document.getElementById('trendChart');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                datasets: [{
                    label: 'Nouveaux tickets',
                    data: [5, 8, 6, 12, 15, 7, 4],
                    borderColor: '#6C63FF',
                    backgroundColor: 'rgba(108, 99, 255, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: '#fff' } } },
                scales: { y: { ticks: { color: '#a0aec0' } }, x: { ticks: { color: '#a0aec0' } } }
            }
        });
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

                    <div id="typingIndicator" class="typing-indicator mt-2" style="display: none;">
                        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                        <span class="ms-2 text-secondary" id="typingText">L'utilisateur écrit...</span>
                    </div>

                    <div id="chatInput" style="display: none;" class="mt-3">
                        <div class="d-flex gap-2">
                            <input type="text" class="form-control" id="messageInput" placeholder="Écrivez votre message..."
                                   onkeyup="sendTypingIndicator()"
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

    subscribeToTicketChannel(ticketId);
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

            container.innerHTML = ticket.messages.map(msg => {
                const isUser = msg.senderType === 'USER';
                return `
                    <div class="message ${isUser ? '' : 'user'}">
                        <div class="bubble">
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

// ==================== ENVOYER UN MESSAGE VIA WEBSOCKET ====================
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message || !currentTicketId || !isConnected) return;

    const chatMessage = {
        ticketId: currentTicketId,
        senderId: 1,
        senderType: 'AGENT',
        senderName: 'Support Agent',
        content: message,
        messageType: 'TEXT'
    };

    stompClient.send('/app/chat.sendMessage', {}, JSON.stringify(chatMessage));
    input.value = '';
}

// ==================== WEB SOCKET - SYSTEM ====================
function connectWebSocket() {
    try {
        const socket = new SockJS(WS_URL);
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function(frame) {
            console.log('✅ WebSocket connecté au Tableau de Bord !');
            isConnected = true;

            if (currentTicketId) {
                subscribeToTicketChannel(currentTicketId);
            }
        }, function(error) {
            console.error('❌ Erreur WebSocket:', error);
            isConnected = false;
            setTimeout(connectWebSocket, 5000);
        });

    } catch (error) {
        console.error('Erreur initialisation SockJS:', error);
    }
}

function subscribeToTicketChannel(ticketId) {
    if (!stompClient || !isConnected) return;

    if (messageSubscription) messageSubscription.unsubscribe();
    if (typingSubscription) typingSubscription.unsubscribe();

    messageSubscription = stompClient.subscribe('/topic/ticket/' + ticketId, function(response) {
        const msg = JSON.parse(response.body);
        const container = document.getElementById('chatContainer');
        if (container && currentTicketId === msg.ticketId) {

            const emptyText = container.querySelector('.text-secondary');
            if (emptyText) emptyText.remove();

            const isUser = msg.senderType === 'USER';
            const div = document.createElement('div');
            // Côté Agent (support.js), les messages de l'user (client) vont à gauche (classe message seule)
            // et ceux de l'agent vont à droite (classe message user)
            div.className = `message ${isUser ? '' : 'user'}`;
            div.innerHTML = `
                <div class="bubble">
                    <p class="mb-0">${msg.content || msg.message}</p>
                    <div class="time">${new Date().toLocaleTimeString()}</div>
                </div>
            `;
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }
    });

    typingSubscription = stompClient.subscribe('/topic/ticket/' + ticketId + '/typing', function(response) {
        const data = JSON.parse(response.body);
        if (data.senderType === 'USER') {
            showTypingIndicator(data.userName || 'L\'utilisateur');
        }
    });
}

// ==================== INDICATEUR DE FRAPPE ====================
let typingTimeout = null;
function sendTypingIndicator() {
    if (stompClient && isConnected && currentTicketId) {
        stompClient.send('/app/chat.typing', {}, JSON.stringify({
            ticketId: currentTicketId,
            userName: 'Agent Support',
            senderType: 'AGENT'
        }));
    }
}

function showTypingIndicator(userName) {
    const indicator = document.getElementById('typingIndicator');
    const text = document.getElementById('typingText');
    if (indicator && text) {
        text.textContent = `${userName} écrit...`;
        indicator.style.display = 'block';

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            indicator.style.display = 'none';
        }, 2500);
    }
}

function refreshDashboard() { loadStats(); loadUrgentTickets(); }
function refreshMessages() { loadTicketList(); if (currentTicketId) loadTicketMessages(currentTicketId); }
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
window.sendTypingIndicator = sendTypingIndicator;