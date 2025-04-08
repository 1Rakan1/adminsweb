// متغيرات التطبيق
let currentUser = null;
let currentTicket = null;

// عناصر DOM
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userProfile = document.getElementById('userProfile');
const homeSection = document.getElementById('homeSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterFormLink = document.getElementById('showRegisterFormLink');
const showLoginFormLink = document.getElementById('showLoginFormLink');
const createTicketBtn = document.getElementById('createTicketBtn');
const dashboardCreateTicketBtn = document.getElementById('dashboardCreateTicketBtn');
const ticketModal = document.getElementById('ticketModal');
const closeModal = document.getElementById('closeModal');
const priorityBtns = document.querySelectorAll('.priority-btn');
const chatModal = document.getElementById('chatModal');
const closeChat = document.getElementById('closeChat');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const adminUsersSection = document.getElementById('adminUsersSection');
const usersList = document.getElementById('usersList');
const ticketsSection = document.getElementById('ticketsSection');
const ticketsList = document.getElementById('ticketsList');

// معالجات الأحداث
loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showAuthForm('login');
});

registerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showAuthForm('register');
});

showRegisterFormLink.addEventListener('click', (e) => {
    e.preventDefault();
    showAuthForm('register');
});

showLoginFormLink.addEventListener('click', (e) => {
    e.preventDefault();
    showAuthForm('login');
});

logoutBtn.addEventListener('click', () => {
    logout();
});

createTicketBtn.addEventListener('click', () => {
    if (!currentUser) {
        alert('الرجاء تسجيل الدخول أولاً');
        showAuthForm('login');
        return;
    }
    ticketModal.classList.add('active');
});

dashboardCreateTicketBtn.addEventListener('click', () => {
    ticketModal.classList.add('active');
});

closeModal.addEventListener('click', () => {
    ticketModal.classList.remove('active');
});

closeChat.addEventListener('click', () => {
    chatModal.classList.remove('active');
});

priorityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const priority = btn.dataset.priority;
        createTicket(priority);
        ticketModal.classList.remove('active');
    });
});

sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// وظائف التطبيق
function showAuthForm(formType) {
    homeSection.style.display = 'none';
    dashboardSection.style.display = 'none';
    loginForm.style.display = formType === 'login' ? 'block' : 'none';
    registerForm.style.display = formType === 'register' ? 'block' : 'none';
}

async function checkAuth() {
    try {
        const response = await fetch('/api/auth', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            updateUI();
        } else {
            currentUser = null;
            updateUI();
        }
    } catch (err) {
        console.error('Error checking auth:', err);
        currentUser = null;
        updateUI();
    }
}

function updateUI() {
    if (currentUser) {
        document.querySelector('.nav-links').style.display = 'none';
        userProfile.style.display = 'flex';
        document.getElementById('usernameDisplay').textContent = currentUser.username;
        document.getElementById('userAvatar').textContent = currentUser.username.charAt(0);
        homeSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        
        loadDashboard();
        
        if (currentUser.role === 'leader' || currentUser.role === 'assistant') {
            adminUsersSection.style.display = 'block';
            loadUsersList();
        } else {
            adminUsersSection.style.display = 'none';
        }

        if (currentUser.role !== 'user') {
            ticketsSection.style.display = 'block';
            loadTickets();
        } else {
            ticketsSection.style.display = 'none';
        }
    } else {
        document.querySelector('.nav-links').style.display = 'flex';
        userProfile.style.display = 'none';
        homeSection.style.display = 'block';
        dashboardSection.style.display = 'none';
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        adminUsersSection.style.display = 'none';
        ticketsSection.style.display = 'none';
    }
}

async function loadDashboard() {
    const dashboardContent = document.getElementById('dashboardContent');
    
    let roleDisplay = '';
    let description = '';
    
    switch(currentUser.role) {
        case 'user':
            roleDisplay = 'مستخدم';
            description = 'مرحبًا بك في نظام الدعم الفني. يمكنك تقديم طلبات الدعم باستخدام الزر أعلاه.';
            break;
        case 'admin':
            roleDisplay = 'مسؤول';
            description = 'مرحبًا بك في لوحة تحكم المسؤولين. لديك صلاحية إدارة طلبات الدعم المنخفضة.';
            break;
        case 'assistant':
            roleDisplay = 'مساعد';
            description = 'مرحبًا بك في لوحة تحكم المساعدين. لديك صلاحية إدارة طلبات الدعم المتوسطة والعالية.';
            break;
        case 'leader':
            roleDisplay = 'قائد';
            description = 'مرحبًا بك في لوحة تحكم القادة. لديك صلاحية إدارة جميع طلبات الدعم والمستخدمين.';
            break;
    }
    
    dashboardContent.innerHTML = `
        <div class="user-card">
            <div class="user-header">
                <div class="user-avatar" style="background-color: ${getRoleColor(currentUser.role)}">
                    ${currentUser.username.charAt(0)}
                </div>
                <div class="user-info">
                    <h3>${currentUser.username}</h3>
                    <span class="user-role ${currentUser.role}">${roleDisplay}</span>
                </div>
            </div>
            <p>${description}</p>
        </div>
    `;
}

function getRoleColor(role) {
    switch(role) {
        case 'admin': return 'var(--danger-color)';
        case 'assistant': return 'var(--warning-color)';
        case 'leader': return 'var(--success-color)';
        default: return 'var(--primary-color)';
    }
}

async function createTicket(priority) {
    try {
        const description = prompt('الرجاء إدخال وصف المشكلة:');
        if (!description) return;
        
        const response = await fetch('/api/tickets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                priority,
                description
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.msg || 'حدث خطأ أثناء إنشاء التذكرة');
        }
        
        alert(`تم إنشاء تذكرة الدعم بنجاح!`);
        openChat(result.ticket);
        loadTickets();
    } catch (err) {
        console.error('Error creating ticket:', err);
        alert(err.message || 'حدث خطأ أثناء إنشاء التذكرة');
    }
}

async function loadTickets() {
    try {
        const response = await fetch('/api/tickets', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('فشل تحميل التذاكر');
        }
        
        const tickets = await response.json();
        renderTickets(tickets);
    } catch (err) {
        console.error('Error loading tickets:', err);
        ticketsList.innerHTML = '<p>حدث خطأ أثناء تحميل التذاكر</p>';
    }
}

function renderTickets(tickets) {
    ticketsList.innerHTML = '';
    
    if (tickets.length === 0) {
        ticketsList.innerHTML = '<p>لا توجد تذاكر مفتوحة</p>';
        return;
    }
    
    tickets.forEach(ticket => {
        const ticketItem = document.createElement('div');
        ticketItem.className = 'ticket-item';
        ticketItem.innerHTML = `
            <div>
                <strong>#${ticket._id.substring(18)}</strong>
                <span class="ticket-priority ${ticket.priority}">
                    ${getPriorityName(ticket.priority)}
                </span>
            </div>
            <p>${ticket.description}</p>
            <small>الحالة: ${getStatusName(ticket.status)}</small>
        `;
        
        ticketItem.addEventListener('click', () => openChat(ticket));
        ticketsList.appendChild(ticketItem);
    });
}

function getPriorityName(priority) {
    switch(priority) {
        case 'low': return 'منخفض';
        case 'medium': return 'وسط';
        case 'high': return 'عالي';
        default: return priority;
    }
}

function getStatusName(status) {
    switch(status) {
        case 'open': return 'مفتوحة';
        case 'in-progress': return 'قيد المعالجة';
        case 'resolved': return 'تم الحل';
        default: return status;
    }
}

function openChat(ticket) {
    currentTicket = ticket;
    document.getElementById('chatTitle').textContent = 
        `محادثة الدعم - ${getPriorityName(ticket.priority)} (#${ticket._id.substring(18)})`;
    chatMessages.innerHTML = '';
    chatModal.classList.add('active');
    
    // محاكاة الدردشة
    addMessage({
        sender: currentUser.role === 'user' ? 'المساعد' : 'المستخدم',
        message: 'مرحبًا، كيف يمكنني مساعدتك اليوم؟',
        timestamp: new Date(),
        type: 'received'
    });
    
    if (currentUser.role === 'user') {
        setTimeout(() => {
            addMessage({
                sender: 'المساعد',
                message: 'نحن نعمل على حل مشكلتك، الرجاء الانتظار...',
                timestamp: new Date(),
                type: 'received'
            });
        }, 3000);
    }
}

function addMessage(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${msg.type}`;
    
    const senderSpan = document.createElement('span');
    senderSpan.className = 'message-sender';
    senderSpan.textContent = msg.sender;
    
    const messageText = document.createElement('div');
    messageText.textContent = msg.message;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = formatTime(msg.timestamp);
    
    messageDiv.appendChild(senderSpan);
    messageDiv.appendChild(messageText);
    messageDiv.appendChild(timeSpan);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    addMessage({
        sender: 'أنت',
        message,
        timestamp: new Date(),
        type: 'sent'
    });
    
    messageInput.value = '';
    
    if (currentUser.role === 'user') {
        setTimeout(() => {
            addMessage({
                sender: 'المساعد',
                message: 'شكرًا على معلوماتك الإضافية. سنقوم بمتابعة طلبك.',
                timestamp: new Date(),
                type: 'received'
            });
        }, 2000);
    }
}

async function loadUsersList() {
    try {
        const response = await fetch('/api/users', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('فشل تحميل المستخدمين');
        }
        
        const users = await response.json();
        renderUsersList(users);
    } catch (err) {
        console.error('Error loading users:', err);
        usersList.innerHTML = '<p>حدث خطأ أثناء تحميل المستخدمين</p>';
    }
}

function renderUsersList(users) {
    usersList.innerHTML = '';
    
    users.forEach(user => {
        if (user._id === currentUser._id) return;
        
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        
        userItem.innerHTML = `
            <div class="user-item-info">
                <div class="user-item-avatar" style="background-color: ${getRoleColor(user.role)}">
                    ${user.username.charAt(0)}
                </div>
                <div>
                    <div class="user-item-name">${user.username}</div>
                    <span class="user-role ${user.role}">${getRoleDisplay(user.role)}</span>
                </div>
            </div>
            ${currentUser.role === 'leader' ? '<button class="promote-btn" data-userid="' + user._id + '">ترقية</button>' : ''}
        `;
        
        usersList.appendChild(userItem);
    });
    
    document.querySelectorAll('.promote-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.dataset.userid;
            await promoteUser(userId);
        });
    });
}

function getRoleDisplay(role) {
    switch(role) {
        case 'user': return 'مستخدم';
        case 'admin': return 'مسؤول';
        case 'assistant': return 'مساعد';
        case 'leader': return 'قائد';
        default: return role;
    }
}

async function promoteUser(userId) {
    try {
        const response = await fetch(`/api/users/${userId}/promote`, {
            method: 'POST',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.msg || 'حدث خطأ أثناء الترقية');
        }
        
        alert('تمت ترقية المستخدم بنجاح');
        loadUsersList();
    } catch (err) {
        console.error('Error promoting user:', err);
        alert(err.message || 'حدث خطأ أثناء الترقية');
    }
}

async function login(username, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                username,
                password
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.msg || 'فشل تسجيل الدخول');
        }
        
        await checkAuth();
    } catch (err) {
        console.error('Login error:', err);
        alert(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    }
}

async function register(userData) {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.msg || 'فشل إنشاء الحساب');
        }
        
        alert(result.msg || 'تم إنشاء الحساب بنجاح!');
        showAuthForm('login');
    } catch (err) {
        console.error('Registration error:', err);
        alert(err.message || 'حدث خطأ أثناء إنشاء الحساب');
    }
}

async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            currentUser = null;
            updateUI();
        }
    } catch (err) {
        console.error('Error logging out:', err);
    }
}

// معالجة تسجيل الدخول
document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (username && password) {
        await login(username, password);
    } else {
        alert('الرجاء إدخال اسم المستخدم وكلمة المرور');
    }
});

// معالجة إنشاء حساب
document.getElementById('registerFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const discordName = document.getElementById('registerDiscord').value;
    const birthDate = document.getElementById('registerBirthDate').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('كلمة المرور وتأكيدها غير متطابقين');
        return;
    }
    
    const userData = {
        username,
        email,
        discordName,
        birthDate,
        password
    };
    
    await register(userData);
});

// تهيئة التطبيق
checkAuth();
