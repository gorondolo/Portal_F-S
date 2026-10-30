// ============================================
// DASHBOARD EMPLEADO V2 - REFACTORIZADO
// ============================================

// MODULO DE CONFIGURACIÓN GLOBAL
const AppConfig = {
    appName: 'Frutos y Semillas',
    version: '2.0',
    employeeRole: 'Empleado',
    theme: localStorage.getItem('theme') || 'light',
    userPermissions: ['view', 'create', 'comment'],
    storageKeys: {
        userPreferences: 'employee_preferences'
    }
};

const esc = PortalUtils.esc;
const formatDate = PortalUtils.formatDate;

// USUARIO QUE TIENE LA SESIÓN ABIERTA
const CurrentUser = {
    name: function() {
        const element = document.getElementById('userName');
        return element ? element.textContent : 'Empleado';
    },

    // Registro del empleado en el directorio (o undefined si no está)
    record: function() {
        return PortalStore.get('employees').find(emp => emp.name === this.name());
    },

    tasks: function() {
        return PortalStore.get('tasks').filter(task => task.assignedTo === this.name());
    },

    tickets: function() {
        return PortalStore.get('tickets').filter(ticket => !ticket.employeeName || ticket.employeeName === this.name());
    }
};

// ============================================
// MÓDULO DE NAVEGACIÓN
// ============================================
const NavigationModule = {
    currentSection: 'dashboard',

    init: function() {
        this.loadDashboardData();
    },

    switchSection: function(sectionId, menuElement) {
        if (!this.hasPermission('view')) {
            AlertModule.show('No tienes permiso para acceder a esta sección', 'error');
            return;
        }

        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
            section.classList.remove('active');
        });

        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            item.classList.add('border-transparent');
        });

        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('hidden');
            section.classList.add('active');
            this.currentSection = sectionId;
        }

        if (menuElement) {
            menuElement.classList.add('active');
            menuElement.classList.remove('border-transparent');
            menuElement.classList.add('border-[#00A8B5]');
        }

        this.renderSection(sectionId);
        AuditModule.log('Navegó a', sectionId);
        this.saveUserPreference('lastSection', sectionId);
    },

    // Carga los datos de la sección que se acaba de abrir
    renderSection: function(sectionId) {
        const renderers = {
            dashboard: () => this.loadDashboardData(),
            permisos: () => loadPermissionHistory('todas'),
            directorio: () => this.filterDirectory(''),
            anuncios: () => this.renderAnnouncements(),
            tickets: () => this.renderTickets(),
            calendario: () => this.renderCalendar(),
            tareas: () => this.filterTasks('all'),
            perfil: () => this.renderProfile()
        };

        if (renderers[sectionId]) renderers[sectionId]();
    },

    hasPermission: function(action) {
        return AppConfig.userPermissions.includes(action);
    },

    saveUserPreference: function(key, value) {
        let preferences = JSON.parse(localStorage.getItem(AppConfig.storageKeys.userPreferences) || '{}');
        preferences[key] = value;
        localStorage.setItem(AppConfig.storageKeys.userPreferences, JSON.stringify(preferences));
    },

    loadDashboardData: function() {
        const tasksElement = document.getElementById('tasksCount');
        const permissionsElement = document.getElementById('pendingPermissions');
        const ticketsElement = document.getElementById('ticketsCount');
        const announcementsElement = document.getElementById('announcementsCount');

        const tasks = CurrentUser.tasks();
        const announcements = PortalStore.get('announcements');

        if (tasksElement) tasksElement.textContent = tasks.filter(t => t.status === 'pending').length;
        if (permissionsElement) permissionsElement.textContent = PortalStore.get('permissions').filter(p => p.status === 'pending').length;
        if (ticketsElement) ticketsElement.textContent = CurrentUser.tickets().length;
        if (announcementsElement) announcementsElement.textContent = announcements.length;

        const recentTasks = document.getElementById('recentTasks');
        if (recentTasks) {
            const latest = tasks.slice(-3).reverse();
            recentTasks.innerHTML = latest.length ? latest.map(task => `
                <div class="flex justify-between items-start pb-3 border-b border-gray-200">
                    <div>
                        <p class="font-semibold text-gray-800">${esc(task.title)}</p>
                        <p class="text-sm text-gray-600">Vence: ${formatDate(task.dueDate)}</p>
                    </div>
                    ${PortalUtils.statusBadge(task.status)}
                </div>
            `).join('') : PortalUtils.empty('No tienes tareas asignadas');
        }

        const recentAnnouncements = document.getElementById('recentAnnouncements');
        if (recentAnnouncements) {
            const latest = announcements.slice(-3).reverse();
            recentAnnouncements.innerHTML = latest.length ? latest.map(item => `
                <div class="flex justify-between items-start pb-3 border-b border-gray-200">
                    <div>
                        <p class="font-semibold text-gray-800">${esc(item.title)}</p>
                        <p class="text-sm text-gray-600">${formatDate(item.date)}</p>
                    </div>
                </div>
            `).join('') : PortalUtils.empty('No hay anuncios');
        }
    },

    filterDirectory: function(searchTerm) {
        const term = searchTerm.toLowerCase();
        const filtered = PortalStore.get('employees').filter(emp =>
            emp.status === 'active' &&
            (emp.name.toLowerCase().includes(term) || (emp.department || '').toLowerCase().includes(term))
        );

        const directoryList = document.getElementById('directoryList');
        if (!directoryList) return;

        directoryList.innerHTML = filtered.map(emp => `
            <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
                <div class="flex items-start justify-between">
                    <div>
                        <p class="font-semibold text-gray-800">${esc(emp.name)}</p>
                        <p class="text-sm text-gray-600">${esc(emp.department)}</p>
                        <p class="text-xs text-gray-500 mt-2">${esc(emp.email)}</p>
                    </div>
                    <i class="bi bi-person-circle text-2xl text-primary"></i>
                </div>
            </div>
        `).join('');
    },

    renderAnnouncements: function() {
        const list = document.getElementById('announcementsList');
        if (!list) return;

        const announcements = PortalStore.get('announcements').slice().reverse();
        list.innerHTML = announcements.length ? announcements.map(item => {
            const important = item.priority === 'important';
            return `
                <div class="bg-gradient-to-r ${important ? 'from-blue-50 to-blue-100 border-blue-500' : 'from-gray-50 to-gray-100 border-gray-300'} p-6 rounded-lg border-l-4 shadow-sm">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-bold text-gray-800 text-lg">${esc(item.title)}</p>
                            <p class="text-gray-600 mt-2">${esc(item.description)}</p>
                            <p class="text-xs text-gray-500 mt-3">${formatDate(item.date)}</p>
                        </div>
                        ${important ? '<span class="text-xs bg-blue-200 text-blue-800 px-3 py-1 rounded">Importante</span>' : ''}
                    </div>
                </div>
            `;
        }).join('') : PortalUtils.empty('No hay anuncios');
    },

    renderTickets: function() {
        const list = document.getElementById('myTickets');
        if (!list) return;

        const tickets = CurrentUser.tickets().reverse();
        list.innerHTML = tickets.length ? tickets.map(ticket => `
            <div class="bg-gray-50 p-4 rounded-lg border-l-4 ${ticket.status === 'resolved' ? 'border-green-500' : 'border-yellow-500'}">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold text-gray-800">${esc(ticket.id)} - ${esc(ticket.subject)}</p>
                        <p class="text-sm text-gray-600">Categoría: ${esc(PortalUtils.categoryLabels[ticket.category] || ticket.category)} | Creado: ${formatDate(ticket.timestamp)}</p>
                    </div>
                    ${PortalUtils.statusBadge(ticket.status)}
                </div>
            </div>
        `).join('') : PortalUtils.empty('No has creado tickets');
    },

    renderCalendar: function() {
        const list = document.getElementById('calendarEvents');
        if (!list) return;

        const events = PortalStore.get('events').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
        list.innerHTML = events.length ? events.map(event => `
            <div class="bg-white p-4 rounded-lg border-l-4 ${event.time ? 'border-primary' : 'border-yellow-500'}">
                <p class="font-semibold text-gray-800">${esc(event.title)}</p>
                <p class="text-sm text-gray-600">${formatDate(event.date)}${event.time ? ' - ' + esc(event.time) : ' (Todo el día)'}</p>
            </div>
        `).join('') : PortalUtils.empty('No hay eventos programados');
    },

    filterTasks: function(filter) {
        const tasksList = document.getElementById('tasksList');
        if (!tasksList) return;

        let filtered = CurrentUser.tasks();

        if (filter === 'pending') {
            filtered = filtered.filter(t => t.status === 'pending');
        } else if (filter === 'completed') {
            filtered = filtered.filter(t => t.status === 'completed');
        }

        tasksList.innerHTML = filtered.length ? filtered.map(task => `
            <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-${task.status === 'completed' ? 'green' : 'yellow'}-500">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold text-gray-800 ${task.status === 'completed' ? 'line-through' : ''}">${esc(task.title)}</p>
                        <p class="text-sm text-gray-600">Asignado por: ${esc(task.assignedBy)}</p>
                        <p class="text-xs text-gray-500 mt-2">Vence: ${formatDate(task.dueDate)}</p>
                        ${task.status === 'pending' ? '<button onclick="NavigationModule.completeTask(' + task.id + ')" class="mt-3 text-primary font-semibold hover:text-primary-dark"><i class="bi bi-check2-circle"></i> Marcar como completada</button>' : ''}
                    </div>
                    ${PortalUtils.statusBadge(task.status)}
                </div>
            </div>
        `).join('') : PortalUtils.empty('No hay tareas para este filtro');
    },

    completeTask: function(id) {
        const tasks = PortalStore.get('tasks');
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        task.status = 'completed';
        PortalStore.set('tasks', tasks);
        AlertModule.show('✓ Tarea completada', 'success');
        AuditModule.log('Completó tarea', task.title);
        this.filterTasks('all');
    },

    renderProfile: function() {
        const record = CurrentUser.record();
        if (!record) return;

        const fields = {
            profileEmail: record.email,
            profilePhone: record.phone,
            profileDepartment: record.department,
            profilePosition: record.position,
            profileStartDate: formatDate(record.startDate)
        };

        Object.keys(fields).forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = fields[id] || 'Sin registrar';
        });
    }
};

// ============================================
// MÓDULO DE ALERTAS/NOTIFICACIONES
// ============================================
const AlertModule = {
    defaultDuration: 3000,

    show: function(message, type = 'success') {
        const sanitizedMessage = this.sanitizeText(message);

        const alertBox = document.createElement('div');
        const bgColor = {
            'success': 'bg-green-500',
            'error': 'bg-red-500',
            'info': 'bg-blue-500',
            'warning': 'bg-yellow-500'
        }[type] || 'bg-blue-500';

        alertBox.className = 'fixed top-4 right-4 ' + bgColor + ' text-white px-6 py-3 rounded-lg shadow-lg z-40 alert-toast';
        alertBox.innerHTML = '<div class="flex items-center gap-3"><i class="bi bi-' + this.getIcon(type) + '"></i><span>' + sanitizedMessage + '</span><button onclick="this.parentElement.parentElement.remove()" class="ml-4 opacity-70 hover:opacity-100"><i class="bi bi-x"></i></button></div>';

        document.body.appendChild(alertBox);
        setTimeout(() => alertBox.remove(), this.defaultDuration);
    },

    sanitizeText: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    getIcon: function(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'info': 'info-circle',
            'warning': 'exclamation-triangle'
        };
        return icons[type] || 'info-circle';
    }
};

// ============================================
// MÓDULO DE SOLICITUDES (Permisos, Tickets, Formularios)
// ============================================
const RequestsModule = {
    // Campos de cada formulario disponible en la sección Formularios
    formFields: {
        'cambio-datos': [
            { name: 'campo', label: 'Dato a cambiar', type: 'select', required: true, options: [
                { value: 'Teléfono', label: 'Teléfono' },
                { value: 'Dirección', label: 'Dirección' },
                { value: 'Correo', label: 'Correo' },
                { value: 'Contacto de emergencia', label: 'Contacto de emergencia' },
                { value: 'Otro', label: 'Otro' }
            ] },
            { name: 'valor', label: 'Nuevo valor', required: true },
            { name: 'motivo', label: 'Motivo', type: 'textarea' }
        ],
        'incidente': [
            { name: 'fecha', label: 'Fecha del incidente', type: 'date', required: true },
            { name: 'lugar', label: 'Lugar', required: true },
            { name: 'descripcion', label: 'Descripción', type: 'textarea', required: true }
        ]
    },

    submitPermissionRequest: function(event) {
        event.preventDefault();

        if (!this.validateAction('create')) return;

        const type = document.getElementById('permissionType').value;
        const startDate = document.getElementById('permissionStart').value;
        const endDate = document.getElementById('permissionEnd').value;
        const reason = document.getElementById('permissionReason').value;

        if (!validateInput(reason, 'text')) {
            AlertModule.show('Por favor completa todos los campos', 'error');
            return;
        }

        if (endDate < startDate) {
            AlertModule.show('La fecha fin no puede ser anterior a la fecha inicio', 'error');
            return;
        }

        const request = {
            id: Date.now(),
            employeeId: 'EMP-001',
            employeeName: CurrentUser.name(),
            type: type,
            startDate: startDate,
            endDate: endDate,
            reason: reason,
            status: 'pending',
            adminComment: '',
            timestamp: new Date().toISOString()
        };

        let requests = PortalStore.get('permissions');
        requests.push(request);
        PortalStore.set('permissions', requests);

        AlertModule.show('✓ Solicitud de permiso enviada correctamente', 'success');
        AuditModule.log('Solicitud de permiso', type);

        event.target.reset();

        // Reload permission history
        loadPermissionHistory('todas');
    },

    submitTicket: function(event) {
        event.preventDefault();

        if (!this.validateAction('create')) return;

        const category = document.getElementById('ticketCategory').value;
        const subject = document.getElementById('ticketSubject').value;
        const description = document.getElementById('ticketDescription').value;
        const priority = document.getElementById('ticketPriority').value;

        if (!validateInput(subject, 'text') || !validateInput(description, 'text')) {
            AlertModule.show('Por favor completa todos los campos', 'error');
            return;
        }

        const ticket = {
            id: 'TKT-' + Date.now(),
            category: category,
            subject: subject,
            description: description,
            priority: priority,
            status: 'open',
            employeeName: CurrentUser.name(),
            timestamp: new Date().toISOString()
        };

        let tickets = PortalStore.get('tickets');
        tickets.push(ticket);
        PortalStore.set('tickets', tickets);

        AlertModule.show('✓ Ticket creado correctamente: ' + ticket.id, 'success');
        AuditModule.log('Creó ticket', subject);

        event.target.reset();
        NavigationModule.renderTickets();
    },

    openForm: function(formType) {
        const fields = this.formFields[formType];
        if (!fields || !this.validateAction('create')) return;

        ModalModule.open(PortalUtils.formLabels[formType], fields, function(values) {
            const submissions = PortalStore.get('forms');
            submissions.push({
                id: Date.now(),
                formType: formType,
                employeeName: CurrentUser.name(),
                data: fields.map(field => ({ label: field.label, value: values[field.name] })),
                status: 'pending',
                timestamp: new Date().toISOString()
            });
            PortalStore.set('forms', submissions);

            AlertModule.show('✓ Formulario enviado al administrador', 'success');
            AuditModule.log('Envió formulario', PortalUtils.formLabels[formType]);
        }, 'Enviar');
    },

    editProfile: function() {
        const employees = PortalStore.get('employees');
        const record = employees.find(emp => emp.name === CurrentUser.name());
        if (!record) {
            AlertModule.show('Tu usuario no está en el directorio. Pide al administrador que te registre.', 'warning');
            return;
        }

        ModalModule.open('Editar Perfil', [
            { name: 'phone', label: 'Teléfono', value: record.phone, required: true }
        ], function(values) {
            if (!validateInput(values.phone, 'phone')) {
                AlertModule.show('Ingresa un teléfono válido', 'error');
                return;
            }

            record.phone = values.phone;
            PortalStore.set('employees', employees);
            AlertModule.show('✓ Perfil actualizado', 'success');
            AuditModule.log('Actualizó perfil', 'Teléfono');
            NavigationModule.renderProfile();
        });
    },

    validateAction: function(action) {
        if (!AppConfig.userPermissions.includes(action)) {
            AlertModule.show('No tienes permiso para realizar esta acción', 'error');
            return false;
        }
        return true;
    }
};

// ============================================
// MÓDULO DE AUDITORÍA
// ============================================
const AuditModule = {
    log: function(action, details) {
        const userNameElement = document.getElementById('userName');
        const userName = userNameElement ? userNameElement.textContent : 'Usuario Anónimo';

        const auditLog = {
            user: userName,
            action: action,
            details: details,
            timestamp: new Date().toLocaleString('es-CO'),
            section: NavigationModule.currentSection
        };

        let logs = PortalStore.get('audit');
        logs.push(auditLog);

        if (logs.length > 100) {
            logs = logs.slice(-100);
        }

        PortalStore.set('audit', logs);
    }
};

// ============================================
// MÓDULO DE SIDEBAR
// ============================================
const SidebarModule = {
    isOpen: true,

    toggle: function() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            sidebar.style.marginLeft = '0';
        } else {
            sidebar.style.marginLeft = '-100%';
        }
    }
};

// ============================================
// MÓDULO DE AUTENTICACIÓN
// ============================================
const AuthModule = {
    logout: function() {
        const modal = document.getElementById('modalLogout');
        if (modal) {
            modal.classList.remove('hidden');
        }
    },

    confirmLogout: function() {
        AuditModule.log('Cerró sesión', 'Logout manual');
        localStorage.removeItem('currentSession');
        localStorage.removeItem('isLoggedIn');

        setTimeout(() => {
            window.location.href = 'login-nuevo.html';
        }, 300);
    },

    cancelLogout: function() {
        const modal = document.getElementById('modalLogout');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
};

// ============================================
// FUNCIONES GLOBALES (Legacy)
// ============================================

function toggleSidebar() {
    SidebarModule.toggle();
}

function switchSection(sectionId, menuElement) {
    NavigationModule.switchSection(sectionId, menuElement);
}

function logout() {
    AuthModule.logout();
}

function showAlert(message, type) {
    if (type === undefined) type = 'success';
    AlertModule.show(message, type);
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateInput(input, type) {
    if (type === undefined) type = 'text';

    if (!input || input.trim() === '') return false;

    switch(type) {
        case 'email':
            return validateEmail(input);
        case 'password':
            return input.length >= 8;
        case 'phone':
            return /^\+?[\d\s\-()]{7,}$/.test(input);
        default:
            return true;
    }
}

// ============================================
// MÓDULO DE UTILIDADES
// ============================================
const Utils = {
    debounce: function(func, delay) {
        let timeoutId;
        return function() {
            const args = arguments;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// ============================================
// FUNCIÓN DE CARGA DE HISTORIAL DE PERMISOS
// ============================================
function loadPermissionHistory(filter = 'todas') {
    const historyContainer = document.getElementById('permissionHistory');
    if (!historyContainer) return;

    const requests = PortalStore.get('permissions');

    let filtered = requests;
    if (filter === 'pending') {
        filtered = requests.filter(r => r.status === 'pending');
    } else if (filter === 'approved') {
        filtered = requests.filter(r => r.status === 'approved');
    } else if (filter === 'rejected') {
        filtered = requests.filter(r => r.status === 'rejected');
    }

    if (!filtered || filtered.length === 0) {
        historyContainer.innerHTML = '<div class="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-300 text-center text-gray-600"><p>No hay solicitudes para este filtro.</p></div>';
        return;
    }

    historyContainer.innerHTML = filtered.map(req => {
        const statusColor = req.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-500' :
                           req.status === 'approved' ? 'bg-green-100 text-green-800 border-green-500' :
                           'bg-red-100 text-red-800 border-red-500';

        const borderColor = req.status === 'pending' ? 'border-yellow-500' :
                           req.status === 'approved' ? 'border-green-500' :
                           'border-red-500';

        const statusText = req.status === 'pending' ? 'Pendiente' :
                          req.status === 'approved' ? 'Aprobada' :
                          'Rechazada';

        return `<div class="bg-white p-4 rounded-lg border-l-4 ${borderColor} shadow-sm">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <p class="font-semibold text-gray-800">${esc(req.type.replace(/_/g, ' ').toUpperCase())}</p>
                    <p class="text-sm text-gray-600">${formatDate(req.startDate)} a ${formatDate(req.endDate)}</p>
                </div>
                <span class="text-xs px-3 py-1 rounded font-semibold ${statusColor}">${statusText}</span>
            </div>
            <p class="text-sm text-gray-700 mb-2">Motivo: ${esc(req.reason)}</p>
            ${req.adminComment ? `<p class="text-sm text-gray-600 italic">Comentario del Admin: ${esc(req.adminComment)}</p>` : ''}
            <p class="text-xs text-gray-500 mt-2">Solicitado: ${new Date(req.timestamp).toLocaleDateString('es-CO')}</p>
        </div>`;
    }).join('');
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard Empleado V2 inicializado');

    NavigationModule.init();
    loadPermissionHistory('todas');

    const logoutModal = document.getElementById('modalLogout');
    if (logoutModal) {
        logoutModal.addEventListener('click', function(e) {
            if (e.target === this) {
                AuthModule.cancelLogout();
            }
        });
    }
});

console.log('✅ Dashboard Empleado V2 cargado correctamente');
