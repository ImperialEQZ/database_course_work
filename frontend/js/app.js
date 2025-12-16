class BookstoreApp {
    constructor() {
        this.apiBase = window.location.hostname === 'localhost' ? '/api' : window.location.origin + '/api';
        this.initEventListeners();
        this.checkAuth();
    }

    initEventListeners() {
        document.getElementById('loginVulnerableBtn').addEventListener('click', () => {
            this.login('vulnerable');
        });

        document.getElementById('loginSecureBtn').addEventListener('click', () => {
            this.login('secure');
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('tryInjection1Btn').addEventListener('click', () => {
            this.tryInjection(1);
        });

        document.getElementById('tryInjection2Btn').addEventListener('click', () => {
            this.tryInjection(2);
        });

        document.getElementById('viewOrdersBtn').addEventListener('click', () => {
            this.loadData('orders');
        });

        document.getElementById('viewProductsBtn').addEventListener('click', () => {
            this.loadData('products');
        });
    }

    async checkAuth() {
        try {
            const response = await fetch(`${this.apiBase}/auth/current-user`);
            const result = await response.json();

            if (result.success) {
                this.updateUserInfo(result.user);
            } else {
                this.clearUserInfo();
            }
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            this.clearUserInfo();
        }
    }

    async login(type) {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showResult('loginResult', 'Пожалуйста, заполните все поля', 'error');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`${this.apiBase}/auth/login-${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                this.showResult('loginResult', `Успешный вход как ${result.user.name} (${result.user.role})`, 'success');
                this.updateUserInfo(result.user);
                this.showVulnerability(type === 'vulnerable');
            } else {
                this.showResult('loginResult', result.error || 'Ошибка входа', 'error');
            }
        } catch (error) {
            this.showResult('loginResult', `Ошибка соединения: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async logout() {
        this.showLoading();

        try {
            const response = await fetch(`${this.apiBase}/auth/logout`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.showResult('loginResult', 'Выход выполнен успешно', 'success');
                this.clearUserInfo();
            } else {
                this.showResult('loginResult', result.error || 'Ошибка выхода', 'error');
            }
        } catch (error) {
            this.showResult('loginResult', `Ошибка соединения: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async tryInjection(type) {
        let username, password, resultElement;

        if (type === 1) {
            username = document.getElementById('injectionUsername1').value;
            password = document.getElementById('injectionPassword1').value;
            resultElement = 'injectionResult1';
        } else if (type === 2) {
            username = document.getElementById('injectionUsername2').value;
            password = document.getElementById('injectionPassword2').value;
            resultElement = 'injectionResult2';
        }

        this.showLoading();

        try {
            const originalUsername = username;

            const response = await fetch(`${this.apiBase}/auth/login-vulnerable`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                let message = `Инъекция успешна! Вход выполнен как ${result.user.name} (${result.user.role})`;
                this.showResult(resultElement, message, 'injection');
                this.updateUserInfo(result.user);
            } else {
                const errorMessage = result.error || 'Неизвестная ошибка';
                let message = `Инъекционный запрос:\n'${originalUsername}'\n\nРезультат выполнения:\n${errorMessage}`;
                this.showResult(resultElement, message, 'injection');
            }
        } catch (error) {
            this.showResult(resultElement, `Ошибка соединения: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadData(endpoint) {
        this.showLoading();

        try {
            const response = await fetch(`${this.apiBase}/${endpoint}`);
            const result = await response.json();

            if (result.success) {
                this.displayData(result.data, result.columns, endpoint);
            } else {
                this.showResult('dataResult', result.error || 'Ошибка получения данных', 'error');
            }
        } catch (error) {
            this.showResult('dataResult', `Ошибка соединения: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayData(data, columns, endpoint) {
        const container = document.getElementById('dataResult');

        if (!data || data.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>Нет данных для отображения</p></div>`;
            container.className = 'result-box result-success';
            container.style.display = 'block';
            return;
        }

        let tableHTML = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;

        data.forEach(row => {
            tableHTML += '<tr>';
            columns.forEach((col, index) => {
                let value;
                const colName = col.toLowerCase().replace(' ', '_');

                if (typeof row === 'object' && row !== null) {
                    // Поиск по ключам
                    const keys = Object.keys(row);
                    const matchingKey = keys.find(key =>
                        key.toLowerCase().includes(colName) ||
                        colName.includes(key.toLowerCase())
                    );

                    value = matchingKey ? row[matchingKey] : Object.values(row)[index];
                } else {
                    value = row;
                }

                // Форматирование
                if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
                    try {
                        const date = new Date(value);
                        if (!isNaN(date.getTime())) {
                            value = date.toLocaleDateString('ru-RU');
                        }
                    } catch (e) {
                        // Оставляем как есть
                    }
                }

                if (typeof value === 'number' && (col.toLowerCase().includes('цена') || col.toLowerCase().includes('price'))) {
                    value = value.toFixed(2).replace('.', ',') + ' ₽';
                }

                tableHTML += `<td>${value !== null && value !== undefined ? value : ''}</td>`;
            });
            tableHTML += '</tr>';
        });

        tableHTML += `
          </tbody>
        </table>
        <p style="margin: 15px 0 0 0">Найдено записей: ${data.length}</p>
      </div>
    `;

        container.innerHTML = tableHTML;
        container.className = 'result-box result-success';
        container.style.display = 'block';
    }

    updateUserInfo(user) {
        const userInfo = document.getElementById('user-info');
        userInfo.innerHTML = `
      <p>Вы вошли как: <strong>${user.name}</strong></p>
      <p>Роль: <strong>${user.role === 'admin' ? 'Администратор' : 'Пользователь'}</strong></p>
    `;
        userInfo.style.display = 'block';
        userInfo.className = user.role === 'admin' ? 'user-info admin' : 'user-info user';
    }

    clearUserInfo() {
        const userInfo = document.getElementById('user-info');
        userInfo.innerHTML = '';
        userInfo.style.display = 'none';
    }

    showVulnerability(isVulnerable) {
        const message = isVulnerable ?
            'ВНИМАНИЕ: Вы вошли через УЯЗВИМЫЙ метод! Это демонстрирует риск SQL-инъекций.' :
            'Вы вошли через ЗАЩИЩЕННЫЙ метод, который предотвращает SQL-инъекции.';

        this.showResult('loginResult', message, isVulnerable ? 'injection' : 'success');
    }

    showResult(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.textContent = message;

        // Убираем все классы результатов
        element.classList.remove('result-success', 'result-error', 'result-injection');

        // Добавляем нужный класс
        if (type === 'success') {
            element.classList.add('result-success');
        } else if (type === 'error') {
            element.classList.add('result-error');
        } else if (type === 'injection') {
            element.classList.add('result-injection');
        }

        element.style.display = 'block';
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BookstoreApp();
});