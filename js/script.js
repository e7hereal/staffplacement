// ====================== ДАННЫЕ ПРИЛОЖЕНИЯ ======================
const employees = [
    "Алекперова Диана",
    "Андреянов Илья",
    "Архиреева Полина",
    "Бусловская Галина",
    "Гололобцев Данила",
    "Давыдов Игорь",
    "Давыдова Вероника",
    "Данилушкин Иван",
    "Депутатова Мария",
    "Дидимов Тимурлан",
    "Дребенникова Алина",
    "Корнейчук Алёна",
    "Кхалаф Алали",
    "Лысенко Юлия",
    "Ляшенко Максим",
    "Матвеев Никита",
    "Мяндина Софья",
    "Николаев Егор",
    "Осипова Елена",
    "Плужникова Ираида",
    "Прялухин Михаил",
    "Пятов Денис",
    "Романова Алина",
    "Рублева Светлана",
    "Соломатина Алина",
    "Уляхин Сергей",
    "Фомин Алексей",
    "Фомин-Агеев Дмитрий",
    "Чмыхова Елена",
    "Шильцына Анастасия",
    "Шлычкова Юлия",
    "Яблоков Егор"
];

const sections = [
    "RUWI",
    "Ближний джокер",
    "Дальний джокер",
    "Размещение М2",
    "Размещение М1",
    "Размещение К",
    "NC",
    "Возвраты (центр)",
    "Возвраты (джокер)",
    "Возвраты (петля)",
    "Нулевая комната M2",
    "Нулевая комната К",
    "MB (поиск потерянного товара)",
    "IS (батчи, 54-55)",
    "IS (упаковка)",
    "IS (поиск потерянного товара)",
    "Дамчут",
    "RQMI + 0052",
    "Поиск MISSING_PICKING",
    "Поиск MISSING_PUTAWAY",
    "TS в отделе QA",
    "Отгрузка",
    "NOT_FOUND_PICKING",
    "NOT_FOUND_PUTAWAY",
    "Прочие задачи",
    "Тех. Локи"
];

// Состояние приложения
let state = {
    available: [...employees],
    vacation: [],
    sickLeave: [],
    dayOff: [],
    assignments: {},
    isCompactMode: false,
    lastUpdated: Date.now()
};

// Идентификатор сессии для совместной работы
const sessionId = 'staff-placement-' + (localStorage.getItem('sessionId') || generateId());
localStorage.setItem('sessionId', sessionId);

// ====================== ОСНОВНЫЕ ФУНКЦИИ ======================

function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Инициализация таблицы участков
function initAssignmentTable() {
    const tbody = document.getElementById('assignmentBody');
    tbody.innerHTML = '';
    
    sections.forEach(section => {
        state.assignments[section] = state.assignments[section] || [];
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="section-column">${section}</td>
            <td class="employees-column dropzone" data-section="${section}"></td>
        `;
        tbody.appendChild(row);
        
        updateSectionEmployees(section);
    });
}

// Обновление сотрудников на участке
function updateSectionEmployees(section) {
    const cell = document.querySelector(`td[data-section="${section}"]`);
    cell.innerHTML = '';
    
    const employees = state.assignments[section] || [];
    employees.forEach(employee => {
        const empElement = createEmployeeElement(employee, section);
        cell.appendChild(empElement);
    });
}

// Создание элемента сотрудника
function createEmployeeElement(employee, source) {
    const div = document.createElement('div');
    div.className = 'employee';
    div.textContent = employee;
    div.draggable = true;
    div.dataset.employee = employee;
    div.dataset.source = source;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="bi bi-x"></i>';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        removeEmployee(employee, source);
    };
    
    div.appendChild(deleteBtn);
    
    div.addEventListener('dragstart', dragStart);
    
    return div;
}

// Инициализация списка доступных сотрудников
function initAvailableStaff() {
    const container = document.getElementById('availableStaff');
    container.innerHTML = '';
    
    state.available.forEach(employee => {
        const empElement = createEmployeeElement(employee, 'available');
        container.appendChild(empElement);
    });
    
    updateCounters();
}

// Инициализация списков отсутствующих сотрудников
function initUnavailableStaff() {
    initUnavailableSection('vacation', 'vacationStaff');
    initUnavailableSection('sickLeave', 'sickLeaveStaff');
    initUnavailableSection('dayOff', 'dayOffStaff');
}

function initUnavailableSection(stateKey, elementId) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';
    
    state[stateKey].forEach(employee => {
        const empElement = createEmployeeElement(employee, stateKey);
        container.appendChild(empElement);
    });
    
    updateCounters();
}

// Обновление всех счетчиков
function updateCounters() {
    document.getElementById('availableCounter').textContent = state.available.length;
    document.getElementById('vacationCounter').textContent = state.vacation.length;
    document.getElementById('sickLeaveCounter').textContent = state.sickLeave.length;
    document.getElementById('dayOffCounter').textContent = state.dayOff.length;
    
    updateTotalCounters();
}

// Обновление счетчика расставленного персонала
function updateTotalCounters() {
    const totalAssigned = Object.values(state.assignments).reduce((sum, employees) => sum + employees.length, 0);
    const unavailable = state.vacation.length + state.sickLeave.length + state.dayOff.length;
    const totalAvailable = employees.length - unavailable;
    
    document.getElementById('totalAssignedCounter').textContent = totalAssigned;
    document.getElementById('totalAvailableCounter').textContent = totalAvailable;
}

// Drag and Drop функционал
function dragStart(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
        employee: e.target.dataset.employee,
        source: e.target.dataset.source
    }));
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('dragging');
}

function setupDropzones() {
    const dropzones = document.querySelectorAll('.dropzone');
    
    dropzones.forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            zone.classList.add('highlight');
        });
        
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('highlight');
        });
        
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('highlight');
            
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const employee = data.employee;
            const source = data.source;
            const target = zone.id === 'availableStaff' ? 'available' : 
                            zone.id === 'vacationStaff' ? 'vacation' :
                            zone.id === 'sickLeaveStaff' ? 'sickLeave' :
                            zone.id === 'dayOffStaff' ? 'dayOff' : 
                            zone.dataset.section;
            
            moveEmployee(employee, source, target);
            
            document.querySelectorAll('.dragging').forEach(el => {
                el.classList.remove('dragging');
            });
        });
    });
}

// Перемещение сотрудника
function moveEmployee(employee, source, target) {
    if (source === target) return;
    
    removeEmployeeFromSource(employee, source);
    
    if (!addEmployeeToTarget(employee, target)) {
        addEmployeeToTarget(employee, source);
        return;
    }
    
    updateUIAfterMove(employee, source, target);
    updateCounters();
    
    showToast(`${employee} перемещен`, 'success');
    saveState();
}

function removeEmployeeFromSource(employee, source) {
    if (source === 'available') {
        state.available = state.available.filter(e => e !== employee);
    } else if (source === 'vacation') {
        state.vacation = state.vacation.filter(e => e !== employee);
    } else if (source === 'sickLeave') {
        state.sickLeave = state.sickLeave.filter(e => e !== employee);
    } else if (source === 'dayOff') {
        state.dayOff = state.dayOff.filter(e => e !== employee);
    } else if (state.assignments[source]) {
        state.assignments[source] = state.assignments[source].filter(e => e !== employee);
    }
}

function addEmployeeToTarget(employee, target) {
    if (target === 'available') {
        if (!state.available.includes(employee)) {
            state.available.push(employee);
            return true;
        }
    } else if (target === 'vacation') {
        if (!state.vacation.includes(employee)) {
            state.vacation.push(employee);
            return true;
        }
    } else if (target === 'sickLeave') {
        if (!state.sickLeave.includes(employee)) {
            state.sickLeave.push(employee);
            return true;
        }
    } else if (target === 'dayOff') {
        if (!state.dayOff.includes(employee)) {
            state.dayOff.push(employee);
            return true;
        }
    } else if (state.assignments[target]) {
        const isAlreadyAssigned = Object.entries(state.assignments)
            .filter(([section, _]) => section !== target)
            .some(([_, employees]) => employees.includes(employee));
        
        if (!isAlreadyAssigned && !state.assignments[target].includes(employee)) {
            state.assignments[target].push(employee);
            return true;
        } else if (isAlreadyAssigned) {
            showToast('Сотрудник уже назначен на другой участок!', 'warning');
            return false;
        }
    }
    return true;
}

function updateUIAfterMove(employee, source, target) {
    if (source === 'available' || target === 'available') {
        initAvailableStaff();
    }
    
    if (source === 'vacation' || target === 'vacation') {
        initUnavailableSection('vacation', 'vacationStaff');
    }
    
    if (source === 'sickLeave' || target === 'sickLeave') {
        initUnavailableSection('sickLeave', 'sickLeaveStaff');
    }
    
    if (source === 'dayOff' || target === 'dayOff') {
        initUnavailableSection('dayOff', 'dayOffStaff');
    }
    
    if (state.assignments[source]) {
        updateSectionEmployees(source);
    }
    
    if (state.assignments[target]) {
        updateSectionEmployees(target);
    }
}

// Удаление сотрудника
function removeEmployee(employee, source) {
    removeEmployeeFromSource(employee, source);
    
    if (!state.available.includes(employee)) {
        state.available.push(employee);
    }
    
    if (source === 'available') {
        initAvailableStaff();
    } else if (source === 'vacation') {
        initUnavailableSection('vacation', 'vacationStaff');
    } else if (source === 'sickLeave') {
        initUnavailableSection('sickLeave', 'sickLeaveStaff');
    } else if (source === 'dayOff') {
        initUnavailableSection('dayOff', 'dayOffStaff');
    } else if (state.assignments[source]) {
        updateSectionEmployees(source);
        initAvailableStaff();
    }
    
    updateCounters();
    showToast(`${employee} удален`, 'info');
    saveState();
}

// Сброс всех данных
function resetAll() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('resetModal'));
    modal.hide();
    
    state = {
        available: [...employees],
        vacation: [],
        sickLeave: [],
        dayOff: [],
        assignments: {},
        isCompactMode: state.isCompactMode,
        lastUpdated: Date.now()
    };
    
    initAssignmentTable();
    initAvailableStaff();
    initUnavailableStaff();
    showToast('Все данные сброшены', 'success');
    saveState();
}

// ====================== РАБОТА С ЛОКАЛЬНЫМ ХРАНИЛИЩЕМ ======================

// Сохранение состояния в LocalStorage
function saveState() {
    state.lastUpdated = Date.now();
    localStorage.setItem(sessionId, JSON.stringify(state));
    updateSyncStatus(true);
    
    // Сохраняем также в sessionStorage для текущей вкладки
    sessionStorage.setItem(sessionId, JSON.stringify(state));
}

// Загрузка состояния из LocalStorage
function loadState() {
    const savedState = localStorage.getItem(sessionId);
    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            state.available = parsedState.available || [...employees];
            state.vacation = parsedState.vacation || [];
            state.sickLeave = parsedState.sickLeave || [];
            state.dayOff = parsedState.dayOff || [];
            state.assignments = parsedState.assignments || {};
            state.isCompactMode = parsedState.isCompactMode || false;
            state.lastUpdated = parsedState.lastUpdated || Date.now();
            
            initAssignmentTable();
            initAvailableStaff();
            initUnavailableStaff();
            updateCounters();
            
            if (parsedState.isCompactMode) {
                document.body.classList.add('compact-mode');
                const icon = document.querySelector('#toggleCompact i');
                icon.classList.remove('bi-arrows-angle-contract');
                icon.classList.add('bi-arrows-angle-expand');
            }
            
            updateSyncStatus(true);
            showToast('Состояние загружено', 'success');
        } catch (e) {
            console.error('Ошибка загрузки состояния:', e);
        }
    }
}

// Проверка изменений в других вкладках
function setupStorageListener() {
    window.addEventListener('storage', (event) => {
        if (event.key === sessionId && event.newValue) {
            try {
                const newState = JSON.parse(event.newValue);
                if (newState.lastUpdated > state.lastUpdated) {
                    state = newState;
                    initAssignmentTable();
                    initAvailableStaff();
                    initUnavailableStaff();
                    updateCounters();
                    
                    if (state.isCompactMode) {
                        document.body.classList.add('compact-mode');
                        const icon = document.querySelector('#toggleCompact i');
                        icon.classList.remove('bi-arrows-angle-contract');
                        icon.classList.add('bi-arrows-angle-expand');
                    } else {
                        document.body.classList.remove('compact-mode');
                        const icon = document.querySelector('#toggleCompact i');
                        icon.classList.remove('bi-arrows-angle-expand');
                        icon.classList.add('bi-arrows-angle-contract');
                    }
                    
                    updateSyncStatus(true);
                    showToast('Обновление от другой вкладки', 'info');
                }
            } catch (e) {
                console.error('Ошибка обработки обновления:', e);
            }
        }
    });
}

// Обновление статуса синхронизации
function updateSyncStatus(isSynced) {
    const syncStatus = document.getElementById('syncStatus');
    if (isSynced) {
        syncStatus.classList.add('active');
        syncStatus.querySelector('i').style.color = '#28a745';
        syncStatus.querySelector('span').textContent = 'Синхронизировано';
        syncStatus.title = 'Данные синхронизированы между вкладками';
    } else {
        syncStatus.classList.remove('active');
        syncStatus.querySelector('i').style.color = '#6c757d';
        syncStatus.querySelector('span').textContent = 'Локальная версия';
        syncStatus.title = 'Изменения не сохранены';
    }
}

// ====================== РАБОТА С АРХИВОМ ======================

// Сохранение в архив
function saveToArchive(shiftName, shiftData) {
    try {
        document.getElementById('saveBtnText').classList.add('d-none');
        document.getElementById('saveBtnSpinner').classList.remove('d-none');
        
        const archive = JSON.parse(localStorage.getItem('staff-placement-archive') || '[]');
        const newItem = {
            id: generateId(),
            name: shiftName,
            data: shiftData,
            createdAt: new Date().toISOString()
        };
        
        archive.unshift(newItem); // Добавляем в начало массива
        localStorage.setItem('staff-placement-archive', JSON.stringify(archive));
        
        showToast(`Смена "${shiftName}" сохранена в архив`, 'success');
        return true;
    } catch (error) {
        console.error("Ошибка сохранения:", error);
        showToast('Ошибка сохранения: ' + error.message, 'danger');
        return false;
    } finally {
        document.getElementById('saveBtnText').classList.remove('d-none');
        document.getElementById('saveBtnSpinner').classList.add('d-none');
    }
}

// Загрузка архива
function loadArchive() {
    try {
        const archive = JSON.parse(localStorage.getItem('staff-placement-archive')) || [];
        return archive.map(item => ({
            id: item.id,
            name: item.name,
            date: new Date(item.createdAt).toLocaleString(),
            data: item.data
        }));
    } catch (error) {
        console.error("Ошибка загрузки архива:", error);
        return [];
    }
}

// Удаление из архива
function deleteFromArchive(shiftId) {
    try {
        const archive = JSON.parse(localStorage.getItem('staff-placement-archive')) || [];
        const updatedArchive = archive.filter(item => item.id !== shiftId);
        localStorage.setItem('staff-placement-archive', JSON.stringify(updatedArchive));
        
        showToast('Смена удалена из архива', 'success');
        return true;
    } catch (error) {
        console.error("Ошибка удаления:", error);
        showToast('Ошибка удаления: ' + error.message, 'danger');
        return false;
    }
}

// Показать архив
async function showArchive() {
    try {
        const archiveList = document.getElementById('archiveList');
        archiveList.innerHTML = '<p class="text-center my-3"><span class="loading-spinner"></span> Загрузка...</p>';
        
        const shifts = loadArchive();
        
        archiveList.innerHTML = '';
        
        if (shifts.length === 0) {
            archiveList.innerHTML = '<p class="text-muted text-center my-3">Архив пуст</p>';
        } else {
            shifts.forEach((item) => {
                const archiveItem = document.createElement('div');
                archiveItem.className = 'archive-item';
                archiveItem.innerHTML = `
                    <div>
                        <strong>${item.name}</strong>
                        <div class="text-muted small">${item.date}</div>
                    </div>
                    <div class="archive-actions">
                        <button data-id="${item.id}" class="btn btn-sm btn-outline-primary load-archive-btn">
                            <i class="bi bi-upload"></i>
                        </button>
                        <button data-id="${item.id}" class="btn btn-sm btn-outline-danger delete-archive-btn">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                `;
                archiveList.appendChild(archiveItem);
            });
        }
        
        const modal = new bootstrap.Modal(document.getElementById('archiveModal'));
        modal.show();
    } catch (error) {
        console.error("Ошибка загрузки архива:", error);
        showToast('Ошибка загрузки архива', 'danger');
    }
}

// Загрузка смены из архива
function loadShiftFromArchive(shiftId) {
    try {
        const archive = JSON.parse(localStorage.getItem('staff-placement-archive')) || [];
        const shift = archive.find(item => item.id === shiftId);
        
        if (!shift) {
            throw new Error('Смена не найдена');
        }
        
        state.available = [...shift.data.available];
        state.vacation = [...shift.data.vacation];
        state.sickLeave = [...shift.data.sickLeave];
        state.dayOff = [...shift.data.dayOff];
        state.assignments = JSON.parse(JSON.stringify(shift.data.assignments));
        state.lastUpdated = Date.now();
        
        initAssignmentTable();
        initAvailableStaff();
        initUnavailableStaff();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('archiveModal'));
        modal.hide();
        
        saveState();
        showToast(`Смена "${shift.name}" загружена`, 'success');
    } catch (error) {
        console.error("Ошибка загрузки смены:", error);
        showToast('Ошибка загрузки смены', 'danger');
    }
}

// Показать toast-уведомление
function showToast(message, type = 'info') {
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    document.getElementById('toastContainer').appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    
    setTimeout(() => {
        toastEl.remove();
    }, 3000);
}

// Переключение компактного режима
function toggleCompactMode() {
    state.isCompactMode = !state.isCompactMode;
    document.body.classList.toggle('compact-mode', state.isCompactMode);
    
    const icon = document.querySelector('#toggleCompact i');
    if (state.isCompactMode) {
        icon.classList.remove('bi-arrows-angle-contract');
        icon.classList.add('bi-arrows-angle-expand');
        showToast('Компактный режим включен', 'info');
    } else {
        icon.classList.remove('bi-arrows-angle-expand');
        icon.classList.add('bi-arrows-angle-contract');
        showToast('Компактный режим выключен', 'info');
    }
    
    saveState();
}

// Инициализация модальных окон
function initModals() {
    // Архив
    document.getElementById('archiveBtn').addEventListener('click', showArchive);
    
    // Сохранение
    document.getElementById('saveBtn').addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('saveModal'));
        modal.show();
        document.getElementById('shiftName').focus();
    });
    
    document.getElementById('confirmSaveBtn').addEventListener('click', async () => {
        const shiftName = document.getElementById('shiftName').value;
        if (!shiftName.trim()) {
            showToast('Введите название смены', 'warning');
            return;
        }
        
        const shiftData = {
            available: [...state.available],
            vacation: [...state.vacation],
            sickLeave: [...state.sickLeave],
            dayOff: [...state.dayOff],
            assignments: JSON.parse(JSON.stringify(state.assignments))
        };
        
        const success = saveToArchive(shiftName, shiftData);
        if (success) {
            document.getElementById('shiftName').value = '';
            const modal = bootstrap.Modal.getInstance(document.getElementById('saveModal'));
            modal.hide();
        }
    });
    
    // Сброс
    document.getElementById('resetBtn').addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('resetModal'));
        modal.show();
    });
    
    document.getElementById('confirmResetBtn').addEventListener('click', resetAll);
    
    // Обработчики для кнопок архива
    document.addEventListener('click', (e) => {
        if (e.target.closest('.load-archive-btn')) {
            const btn = e.target.closest('.load-archive-btn');
            loadShiftFromArchive(btn.dataset.id);
        } else if (e.target.closest('.delete-archive-btn')) {
            const btn = e.target.closest('.delete-archive-btn');
            Swal.fire({
                title: 'Удалить смену?',
                text: "Вы уверены, что хотите удалить эту смену?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Да, удалить!',
                cancelButtonText: 'Отмена'
            }).then((result) => {
                if (result.isConfirmed) {
                    deleteFromArchive(btn.dataset.id);
                    showArchive();
                }
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const staffContainer = document.querySelector('.staff-list-container');
    const toggleBtn = document.getElementById('toggleStaffList');
    const icon = toggleBtn.querySelector('i');

    toggleBtn.addEventListener('click', () => {
        staffContainer.classList.toggle('open');
        icon.classList.toggle('bi-chevron-up');
        icon.classList.toggle('bi-chevron-down');
    });
});

// Инициализация приложения
function init() {
    initAssignmentTable();
    initAvailableStaff();
    initUnavailableStaff();
    setupDropzones();
    initModals();
    updateTotalCounters();
    loadState();
    setupStorageListener();
    
    document.getElementById('toggleCompact').addEventListener('click', toggleCompactMode);
    
    // Автосохранение при закрытии вкладки
    window.addEventListener('beforeunload', () => {
        saveState();
    });
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);