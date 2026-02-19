// Имитация базы данных в localStorage
class BreakDatabase {
    constructor() {
        this.initDatabase();
    }

    initDatabase() {
        if (!localStorage.getItem('employees')) {
            localStorage.setItem('employees', JSON.stringify([]));
        }
        if (!localStorage.getItem('breaks')) {
            localStorage.setItem('breaks', JSON.stringify([]));
        }
        if (!localStorage.getItem('settings')) {
            localStorage.setItem('settings', JSON.stringify({
                maxBreaks: 5,
                breakDuration: 10
            }));
        }
    }

    // Методы для работы с сотрудниками
    getEmployees() {
        return JSON.parse(localStorage.getItem('employees'));
    }

    addEmployee(employee) {
        const employees = this.getEmployees();
        employee.id = Date.now();
        employees.push(employee);
        localStorage.setItem('employees', JSON.stringify(employees));
        return employee;
    }

    findEmployeeByEmail(email) {
        const employees = this.getEmployees();
        return employees.find(emp => emp.email === email);
    }

    // Методы для работы с перерывами
    getBreaks() {
        return JSON.parse(localStorage.getItem('breaks'));
    }

    startBreak(employeeId) {
        const breaks = this.getBreaks();
        const settings = JSON.parse(localStorage.getItem('settings'));
        
        // Проверяем, не превышен ли лимит активных перерывов
        const activeBreaks = breaks.filter(b => b.status === 'active').length;
        if (activeBreaks >= settings.maxBreaks) {
            return { success: false, message: 'Нет свободных мест для перерыва' };
        }

        // Проверяем, нет ли уже активного перерыва у сотрудника
        const existingBreak = breaks.find(b => b.employeeId === employeeId && b.status === 'active');
        if (existingBreak) {
            return { success: false, message: 'У вас уже есть активный перерыв' };
        }

        const newBreak = {
            id: Date.now(),
            employeeId: employeeId,
            startTime: new Date().toISOString(),
            endTime: null,
            status: 'active'
        };

        breaks.push(newBreak);
        localStorage.setItem('breaks', JSON.stringify(breaks));
        return { success: true, message: 'Перерыв начат', break: newBreak };
    }

    endBreak(employeeId) {
        const breaks = this.getBreaks();
        const activeBreak = breaks.find(b => b.employeeId === employeeId && b.status === 'active');
        
        if (activeBreak) {
            activeBreak.status = 'completed';
            activeBreak.endTime = new Date().toISOString();
            localStorage.setItem('breaks', JSON.stringify(breaks));
            return { success: true, message: 'Перерыв завершен' };
        }
        
        return { success: false, message: 'Активный перерыв не найден' };
    }

    getActiveBreaks() {
        return this.getBreaks().filter(b => b.status === 'active');
    }

    // Статистика
    getTodayBreaks() {
        const today = new Date().toDateString();
        return this.getBreaks().filter(b => {
            const breakDate = new Date(b.startTime).toDateString();
            return breakDate === today;
        });
    }
}

// Инициализация базы данных
const db = new BreakDatabase();

// Добавление тестовых данных
if (db.getEmployees().length === 0) {
    db.addEmployee({
        name: 'Иванов Иван Иванович',
        email: 'ivanov@test.com',
        password: '123456',
        position: 'Менеджер'
    });
}

// Логика интерфейса
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const messageDiv = document.getElementById('message');
    const loginContainer = document.querySelector('.container:first-child');
    const employeePanel = document.getElementById('employeePanel');
    const startBreakBtn = document.getElementById('startBreak');
    const endBreakBtn = document.getElementById('endBreak');
    const employeeLogout = document.getElementById('employeeLogout');
    const employeeName = document.getElementById('employeeName');
    const employeePosition = document.getElementById('employeePosition');

    let currentEmployee = null;

    // Переключение между формами
    showRegister.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        document.getElementById('registerToggle').style.display = 'block';
        showRegister.parentElement.style.display = 'none';
    });

    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        document.getElementById('registerToggle').style.display = 'none';
        showRegister.parentElement.style.display = 'block';
    });

    // Регистрация
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const position = document.getElementById('regPosition').value;

        // Проверка существования пользователя
        if (db.findEmployeeByEmail(email)) {
            showMessage('Пользователь с таким email уже существует', 'error');
            return;
        }

        // Регистрация
        db.addEmployee({
            name: name,
            email: email,
            password: password,
            position: position
        });

        showMessage('Регистрация успешна! Теперь вы можете войти', 'success');
        registerForm.reset();
        
        // Переключение на форму входа
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        document.getElementById('registerToggle').style.display = 'none';
        showRegister.parentElement.style.display = 'block';
    });

    // Вход
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const employee = db.findEmployeeByEmail(email);
        
        if (employee && employee.password === password) {
            currentEmployee = employee;
            
            // Обновление информации о сотруднике
            employeeName.textContent = employee.name;
            employeePosition.textContent = employee.position;
            
            // Проверка активного перерыва
            const activeBreak = db.getBreaks().find(b => 
                b.employeeId === employee.id && b.status === 'active'
            );
            
            if (activeBreak) {
                startBreakBtn.style.display = 'none';
                endBreakBtn.style.display = 'block';
            }
            
            // Переключение на панель сотрудника
            loginContainer.style.display = 'none';
            employeePanel.style.display = 'block';
        } else {
            showMessage('Неверный email или пароль', 'error');
        }
    });

    // Начало перерыва
    startBreakBtn.addEventListener('click', function() {
        if (!currentEmployee) return;
        
        const result = db.startBreak(currentEmployee.id);
        
        if (result.success) {
            showMessage('Перерыв начат! У вас 10 минут', 'success');
            startBreakBtn.style.display = 'none';
            endBreakBtn.style.display = 'block';
            
            // Автоматическое завершение через 10 минут
            setTimeout(function() {
                if (endBreakBtn.style.display === 'block') {
                    endBreak();
                }
            }, 600000); // 10 минут в миллисекундах
        } else {
            showMessage(result.message, 'error');
        }
    });

    // Завершение перерыва
    endBreakBtn.addEventListener('click', function() {
        if (!currentEmployee) return;
        
        const result = db.endBreak(currentEmployee.id);
        
        if (result.success) {
            showMessage('Перерыв завершен', 'success');
            startBreakBtn.style.display = 'block';
            endBreakBtn.style.display = 'none';
        }
    });

    // Выход
    employeeLogout.addEventListener('click', function() {
        currentEmployee = null;
        loginContainer.style.display = 'block';
        employeePanel.style.display = 'none';
        loginForm.reset();
        startBreakBtn.style.display = 'block';
        endBreakBtn.style.display = 'none';
    });

    // Вспомогательная функция для показа сообщений
    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
});