// متغيرات التطبيق
let currentUser = null;
let currentTicket = null;
let socket = null;

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
const ratingsSection = document.getElementById('ratingsSection');
const ratingsList = document.getElementById('ratingsList');

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
    if (socket) {
        socket.close();
        socket = null;
    }
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
        // حالة تسجيل الدخول
        document.querySelector('.nav-links').style.display = 'none';
        userProfile.style.display = 'flex';
        document.getElementById('usernameDisplay').textContent = currentUser.username;
        document.getElementById('userAvatar').textContent = currentUser.username.charAt(0);
        homeSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        
        // تحميل لوحة التحكم
        loadDashboard();
        
        // إظهار أقسام الإدارة حسب الرتبة
        if (currentUser.role === 'leader' || currentUser.role === 'assistant') {
            adminUsersSection.style.display = 'block';
            loadUsersList();
        } else {
            adminUsersSection.style.display = 'none';
        }
        
        if (currentUser.role !== 'user') {
            ratingsSection.style.display = 'block';
            loadRatings();
        } else {
            ratingsSection.style.display = 'none';
        }
    } else {
        // حالة عدم تسجيل الدخول
        document.querySelector('.nav-links').style.display = 'flex';
        userProfile.style.display = 'none';
        homeSection.style.display = 'block';
        dashboardSection.style.display = 'none';
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        adminUsersSection.style.display = 'none';
        ratingsSection.style.display = 'none';
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
        
        if (response.ok) {
            const ticket = await response.json();
            alert(`تم إنشاء تذكرة الدعم رقم #${ticket._id}`);
            openChat(ticket);
        } else {
            const error = await response.json();
            alert(error.msg || 'حدث خطأ أثناء إنشاء التذكرة');
        }
    } catch (err) {
        console.error('Error creating ticket:', err);
        alert('حدث خطأ أثناء إنشاء التذكرة');
    }
}

function openChat(ticket) {
    currentTicket = ticket;
    document.getElementById('chatTitle').textContent = `محادثة الدعم - ${getPriorityName(ticket.priority)}`;
    chatMessages.innerHTML = '';
    chatModal.classList.add('active');
    
    // في تطبيق حقيقي، هنا يتم الاتصال بالسيرفر عبر WebSocket
    // هذا مثال وهمي للتوضيح فقط
    simulateChat();
}

function getPriorityName(priority) {
    switch(priority) {
        case 'low': return 'منخفض';
        case 'medium': return 'وسط';
        case 'high': return 'عالي';
        default: return priority;
    }
}

function simulateChat() {
    // إضافة رسالة ترحيبية
    addMessage({
        sender: currentUser.role === 'user' ? 'المساعد' : 'المستخدم',
        message: 'مرحبًا، كيف يمكنني مساعدتك اليوم؟',
        timestamp: new Date(),
        type: 'received'
    });
    
    // محاكاة ردود المساعد
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
    
    // إضافة الرسالة إلى الدردشة
    addMessage({
        sender: 'أنت',
        message,
        timestamp: new Date(),
        type: 'sent'
    });
    
    // في تطبيق حقيقي، هنا يتم إرسال الرسالة عبر WebSocket
    messageInput.value = '';
    
    // محاكاة رد المساعد
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
        
        if (response.ok) {
            const users = await response.json();
            renderUsersList(users);
        } else {
            console.error('Failed to load users');
        }
    } catch (err) {
        console.error('Error loading users:', err);
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
    
    // إضافة معالجات الأحداث لأزرار الترقية
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
        
        if (response.ok) {
            alert('تمت ترقية المستخدم بنجاح');
            loadUsersList();
        } else {
            const error = await response.json();
            alert(error.msg || 'حدث خطأ أثناء الترقية');
        }
    } catch (err) {
        console.error('Error promoting user:', err);
        alert('حدث خطأ أثناء الترقية');
    }
}

async function loadRatings() {
    try {
        const response = await fetch('/api/ratings', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const ratings = await response.json();
            renderRatings(ratings);
        } else {
            console.error('Failed to load ratings');
        }
    } catch (err) {
        console.error('Error loading ratings:', err);
    }
}

function renderRatings(ratings) {
    ratingsList.innerHTML = '';
    
    if (ratings.length === 0) {
        ratingsList.innerHTML = '<p>لا توجد تقييمات متاحة</p>';
        return;
    }
    
    ratings.forEach(rating => {
        const ratingItem = document.createElement('div');
        ratingItem.className = 'rating-item';
        
        let stars = '';
        for (let i = 0; i < rating.score; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        ratingItem.innerHTML = `
            <div class="rating-header">
                <span class="rating-user">${rating.user.username}</span>
                <div class="rating-stars">${stars}</div>
            </div>
            <p class="rating-comment">${rating.comment || 'لا يوجد تعليق'}</p>
        `;
        
        ratingsList.appendChild(ratingItem);
    });
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
        
        if (response.ok) {
            await checkAuth();
        } else {
            const error = await response.json();
            alert(error.msg || 'اسم المستخدم أو كلمة المرور غير صحيحة');
        }
    } catch (err) {
        console.error('Error logging in:', err);
        alert('حدث خطأ أثناء تسجيل الدخول');
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
        
        if (response.ok) {
            alert('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.');
            showAuthForm('login');
        } else {
            const error = await response.json();
            alert(error.msg || 'حدث خطأ أثناء إنشاء الحساب');
        }
    } catch (err) {
        console.error('Error registering:', err);
        alert('حدث خطأ أثناء إنشاء الحساب');
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