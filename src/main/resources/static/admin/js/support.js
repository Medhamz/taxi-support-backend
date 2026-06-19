// Configuration
const API_BASE_URL = 'https://abdil-taxi-backend.onrender.com/api/support';
const WS_URL = 'wss://abdil-taxi-backend.onrender.com/ws-support';

let stompClient = null;
let currentTicketId = null;
let currentUserId = null;
let currentUserType = 'AGENT';

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
    loadTickets();
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

        document.getElementById('statTotal').textContent = stats.total || 0;
        document.getElementById('statOpen').textContent = stats.open || 0;
        document.getElementById('statInProgress').textContent = stats.inProgress || 0;
        document.getElementById('statResolved').textContent = stats.resolved || 0;
        document.getElementById('openTicketsCount').textContent = stats.open || 0;

    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

// ==================== GRAPHIQUES ====================
function loadCharts() {
    // Graphique catégories
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
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#fff' } }
                }
            }
        });
    }

    // Graphique tendance
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
                plugins: {
                    legend: { labels: { color: '#fff' } }
                },
                scales: {
                    y: { ticks: { color: '#a0aec0' } },
                    x: { ticks: { color: '#a0aec0' } }
                }
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
        const data = await response.json();

        return data;
    } catch (error) {
        console.error('Erreur chargement tickets:', error);
        return { content: [] };
    }
}

function getStatusLabel(status) {
    const labels = {
        'OPEN': 'Ouvert',
        'IN_PROGRESS': 'En cours',
        'WAITING': 'En attente',
        'RESOLVED': 'Résolu',
        'CLOSED': 'Fermé'
    };
    return labels[status] || status;
}

function getPriorityLabel(priority) {
    const labels = {
        'LOW': 'Basse',
        'MEDIUM': 'Moyenne',
        'HIGH': 'Élevée',
        'URGENT': 'Urgente'
    };
    return labels[priority] || priority;
}

// ==================== OUVERTURE D'UN TICKET ====================
function openTicket(ticketId) {
    currentTicketId = ticketId;
    loadPage('messages');
    loadTicketMessages(ticketId);
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
                <button class="btn btn-primary" onclick="openNewTicket()">
                    <i class="fas fa-plus"></i> Nouveau Ticket
                </button>
            </div>
        </div>

        <div class="row g-3">
            <!-- Liste des tickets -->
            <div class="col-md-4">
                <div class="ticket-list">
                    <h6 class="mb-3"><i class="fas fa-list"></i> Tickets</h6>
                    <div class="mb-3">
                        <input type="text" class="form-control" placeholder="Rechercher..."
                               id="ticketSearch" onkeyup="filterTickets(this.value)">
                    </div>
                    <div id="ticketList" style="max-height: 500px; overflow-y: auto;">
                        <div class="text-center text-secondary">Chargement...</div>
                    </div>
                </div>
            </div>

            <!-- Zone de chat -->
            <div class="col-md-8">
                <div class="ticket-list">
                    <div id="chatHeader" class="mb-3">
                        <h6 class="mb-1"><i class="fas fa-comment-dots text-primary"></i> Sélectionnez un ticket</h6>
                        <small class="text-secondary">Choisissez un ticket dans la liste pour commencer</small>
                    </div>

                    <div id="chatContainer" class="chat-container" style="display: none;">
                        <!-- Messages -->
                    </div>

                    <div id="typingIndicator" class="typing-indicator mt-2">
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="ms-2 text-secondary" id="typingText">L'agent écrit...</span>
                    </div>

                    <div id="chatInput" style="display: none;" class="mt-3">
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-secondary" onclick="openVoiceRecorder()">
                                <i class="fas fa-microphone"></i>
                            </button>
                            <button class="btn btn-outline-secondary" onclick="openFileSelector()">
                                <i class="fas fa-paperclip"></i>
                            </button>
                            <input type="file" id="fileInput" style="display: none;" accept="image/*,application/pdf" multiple>
                            <textarea class="form-control" id="messageInput" rows="2"
                                      placeholder="Écrivez votre message..."
                                      onkeypress="if(event.key==='Enter' && !event.shiftKey){sendMessage();event.preventDefault();}"></textarea>
                            <button class="btn btn-primary" onclick="sendMessage()">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>

                        <div id="quickResponses" class="mt-2">
                            <small class="text-secondary">Réponses rapides:</small>
                            <div id="quickResponseButtons" class="d-flex flex-wrap gap-1 mt-1">
                                <!-- Chargé dynamiquement -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    loadTicketList();
    loadQuickResponses();
}

// ==================== CHARGEMENT DES TICKETS ====================
async function loadTicketList() {
    try {
        const data = await loadTickets();
        const container = document.getElementById('ticketList');

        if (!data.content || data.content.length === 0) {
            container.innerHTML = `
                <div class="text-center text-secondary py-3">
                    <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                    Aucun ticket
                </div>
            `;
            return;
        }

        container.innerHTML = data.content.map(ticket => `
            <div class="ticket-item priority-${ticket.priority.toLowerCase()}
                        ${ticket.id === currentTicketId ? 'border border-primary' : ''}"
                 onclick="selectTicket(${ticket.id})">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge badge-status ${ticket.status.toLowerCase()}">${getStatusLabel(ticket.status)}</span>
                            <small class="text-secondary">#${ticket.ticketNumber}</small>
                        </div>
                        <h6 class="mb-1 mt-1">${ticket.subject}</h6>
                        <small class="text-secondary">
                            <i class="fas fa-user"></i> ${ticket.userName || 'Utilisateur'}
                            | ${ticket.category}
                        </small>
                    </div>
                    <div class="text-end">
                        <small class="text-secondary">${new Date(ticket.createdAt).toLocaleDateString()}</small>
                        ${ticket.unreadCount > 0 ? `
                            <span class="badge bg-danger d-block mt-1">${ticket.unreadCount}</span>
                        ` : ''}
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

    // Mettre à jour la liste
    document.querySelectorAll('.ticket-item').forEach(el => {
        el.classList.remove('border', 'border-primary');
    });

    // Mettre en évidence le ticket sélectionné
    const items = document.querySelectorAll('.ticket-item');
    items.forEach(el => {
        if (el.dataset.ticketId == ticketId) {
            el.classList.add('border', 'border-primary');
        }
    });
}

// ==================== CHARGEMENT DES MESSAGES ====================
async function loadTicketMessages(ticketId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`);
        const ticket = await response.json();

        // Mettre à jour l'en-tête
        const header = document.getElementById('chatHeader');
        header.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">
                        <i class="fas fa-comment-dots text-primary"></i>
                        Ticket #${ticket.ticketNumber}
                        <span class="badge badge-status ${ticket.status.toLowerCase()} ms-2">
                            ${getStatusLabel(ticket.status)}
                        </span>
                    </h6>
                    <small class="text-secondary">
                        ${ticket.userName || 'Utilisateur'}
                        ${ticket.userEmail ? `· ${ticket.userEmail}` : ''}
                        ${ticket.userPhone ? `· ${ticket.userPhone}` : ''}
                    </small>
                </div>
                <div>
                    <select class="form-select form-select-sm" onchange="updateTicketStatus(${ticketId}, this.value)">
                        <option value="OPEN" ${ticket.status === 'OPEN' ? 'selected' : ''}>Ouvert</option>
                        <option value="IN_PROGRESS" ${ticket.status === 'IN_PROGRESS' ? 'selected' : ''}>En cours</option>
                        <option value="WAITING" ${ticket.status === 'WAITING' ? 'selected' : ''}>En attente</option>
                        <option value="RESOLVED" ${ticket.status === 'RESOLVED' ? 'selected' : ''}>Résolu</option>
                        <option value="CLOSED" ${ticket.status === 'CLOSED' ? 'selected' : ''}>Fermé</option>
                    </select>
                </div>
            </div>
        `;

        // Afficher les messages
        const container = document.getElementById('chatContainer');
        const input = document.getElementById('chatInput');

        container.style.display = 'block';
        input.style.display = 'block';

        if (!ticket.messages || ticket.messages.length === 0) {
            container.innerHTML = `
                <div class="text-center text-secondary py-5">
                    <i class="fas fa-comment fa-3x mb-3 d-block opacity-25"></i>
                    <p>Aucun message. Commencez la conversation !</p>
                </div>
            `;
            return;
        }

        container.innerHTML = ticket.messages.map(msg => {
            const isUser = msg.senderType === 'USER';

            let content = '';
            if (msg.messageType === 'TEXT') {
                content = `<p class="mb-0">${msg.message}</p>`;
            } else if (msg.messageType === 'VOICE') {
                content = `
                    <div class="voice-message">
                        <button class="play-btn" onclick="playVoice('${msg.attachmentUrl}')">
                            <i class="fas fa-play"></i>
                        </button>
                        <div>
                            <div>🎤 Message vocal</div>
                            <small class="text-secondary">${msg.duration || 0}s</small>
                            ${msg.attachmentName ? `<br><small>${msg.attachmentName}</small>` : ''}
                        </div>
                        <audio src="${msg.attachmentUrl}" style="display: none;"></audio>
                    </div>
                `;
            } else if (msg.messageType === 'IMAGE' || msg.messageType === 'FILE') {
                const isImage = msg.attachmentUrl &&
                    (msg.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)/i));
                content = `
                    <div>
                        ${isImage ? `
                            <img src="${msg.attachmentUrl}" class="attachment-preview"
                                 onclick="window.open('${msg.attachmentUrl}')">
                        ` : `
                            <a href="${msg.attachmentUrl}" target="_blank" class="text-primary">
                                <i class="fas fa-file"></i> ${msg.attachmentName || 'Pièce jointe'}
                            </a>
                        `}
                        ${msg.message ? `<p class="mb-0 mt-1">${msg.message}</p>` : ''}
                    </div>
                `;
            }

            return `
                <div class="message ${isUser ? 'user' : ''}">
                    <div class="bubble">
                        ${isUser ? '' : `<small class="text-secondary d-block mb-1">${msg.senderName || 'Agent'}</small>`}
                        ${content}
                        <div class="time">
                            ${new Date(msg.createdAt).toLocaleTimeString()}
                            ${msg.isRead ? '· ✅ Lu' : '· 📨 Non lu'}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Scroll en bas
        container.scrollTop = container.scrollHeight;

        // Marquer comme lu
        markMessagesAsRead(ticketId);

        // Charger les réponses rapides
        loadQuickResponses();

    } catch (error) {
        console.error('Erreur chargement messages:', error);
        alert('Erreur lors du chargement des messages');
    }
}

// ==================== ENVOYER UN MESSAGE ====================
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message || !currentTicketId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${currentTicketId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticketId: currentTicketId,
                senderId: 1, // ID de l'agent
                senderType: 'AGENT',
                senderName: 'Support Agent',
                message: message
            })
        });

        if (response.ok) {
            input.value = '';
            loadTicketMessages(currentTicketId);
        } else {
            alert('Erreur lors de l\'envoi du message');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur réseau');
    }
}

// ==================== MESSAGES VOCAUX ====================
function openVoiceRecorder() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Votre navigateur ne supporte pas l\'enregistrement audio');
        return;
    }

    if (confirm('🎤 Enregistrer un message vocal ?')) {
        // Simuler un enregistrement
        alert('🎙️ Enregistrement démarré... (dans la vraie version, utilisez MediaRecorder API)');

        // Simulation pour démonstration
        setTimeout(() => {
            if (confirm('Arrêter l\'enregistrement ?')) {
                // Envoyer le fichier audio
                const fakeBlob = new Blob(['audio data'], { type: 'audio/mp3' });
                const fakeFile = new File([fakeBlob], 'voice.mp3', { type: 'audio/mp3' });
                sendVoiceMessage(fakeFile, 10);
            }
        }, 3000);
    }
}

async function sendVoiceMessage(file, duration) {
    if (!currentTicketId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('duration', duration);
    formData.append('senderId', 1);
    formData.append('senderType', 'AGENT');

    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${currentTicketId}/voice`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            loadTicketMessages(currentTicketId);
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// ==================== PIÈCES JOINTES ====================
function openFileSelector() {
    document.getElementById('fileInput').click();
}

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            if (this.files.length > 0) {
                sendAttachments(this.files);
                this.value = '';
            }
        });
    }
});

async function sendAttachments(files) {
    if (!currentTicketId) return;

    for (let file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('senderId', 1);
        formData.append('senderType', 'AGENT');

        try {
            const response = await fetch(`${API_BASE_URL}/tickets/${currentTicketId}/attachments`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                loadTicketMessages(currentTicketId);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }
}

// ==================== WEB SOCKET - CHAT EN TEMPS RÉEL ====================
function connectWebSocket() {
    try {
        const socket = new SockJS(WS_URL);
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function(frame) {
            console.log('WebSocket connecté');

            // S'abonner aux nouveaux messages
            stompClient.subscribe('/user/queue/messages', function(message) {
                const data = JSON.parse(message.body);
                console.log('Nouveau message:', data);

                // Recharger les messages si le ticket est ouvert
                if (data.ticketId === currentTicketId) {
                    loadTicketMessages(currentTicketId);
                } else {
                    // Mettre à jour la liste des tickets
                    loadTicketList();
                }
            });

            // S'abonner aux statuts de tickets
            stompClient.subscribe('/topic/ticket/status', function(message) {
                const data = JSON.parse(message.body);
                console.log('Statut mis à jour:', data);
                loadTicketList();
                loadStats();
            });

            // S'abonner aux indicateurs de frappe
            stompClient.subscribe('/topic/typing', function(message) {
                const data = JSON.parse(message.body);
                if (data.ticketId === currentTicketId && data.userId !== 1) {
                    showTypingIndicator(data.userName);
                }
            });

        }, function(error) {
            console.error('Erreur WebSocket:', error);
            // Tentative de reconnexion après 5 secondes
            setTimeout(connectWebSocket, 5000);
        });

    } catch (error) {
        console.error('Erreur WebSocket:', error);
    }
}

// ==================== INDICATEUR DE FRAPE ====================
let typingTimeout = null;

function sendTypingIndicator() {
    if (stompClient && currentTicketId) {
        stompClient.send('/app/chat.typing', {}, JSON.stringify({
            ticketId: currentTicketId,
            userId: 1,
            userName: 'Agent Support',
            isTyping: true
        }));

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            stompClient.send('/app/chat.typing', {}, JSON.stringify({
                ticketId: currentTicketId,
                userId: 1,
                isTyping: false
            }));
        }, 2000);
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
        }, 3000);
    }
}

// ==================== MARQUER COMME LU ====================
async function markMessagesAsRead(ticketId) {
    try {
        await fetch(`${API_BASE_URL}/tickets/${ticketId}/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 1 })
        });
    } catch (error) {
        console.error('Erreur marquage lu:', error);
    }
}

// ==================== RÉPONSES RAPIDES ====================
async function loadQuickResponses() {
    try {
        const response = await fetch(`${API_BASE_URL}/quick-responses`);
        const responses = await response.json();

        const container = document.getElementById('quickResponseButtons');
        if (!container) return;

        if (!responses || responses.length === 0) {
            container.innerHTML = '<small class="text-secondary">Aucune réponse rapide</small>';
            return;
        }

        container.innerHTML = responses.slice(0, 6).map(r => `
            <button class="quick-response-btn" onclick="insertQuickResponse('${r.content.replace(/'/g, "\\'")}')">
                ${r.title}
            </button>
        `).join('');

    } catch (error) {
        console.error('Erreur chargement réponses rapides:', error);
    }
}

function insertQuickResponse(text) {
    const input = document.getElementById('messageInput');
    if (input) {
        input.value = text;
        input.focus();
    }
}

// ==================== AUTRES FONCTIONS ====================
async function updateTicketStatus(ticketId, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status?status=${status}`, {
            method: 'PATCH'
        });

        if (response.ok) {
            loadTicketMessages(ticketId);
            loadStats();
            loadTicketList();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

function refreshDashboard() {
    loadStats();
    loadUrgentTickets();
}

function refreshMessages() {
    loadTicketList();
    if (currentTicketId) {
        loadTicketMessages(currentTicketId);
    }
}

function openNewTicket() {
    // Implémenter l'ouverture d'un nouveau ticket
    alert('Fonctionnalité d\'ouverture de ticket');
}

function filterTickets(query) {
    const items = document.querySelectorAll('.ticket-item');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
    });
}

function playVoice(url) {
    const audio = new Audio(url);
    audio.play();
}

// ==================== EXPOSER LES FONCTIONS GLOBALEMENT ====================
window.loadPage = loadPage;
window.loadDashboard = loadDashboard;
window.loadStats = loadStats;
window.loadCharts = loadCharts;
window.loadUrgentTickets = loadUrgentTickets;
window.loadTickets = loadTickets;
window.loadTicketList = loadTicketList;
window.loadTicketMessages = loadTicketMessages;
window.selectTicket = selectTicket;
window.openTicket = openTicket;
window.sendMessage = sendMessage;
window.sendVoiceMessage = sendVoiceMessage;
window.sendAttachments = sendAttachments;
window.openVoiceRecorder = openVoiceRecorder;
window.openFileSelector = openFileSelector;
window.updateTicketStatus = updateTicketStatus;
window.refreshDashboard = refreshDashboard;
window.refreshMessages = refreshMessages;
window.openNewTicket = openNewTicket;
window.filterTickets = filterTickets;
window.playVoice = playVoice;
window.insertQuickResponse = insertQuickResponse;
window.sendTypingIndicator = sendTypingIndicator;