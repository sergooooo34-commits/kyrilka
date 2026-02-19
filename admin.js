class AdminPanel {
    constructor() {
        this.db = new BreakDatabase();
        this.isAdminLoggedIn = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAdminLogin();
    }

    bindEvents() {
        // Вход администратора
        document.getElementById('adminLogin').addEventListener('submit', (e) => {
            e.preventDefault();
            this.adminLogin();
        });

        // Выход
        document.getElementById('adminLogout').addEventListener('click', () => {
            this.adminLogout();
        });

        // Регистрация сотрудника
        document.getElementById('registerEmployeeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registerEmployee();
        });

        // Сохранение настроек
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });
    }

    checkAdminLogin() {
        const savedLogin = sessionStorage.getItem('adminLoggedIn');
        if (savedLogin === 'true') {
            this.isAdminLoggedIn = true;
            this.showAdminPanel();
        }
    }

    adminLogin() {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;

        // Простая проверка (в реальном проекте нужно сверять с базой)
        if (username === 'admin' && password === 'admin123') {
            this.isAdminLoggedIn = true;
            sessionStorage.setItem('adminLoggedIn', 'true');
            this.showAdminPanel();
            this.updateAllData();
        } else {
            this.showMessage('Неверное имя пользователя или пароль', 'error');
        }
    }

    adminLogout() {
        this.isAdminLoggedIn = false;
        sessionStorage.removeItem('adminLoggedIn');
        document.getElementById('adminLoginForm').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
    }

    showAdminPanel() {
        document.getElementById('adminLoginForm').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
    }

    showMessage(text, type) {
        const messageDiv = document.getElementById('adminMessage');
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }

    registerEmployee() {
        const name = document.getElementById('empName').value;
        const email = document.getElementById('empEmail').value;
        const password = document.getElementById('empPassword').value;
        const position = document.getElementById('empPosition').value;

        if (this.db.findEmployeeByEmail(email)) {
            alert('Сотрудник с таким email уже существует');
            return;
        }

        this.db.addEmployee({
            name: name,
            email: email,
            password: password,
            position: position
        });

        alert('Сотрудник успешно зарегистрирован');
        document.getElementById('registerEmployeeForm').reset();
        this.updateAllData();
    }

    saveSettings() {
        const maxBreaks = document.getElementById('maxBreaks').value;
        const breakDuration = document.getElementById('breakDuration').value;

        localStorage.setItem('settings', JSON.stringify({
            maxBreaks: parseInt(maxBreaks),
            breakDuration: parseInt(breakDuration)
        }));

        alert('Настройки сохранены');
        this.updateAllData();
    }

    updateAllData() {
        this.updateStats();
        this.updateEmployeesList();
        this.updateActiveBreaks();
        this.updateBreaksHistory();
        this.updateSettings();
    }

    updateStats() {
        const employees = this.db.getEmployees();
        const breaks = this.db.getBreaks();
        const settings = JSON.parse(localStorage.getItem('settings'));
        
        const activeBreaks = breaks.filter(b => b.status === 'active').length;
        const todayBreaks = this.db.getTodayBreaks().length;

        document.getElementById('totalEmployees').textContent = employees.length;
        document.getElementById('activeBreaks').textContent = activeBreaks;
        document.getElementById('todayBreaks').textContent = todayBreaks;
        document.getElementById('availableSpots').textContent = 
            Math.max(0, settings.maxBreaks - activeBreaks);
    }

    updateEmployeesList() {
        const employees = this.db.getEmployees();
        const tbody = document.querySelector('#employeesTable tbody');
        
        tbody.innerHTML = employees.map(emp => `
            <tr>
                <td>${emp.id}</td>
                <td>${emp.name}</td>
                <td>${emp.email}</td>
                <td>${emp.position}</td>
                <td>${new Date(emp.id).toLocaleDateString()}</td>
                <td>
                    <button onclick="admin.deleteEmployee(${emp.id})" 
                            class="btn-danger" style="padding: 5px 10px; font-size: 14px;">
                        Удалить
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateActiveBreaks() {
        const breaks = this.db.getBreaks();
        const employees = this.db.getEmployees();
        const activeBreaks = breaks.filter(b => b.status === 'active');
        
        const tbody = document.querySelector('#activeBreaksTable tbody');
        
        tbody.innerHTML = activeBreaks.map(b => {
            const employee = employees.find(e => e.id === b.employeeId);
            return `
                <tr>
                    <td>${employee ? employee.name : 'Неизвестно'}</td>
                    <td>${new Date(b.startTime).toLocaleString()}</td>
                    <td><span class="break-status status-active">Активен</span></td>
                    <td>
                        <button onclick="admin.endBreakManually(${b.id})" 
                                class="btn-danger" style="padding: 5px 10px; font-size: 14px;">
                            Завершить
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateBreaksHistory() {
        const breaks = this.db.getBreaks();
        const employees = this.db.getEmployees();
        const completedBreaks = breaks.filter(b => b.status === 'completed').slice(-10);
        
        const tbody = document.querySelector('#breaksHistoryTable tbody');
        
        tbody.innerHTML = completedBreaks.map(b => {
            const employee = employees.find(e => e.id === b.employeeId);
            const start = new Date(b.startTime);
            const end = new Date(b.endTime);
            const duration = Math.round((end - start) / 60000); // в минутах
            
            return `
                <tr>
                    <td>${employee ? employee.name : 'Неизвестно'}</td>
                    <td>${start.toLocaleString()}</td>
                    <td>${end.toLocaleString()}</td>
                    <td>${duration} мин</td>
                </tr>
            `;
        }).join('');
    }

    updateSettings() {
        const settings = JSON.parse(localStorage.getItem('settings'));
        document.getElementById('maxBreaks').value = settings.maxBreaks;
        document.getElementById('breakDuration').value = settings.breakDuration;
    }

    deleteEmployee(id) {
        if (confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
            let employees = this.db.getEmployees();
            employees = employees.filter(e => e.id !== id);
            localStorage.setItem('employees', JSON.stringify(employees));
            
            // Удаляем все перерывы сотрудника
            let breaks = this.db.getBreaks();
            breaks = breaks.filter(b => b.employeeId !== id);
            localStorage.setItem('breaks', JSON.stringify(breaks));
            
            this.updateAllData();
        }
    }

    endBreakManually(breakId) {
        let breaks = this.db.getBreaks();
        const breakItem = breaks.find(b => b.id === breakId);
        
        if (breakItem) {
            breakItem.status = 'completed';
            breakItem.endTime = new Date().toISOString();
            localStorage.setItem('breaks', JSON.stringify(breaks));
            this.updateAllData();
        }
    }
}

// Инициализация административной панели
const admin = new AdminPanel();