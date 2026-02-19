-- Создание базы данных
CREATE DATABASE IF NOT EXISTS break_management;
USE break_management;

-- Таблица сотрудников
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    position VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица перерывов
CREATE TABLE IF NOT EXISTS breaks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    break_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    break_end TIMESTAMP NULL,
    status ENUM('active', 'completed') DEFAULT 'active',
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Таблица администраторов
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_INCREMENT
);

-- Вставка начальных данных (админ по умолчанию)
INSERT INTO admins (username, password) VALUES ('admin', MD5('admin123'));
