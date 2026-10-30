// ============================================
// DASHBOARD ADMINISTRADOR V2
// ============================================

const AppConfig = {
    appName: 'Frutos y Semillas',
    version: '2.0',
    adminRole: 'Administrador',
    theme: localStorage.getItem('theme') || 'light',
    userPermissions: ['view', 'create', 'edit', 'delete', 'approve'],
    storageKeys: {
        userPreferences: 'admin_preferences'
    }
};

const esc = PortalUtils.esc;
const formatDate = PortalUtils.formatDate;
const BTN_SMALL = 'px-3 py-1 rounded text-sm font-semibold text-white btn-transition';

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function avatarHtml(employee) {
    return employee.avatar
        ? '<img src="' + esc(employee.avatar) + '" alt="" class="w-12 h-12 rounded-full object-cover flex-shrink-0">'
        : '<i class="bi bi-person-circle text-4xl text-primary"></i>';
}

// ============================================
// MÓDULO DE NAVEGACIÓN
// ============================================
// ============================================
// MÓDULO DE ALERTAS - CON MODALES PREEXISTENTES
// ============================================
const AlertModule = {
    currentCallback: null,
    
    // Mostrar modal de confirmación (Aceptar/Cancelar)
    showConfirm: function(title, message, onConfirm, onCancel) {
        const modal = document.getElementById('alertModal');
        const icon = document.getElementById('alertIcon');
        
        // Configurar contenido
        document.getElementById('alertTitle').textContent = title;
        document.getElementById('alertMessage').textContent = message;
        
        // Icono amarillo para confirmación
        icon.className = 'alert-modal-icon warning';
        icon.innerHTML = '<i class="bi bi-exclamation-circle"></i>';
        
        // Guardar callbacks
        this.currentCallback = onConfirm;
        const cancelCallback = onCancel;
        
        // Botones
        const confirmBtn = document.getElementById('alertConfirm');
        const cancelBtn = document.getElementById('alertCancel');
        
        // Limpiar listeners anteriores
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        
        // Nuevos listeners
        confirmBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            if (onConfirm) onConfirm();
        });
        
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            if (onCancel) onCancel();
        });
        
        // Mostrar modal
        modal.classList.add('show');
    },
    
    // Mostrar modal de resultado (éxito/error)
    showResult: function(title, message, type) {
        const modal = document.getElementById('resultModal');
        const icon = document.getElementById('resultIcon');
        const button = document.getElementById('resultClose');
        
        // Configurar contenido
        document.getElementById('resultTitle').textContent = title;
        document.getElementById('resultMessage').textContent = message;
        
        // Icono según tipo
        if (type === 'success') {
            icon.className = 'alert-modal-icon success';
            icon.innerHTML = '<i class="bi bi-check-circle"></i>';
            button.className = 'btn-confirm';
        } else if (type === 'error') {
            icon.className = 'alert-modal-icon error';
            icon.innerHTML = '<i class="bi bi-x-circle"></i>';
            button.className = 'btn-confirm error';
        }
        
        // Botón para cerrar
        button.onclick = null;
        button.addEventListener('click', () => {
            modal.classList.remove('show');
        });
        
        // Mostrar modal
        modal.classList.add('show');
    },
    
    // Cerrar cualquier modal
    closeModal: function() {
        document.getElementById('alertModal').classList.remove('show');
        document.getElementById('resultModal').classList.remove('show');
    }
};

//============================================
//MÓDULO PARA DETECTAR CONEXIÓN A INTERNET
//============================================
const ConnectionModule = {
    isOnline: navigator.onLine,
    
    init: function() {
        // Verificar conexión al cargar
        if (!navigator.onLine) {
            this.showOfflineAlert();
        }
        
        // Escuchar cambios de conexión
        window.addEventListener('online', () => {
            this.handleOnline();
        });
        
        window.addEventListener('offline', () => {
            this.handleOffline();
        });
        
        // Verificación periódica (cada 5 segundos)
        setInterval(() => {
            this.checkConnection();
        }, 5000);
    },
    
    checkConnection: function() {
        // Intentar hacer ping a un servidor
        fetch('https://www.google.com/favicon.ico', { 
            method: 'HEAD',
            no_cors: 'no-cors'
        })
        .then(() => {
            if (!this.isOnline) {
                this.handleOnline();
            }
        })
        .catch(() => {
            if (this.isOnline) {
                this.handleOffline();
            }
        });
    },
    
    handleOffline: function() {
        this.isOnline = false;
        this.showOfflineAlert();
    },
    
    handleOnline: function() {
        this.isOnline = true;
        this.hideOfflineAlert();
    },
    
    showOfflineAlert: function() {
        const modal = document.getElementById('offlineModal');
        if (modal && !modal.classList.contains('show')) {
            modal.classList.add('show');
        }
    },
    
    hideOfflineAlert: function() {
        const modal = document.getElementById('offlineModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
};

//Inicializar cuando carga la página
window.addEventListener('load', function(){
    ConnectionModule.init();
});



// ============================================
// MÓDULO DE CUENTAS PENDIENTES
// (solicitudes de registro y de cambio de contraseña del login)
// ============================================
const AccountsModule = {
    pendingCount: function() {
        return PortalStore.get('pendingUsers').filter(u => u.status === 'pending').length +
               PortalStore.get('passwordResets').filter(r => r.status === 'pending').length;
    },

    render: function() {
        const accountsList = document.getElementById('pendingAccountsList');
        const resetsList = document.getElementById('passwordResetsList');
        if (!accountsList || !resetsList) return;

        // Se conserva el índice original para poder actualizar la solicitud correcta
        const accounts = PortalStore.get('pendingUsers')
            .map((user, index) => ({ user: user, index: index }))
            .filter(item => item.user.status === 'pending');

        accountsList.innerHTML = accounts.length ? accounts.map(item => `
            <div class="p-4 rounded-lg border-l-4 border-yellow-500 bg-gray-50 flex flex-wrap items-center gap-4">
                ${avatarHtml(item.user)}
                <div class="flex-1">
                    <p class="font-semibold text-gray-800">${esc(item.user.username)}</p>
                    <p class="text-sm text-gray-600">${esc(item.user.email)}</p>
                    <p class="text-xs text-gray-500 mt-1">Solicitado: ${formatDate(item.user.requestedAt)}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="AccountsModule.approve(${item.index})" class="${BTN_SMALL} bg-green-500 hover:bg-green-600">Aprobar</button>
                    <button onclick="AccountsModule.reject(${item.index})" class="${BTN_SMALL} bg-red-500 hover:bg-red-600">Rechazar</button>
                </div>
            </div>
        `).join('') : PortalUtils.empty('No hay cuentas por aprobar. Las solicitudes de "Crear cuenta" del login aparecen aquí.');

        const resets = PortalStore.get('passwordResets')
            .map((request, index) => ({ request: request, index: index }))
            .filter(item => item.request.status === 'pending');

        resetsList.innerHTML = resets.length ? resets.map(item => `
            <div class="p-4 rounded-lg border-l-4 border-yellow-500 bg-gray-50 flex flex-wrap items-center gap-4">
                <i class="bi bi-key text-3xl text-primary"></i>
                <div class="flex-1">
                    <p class="font-semibold text-gray-800">${esc(item.request.email)}</p>
                    <p class="text-xs text-gray-500 mt-1">Solicitado: ${formatDate(item.request.requestedAt)}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="AccountsModule.resolveReset(${item.index}, 'approved')" class="${BTN_SMALL} bg-green-500 hover:bg-green-600">Aprobar</button>
                    <button onclick="AccountsModule.resolveReset(${item.index}, 'rejected')" class="${BTN_SMALL} bg-red-500 hover:bg-red-600">Rechazar</button>
                </div>
            </div>
        `).join('') : PortalUtils.empty('No hay solicitudes de cambio de contraseña.');

        NavigationModule.loadDashboardData();
    },

    approve: function(index) {
        const users = PortalStore.get('pendingUsers');
        const user = users[index];
        if (!user) return;

        // Confirmación inicial
        if (!confirm('¿Aprobar la solicitud de ' + user.username + '?')) return;

        ModalModule.open('Aprobar cuenta de ' + user.username, [
            { name: 'role', label: 'Rol', type: 'select', required: true, options: [
                { value: 'Empleado', label: 'Empleado' },
                { value: 'Administrador', label: 'Administrador' }
            ] },
            { name: 'department', label: 'Departamento', required: true },
            { name: 'position', label: 'Cargo' }
        ], function(values) {
            const employees = PortalStore.get('employees');
            employees.push({
                id: Date.now(),
                name: user.username,
                email: user.email,
                department: values.department,
                position: values.position,
                phone: '',
                startDate: PortalUtils.today(),
                role: values.role,
                avatar: user.avatar,
                status: 'active'
            });
            PortalStore.set('employees', employees);

            user.status = 'approved';
            user.role = values.role;
            PortalStore.set('pendingUsers', users);

            AuditModule.log('Aprobó cuenta', user.username + ' (' + values.role + ')');

            // Alerta modal de éxito
            AlertModule.showModal(
                '¡Solicitud aprobada!',
                'La cuenta de ' + user.username + ' ha sido aprobada como ' + values.role + '. El usuario podrá acceder al sistema ahora.',
                'success',
                'AccountsModule.render();'
            );
        }, 'Aprobar');
    },

    reject: function(index) {
        const users = PortalStore.get('pendingUsers');
        const user = users[index];
        if (!user || !confirm('¿Rechazar la solicitud de ' + user.username + '?')) return;

        user.status = 'rejected';
        PortalStore.set('pendingUsers', users);
        AlertModule.show('Solicitud rechazada', 'success');
        AuditModule.log('Rechazó cuenta', user.username);
        this.render();
    },

    resolveReset: function(index, status) {
        const resets = PortalStore.get('passwordResets');
        const request = resets[index];
        if (!request) return;

        // Confirmación según la acción
        const actionText = status === 'approved' ? 'Aprobar' : 'Rechazar';
        if (!confirm('¿' + actionText + ' el cambio de contraseña de ' + request.email + '?')) return;

        request.status = status;
        PortalStore.set('passwordResets', resets);

        const isApproved = status === 'approved';
        AuditModule.log(isApproved ? 'Aprobó cambio de contraseña' : 'Rechazó cambio de contraseña', request.email);

        // Alerta modal de éxito
        AlertModule.showModal(
            isApproved ? '¡Cambio aprobado!' : '¡Cambio rechazado!',
            isApproved
                ? 'El usuario ' + request.email + ' podrá acceder con su nueva contraseña.'
                : 'La solicitud de cambio de contraseña para ' + request.email + ' ha sido rechazada.',
            isApproved ? 'success' : 'error',
            'AccountsModule.render();'
        );
    }
};

// ============================================
// MÓDULO DE PERMISOS Y VACACIONES
// ============================================
const PermissionsModule = {
    loadRequests: function() {
        this.displayRequests(PortalStore.get('permissions'));
    },

    filterRequests: function(filter) {
        const all = PortalStore.get('permissions');
        this.displayRequests(filter === 'all' ? all : all.filter(r => r.status === filter));
    },

    displayRequests: function(requests) {
        const list = document.getElementById('permissionsList');
        const empty = document.getElementById('emptyMessage');

        if (!list) return;

        if (!requests || requests.length === 0) {
            list.innerHTML = '';
            if (empty) empty.classList.remove('hidden');
            return;
        }

        if (empty) empty.classList.add('hidden');

        list.innerHTML = requests.map(req => {
            const buttons = req.status === 'pending' ?
                '<button onclick="PermissionsModule.approveRequest(' + req.id + ')" class="flex-1 bg-green-500 text-white px-3 py-2 rounded mr-2 hover:bg-green-600">Aprobar</button>' +
                '<button onclick="PermissionsModule.rejectRequest(' + req.id + ')" class="flex-1 bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600">Rechazar</button>'
                : '';

            return '<div class="bg-white p-4 rounded-lg border-l-4 border-primary shadow-sm mb-4">' +
                '<div class="flex justify-between items-start mb-2">' +
                '<div><p class="font-semibold">' + esc(req.employeeName) + '</p>' +
                '<p class="text-sm text-gray-600">' + esc(PortalUtils.permissionLabels[req.type] || req.type) + ' - ' + formatDate(req.startDate) + ' a ' + formatDate(req.endDate) + '</p></div>' +
                PortalUtils.statusBadge(req.status) +
                '</div>' +
                '<p class="text-sm text-gray-700 mb-2">Motivo: ' + esc(req.reason) + '</p>' +
                (req.adminComment ? '<p class="text-sm text-gray-600 italic">Comentario: ' + esc(req.adminComment) + '</p>' : '') +
                (buttons ? '<div class="flex gap-2 mt-3">' + buttons + '</div>' : '') +
                '</div>';
        }).join('');
    },

    approveRequest: function(id) {
        const comment = prompt('Agregar comentario (opcional):');
        const reqs = PortalStore.get('permissions');
        const req = reqs.find(r => r.id === id);

        if (req) {
            req.status = 'approved';
            req.adminComment = comment || 'Aprobado';
            PortalStore.set('permissions', reqs);
            AlertModule.show('Solicitud aprobada', 'success');
            AuditModule.log('Aprobó permiso', req.employeeName);
            this.loadRequests();
        }
    },

    rejectRequest: function(id) {
        const reason = prompt('Motivo del rechazo (requerido):');
        if (!reason) {
            AlertModule.show('Debes ingresar un motivo', 'error');
            return;
        }

        const reqs = PortalStore.get('permissions');
        const req = reqs.find(r => r.id === id);

        if (req) {
            req.status = 'rejected';
            req.adminComment = reason;
            PortalStore.set('permissions', reqs);
            AlertModule.show('Solicitud rechazada', 'success');
            AuditModule.log('Rechazó permiso', req.employeeName);
            this.loadRequests();
        }
    }
};

// ============================================
// MÓDULO DE DIRECTORIO
// ============================================
const DirectoryModule = {
    render: function(searchTerm) {
        const list = document.getElementById('directoryList');
        if (!list) return;

        const term = (searchTerm || '').toLowerCase();
        const employees = PortalStore.get('employees').filter(emp =>
            emp.status === 'active' &&
            (emp.name.toLowerCase().includes(term) || (emp.department || '').toLowerCase().includes(term))
        );

        list.innerHTML = employees.length ? employees.map(emp => `
            <div class="bg-gray-50 p-4 rounded-lg shadow-sm flex items-start justify-between gap-3">
                <div>
                    <p class="font-semibold text-gray-800">${esc(emp.name)}</p>
                    <p class="text-sm text-gray-600">${esc(emp.department)}${emp.position ? ' · ' + esc(emp.position) : ''}</p>
                    <p class="text-xs text-gray-500 mt-2">${esc(emp.email)}</p>
                    ${emp.phone ? '<p class="text-xs text-gray-500">' + esc(emp.phone) + '</p>' : ''}
                </div>
                ${avatarHtml(emp)}
            </div>
        `).join('') : '<div class="col-span-full">' + PortalUtils.empty('No se encontraron empleados') + '</div>';
    }
};

// ============================================
// MÓDULO DE EMPLEADOS
// ============================================
const EmployeesModule = {
    render: function() {
        const table = document.getElementById('employeesTable');
        if (!table) return;

        const employees = PortalStore.get('employees');
        table.innerHTML = employees.length ? employees.map(emp => `
            <tr class="border-b border-gray-200 hover:bg-gray-50 table-row-hover">
                <td class="p-3 font-semibold text-gray-800">${esc(emp.name)}</td>
                <td class="p-3 text-sm text-gray-600">${esc(emp.email)}</td>
                <td class="p-3 text-sm text-gray-600">${esc(emp.department)}</td>
                <td class="p-3 text-sm text-gray-600">${esc(emp.role || 'Empleado')}</td>
                <td class="p-3">${PortalUtils.statusBadge(emp.status)}</td>
                <td class="p-3 whitespace-nowrap">
                    <button onclick="EmployeesModule.openForm(${emp.id})" class="${BTN_SMALL} bg-blue-500 hover:bg-blue-600">Editar</button>
                    <button onclick="EmployeesModule.toggleStatus(${emp.id})" class="${BTN_SMALL} bg-yellow-500 hover:bg-yellow-600">${emp.status === 'active' ? 'Desactivar' : 'Activar'}</button>
                    <button onclick="EmployeesModule.remove(${emp.id})" class="${BTN_SMALL} bg-red-500 hover:bg-red-600">Eliminar</button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="6">' + PortalUtils.empty('No hay empleados registrados') + '</td></tr>';
    },

    // Sin id crea un empleado nuevo; con id edita el existente
    openForm: function(id) {
        const employees = PortalStore.get('employees');
        const current = employees.find(e => e.id === id) || {};

        ModalModule.open(id ? 'Editar empleado' : 'Nuevo empleado', [
            { name: 'name', label: 'Nombre completo', value: current.name, required: true },
            { name: 'email', label: 'Correo', type: 'email', value: current.email, required: true },
            { name: 'department', label: 'Departamento', value: current.department, required: true },
            { name: 'position', label: 'Cargo', value: current.position },
            { name: 'phone', label: 'Teléfono', value: current.phone },
            { name: 'startDate', label: 'Fecha de ingreso', type: 'date', value: current.startDate },
            { name: 'role', label: 'Rol', type: 'select', value: current.role || 'Empleado', options: [
                { value: 'Empleado', label: 'Empleado' },
                { value: 'Administrador', label: 'Administrador' }
            ] }
        ], function(values) {
            if (id) {
                Object.assign(current, values);
            } else {
                employees.push(Object.assign({ id: Date.now(), status: 'active' }, values));
            }
            PortalStore.set('employees', employees);
            AlertModule.show(id ? 'Empleado actualizado' : 'Empleado creado', 'success');
            AuditModule.log(id ? 'Editó empleado' : 'Creó empleado', values.name);
            NavigationModule.renderSection(NavigationModule.currentSection);
        });
    },

    toggleStatus: function(id) {
        const employees = PortalStore.get('employees');
        const emp = employees.find(e => e.id === id);
        if (!emp) return;

        emp.status = emp.status === 'active' ? 'inactive' : 'active';
        PortalStore.set('employees', employees);
        AuditModule.log(emp.status === 'active' ? 'Activó empleado' : 'Desactivó empleado', emp.name);
        this.render();
    },

    remove: function(id) {
        const employees = PortalStore.get('employees');
        const emp = employees.find(e => e.id === id);
        if (!emp || !confirm('¿Eliminar a ' + emp.name + '? Esta acción no se puede deshacer.')) return;

        PortalStore.set('employees', employees.filter(e => e.id !== id));
        AlertModule.show('Empleado eliminado', 'success');
        AuditModule.log('Eliminó empleado', emp.name);
        this.render();
    }
};

// ============================================
// MÓDULO DE ANUNCIOS
// ============================================
const AnnouncementsModule = {
    render: function() {
        const list = document.getElementById('announcementsList');
        if (!list) return;

        const announcements = PortalStore.get('announcements').slice().reverse();
        list.innerHTML = announcements.length ? announcements.map(item => `
            <div class="p-4 rounded-lg border-l-4 ${item.priority === 'important' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'} flex justify-between items-start gap-4">
                <div>
                    <p class="font-bold text-gray-800">${esc(item.title)}</p>
                    <p class="text-gray-600 mt-1">${esc(item.description)}</p>
                    <p class="text-xs text-gray-500 mt-2">${formatDate(item.date)}${item.priority === 'important' ? ' · Importante' : ''}</p>
                </div>
                <button onclick="AnnouncementsModule.remove(${item.id})" class="${BTN_SMALL} bg-red-500 hover:bg-red-600">Eliminar</button>
            </div>
        `).join('') : PortalUtils.empty('No hay anuncios publicados');
    },

    openForm: function() {
        ModalModule.open('Nuevo anuncio', [
            { name: 'title', label: 'Título', required: true },
            { name: 'description', label: 'Mensaje', type: 'textarea', required: true },
            { name: 'priority', label: 'Prioridad', type: 'select', options: [
                { value: 'normal', label: 'Normal' },
                { value: 'important', label: 'Importante' }
            ] }
        ], function(values) {
            const announcements = PortalStore.get('announcements');
            announcements.push(Object.assign({ id: Date.now(), date: PortalUtils.today() }, values));
            PortalStore.set('announcements', announcements);
            AlertModule.show('Anuncio publicado', 'success');
            AuditModule.log('Publicó anuncio', values.title);
            AnnouncementsModule.render();
        }, 'Publicar');
    },

    remove: function(id) {
        if (!confirm('¿Eliminar este anuncio?')) return;
        PortalStore.set('announcements', PortalStore.get('announcements').filter(a => a.id !== id));
        AuditModule.log('Eliminó anuncio', id);
        this.render();
    }
};

// ============================================
// MÓDULO DE FORMULARIOS (enviados por los empleados)
// ============================================
const FormsModule = {
    render: function() {
        const list = document.getElementById('formSubmissionsList');
        if (!list) return;

        const submissions = PortalStore.get('forms').slice().reverse();
        list.innerHTML = submissions.length ? submissions.map(item => `
            <div class="p-4 rounded-lg border-l-4 border-primary bg-gray-50">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="font-semibold text-gray-800">${esc(PortalUtils.formLabels[item.formType] || item.formType)}</p>
                        <p class="text-sm text-gray-600">${esc(item.employeeName)} · ${formatDate(item.timestamp)}</p>
                    </div>
                    ${PortalUtils.statusBadge(item.status)}
                </div>
                ${item.data.map(field => '<p class="text-sm text-gray-700"><span class="font-semibold">' + esc(field.label) + ':</span> ' + esc(field.value) + '</p>').join('')}
                ${item.status === 'pending' ? '<button onclick="FormsModule.markReviewed(' + item.id + ')" class="' + BTN_SMALL + ' bg-green-500 hover:bg-green-600 mt-3">Marcar como revisado</button>' : ''}
            </div>
        `).join('') : PortalUtils.empty('Ningún empleado ha enviado formularios todavía');
    },

    markReviewed: function(id) {
        const submissions = PortalStore.get('forms');
        const item = submissions.find(s => s.id === id);
        if (!item) return;

        item.status = 'reviewed';
        PortalStore.set('forms', submissions);
        AuditModule.log('Revisó formulario', item.employeeName);
        this.render();
    }
};

// ============================================
// MÓDULO DE TICKETS/SOPORTE
// ============================================
const TicketsModule = {
    currentFilter: 'all',

    render: function(filter) {
        const list = document.getElementById('ticketsList');
        if (!list) return;

        if (filter) this.currentFilter = filter;
        const tickets = PortalStore.get('tickets')
            .filter(t => this.currentFilter === 'all' || t.status === this.currentFilter)
            .reverse();

        list.innerHTML = tickets.length ? tickets.map(ticket => {
            const id = esc(ticket.id);
            let buttons = '';
            if (ticket.status === 'open') buttons += `<button onclick="TicketsModule.setStatus('${id}', 'in_progress')" class="${BTN_SMALL} bg-yellow-500 hover:bg-yellow-600">En proceso</button> `;
            if (ticket.status !== 'resolved') buttons += `<button onclick="TicketsModule.setStatus('${id}', 'resolved')" class="${BTN_SMALL} bg-green-500 hover:bg-green-600">Resolver</button>`;
            else buttons += `<button onclick="TicketsModule.setStatus('${id}', 'open')" class="${BTN_SMALL} bg-gray-500 hover:bg-gray-600">Reabrir</button>`;

            return `
                <div class="p-4 rounded-lg border-l-4 border-primary bg-gray-50">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <p class="font-semibold text-gray-800">${id} - ${esc(ticket.subject)}</p>
                            <p class="text-sm text-gray-600">${esc(ticket.employeeName || 'Empleado')} · ${esc(PortalUtils.categoryLabels[ticket.category] || ticket.category)} · Prioridad ${esc(ticket.priority)}</p>
                        </div>
                        ${PortalUtils.statusBadge(ticket.status)}
                    </div>
                    ${ticket.description ? '<p class="text-sm text-gray-700 mb-2">' + esc(ticket.description) + '</p>' : ''}
                    <p class="text-xs text-gray-500 mb-3">Creado: ${formatDate(ticket.timestamp)}</p>
                    ${buttons}
                </div>
            `;
        }).join('') : PortalUtils.empty('No hay tickets para este filtro');
    },

    setStatus: function(id, status) {
        const tickets = PortalStore.get('tickets');
        const ticket = tickets.find(t => t.id === id);
        if (!ticket) return;

        ticket.status = status;
        PortalStore.set('tickets', tickets);
        AuditModule.log('Cambió ticket a ' + PortalUtils.statusInfo[status].label, id);
        this.render();
    }
};

// ============================================
// MÓDULO DE CALENDARIO
// ============================================
const CalendarModule = {
    render: function() {
        const list = document.getElementById('eventsList');
        if (!list) return;

        const events = PortalStore.get('events').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
        list.innerHTML = events.length ? events.map(event => `
            <div class="p-4 rounded-lg border-l-4 border-primary bg-gray-50 flex justify-between items-center gap-4">
                <div>
                    <p class="font-semibold text-gray-800">${esc(event.title)}</p>
                    <p class="text-sm text-gray-600">${formatDate(event.date)}${event.time ? ' - ' + esc(event.time) : ' (Todo el día)'}</p>
                </div>
                <button onclick="CalendarModule.remove(${event.id})" class="${BTN_SMALL} bg-red-500 hover:bg-red-600">Eliminar</button>
            </div>
        `).join('') : PortalUtils.empty('No hay eventos programados');
    },

    openForm: function() {
        ModalModule.open('Nuevo evento', [
            { name: 'title', label: 'Título', required: true },
            { name: 'date', label: 'Fecha', type: 'date', required: true },
            { name: 'time', label: 'Hora (vacío = todo el día)', type: 'time' }
        ], function(values) {
            const events = PortalStore.get('events');
            events.push(Object.assign({ id: Date.now() }, values));
            PortalStore.set('events', events);
            AlertModule.show('Evento creado', 'success');
            AuditModule.log('Creó evento', values.title);
            CalendarModule.render();
        });
    },

    remove: function(id) {
        if (!confirm('¿Eliminar este evento?')) return;
        PortalStore.set('events', PortalStore.get('events').filter(e => e.id !== id));
        AuditModule.log('Eliminó evento', id);
        this.render();
    }
};

// ============================================
// MÓDULO DE TAREAS/PROYECTOS
// ============================================
const TasksModule = {
    render: function() {
        const list = document.getElementById('tasksList');
        if (!list) return;

        const tasks = PortalStore.get('tasks').slice().reverse();
        list.innerHTML = tasks.length ? tasks.map(task => `
            <div class="p-4 rounded-lg border-l-4 ${task.status === 'completed' ? 'border-green-500' : 'border-yellow-500'} bg-gray-50 flex justify-between items-start gap-4">
                <div>
                    <p class="font-semibold text-gray-800">${esc(task.title)}</p>
                    <p class="text-sm text-gray-600">Asignada a: ${esc(task.assignedTo)}</p>
                    <p class="text-xs text-gray-500 mt-1">Vence: ${formatDate(task.dueDate)}</p>
                </div>
                <div class="flex items-center gap-2">
                    ${PortalUtils.statusBadge(task.status)}
                    <button onclick="TasksModule.remove(${task.id})" class="${BTN_SMALL} bg-red-500 hover:bg-red-600">Eliminar</button>
                </div>
            </div>
        `).join('') : PortalUtils.empty('No hay tareas asignadas');
    },

    openForm: function() {
        const employees = PortalStore.get('employees').filter(e => e.status === 'active');
        if (!employees.length) {
            AlertModule.show('Primero registra un empleado activo', 'error');
            return;
        }

        ModalModule.open('Nueva tarea', [
            { name: 'title', label: 'Tarea', required: true },
            { name: 'assignedTo', label: 'Asignar a', type: 'select', required: true, options: employees.map(e => ({ value: e.name, label: e.name })) },
            { name: 'dueDate', label: 'Fecha límite', type: 'date', required: true }
        ], function(values) {
            const tasks = PortalStore.get('tasks');
            tasks.push(Object.assign({
                id: Date.now(),
                assignedBy: document.getElementById('userName').textContent,
                status: 'pending'
            }, values));
            PortalStore.set('tasks', tasks);
            AlertModule.show('Tarea asignada', 'success');
            AuditModule.log('Asignó tarea', values.title + ' → ' + values.assignedTo);
            TasksModule.render();
        }, 'Asignar');
    },

    remove: function(id) {
        if (!confirm('¿Eliminar esta tarea?')) return;
        PortalStore.set('tasks', PortalStore.get('tasks').filter(t => t.id !== id));
        AuditModule.log('Eliminó tarea', id);
        this.render();
    }
};

// ============================================
// MÓDULO DE INFO PERSONAL
// ============================================
const InfoModule = {
    selectedId: null,

    render: function() {
        const select = document.getElementById('infoEmployeeSelect');
        if (!select) return;

        const employees = PortalStore.get('employees');
        if (!employees.some(e => e.id === this.selectedId)) {
            this.selectedId = employees.length ? employees[0].id : null;
        }

        select.innerHTML = employees.map(emp =>
            '<option value="' + emp.id + '"' + (emp.id === this.selectedId ? ' selected' : '') + '>' + esc(emp.name) + '</option>'
        ).join('');

        this.show(this.selectedId);
    },

    show: function(id) {
        const detail = document.getElementById('infoEmployeeDetail');
        if (!detail) return;

        this.selectedId = Number(id);
        const emp = PortalStore.get('employees').find(e => e.id === this.selectedId);
        if (!emp) {
            detail.innerHTML = PortalUtils.empty('No hay empleados registrados');
            return;
        }

        const field = (label, value) => `
            <div>
                <p class="text-sm text-gray-600 font-semibold">${label}</p>
                <p class="text-gray-800">${esc(value) || '<span class="text-gray-400">Sin registrar</span>'}</p>
            </div>`;

        detail.innerHTML = `
            <div class="flex items-center gap-4 mb-6">
                ${avatarHtml(emp)}
                <div class="flex-1">
                    <p class="text-xl font-bold text-gray-800">${esc(emp.name)}</p>
                    <p class="text-sm text-gray-600">${esc(emp.role || 'Empleado')}</p>
                </div>
                ${PortalUtils.statusBadge(emp.status)}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                ${field('Correo', emp.email)}
                ${field('Teléfono', emp.phone)}
                ${field('Departamento', emp.department)}
                ${field('Cargo', emp.position)}
                ${field('Fecha de ingreso', formatDate(emp.startDate))}
            </div>
            <button onclick="EmployeesModule.openForm(${emp.id})" class="${BTN_SMALL} bg-blue-500 hover:bg-blue-600">Editar información</button>
        `;
    }
};

// ============================================
// MÓDULO DE REPORTES
// ============================================
const ReportsModule = {
    render: function() {
        const content = document.getElementById('reportsContent');
        if (!content) return;

        const countBy = (list, key) => list.reduce((totals, item) => {
            const value = item[key] || 'Sin dato';
            totals[value] = (totals[value] || 0) + 1;
            return totals;
        }, {});

        const byStatus = list => {
            const totals = countBy(list, 'status');
            return Object.keys(totals).map(status => ({
                label: (PortalUtils.statusInfo[status] || { label: status }).label,
                value: totals[status]
            }));
        };

        const departments = countBy(PortalStore.get('employees').filter(e => e.status === 'active'), 'department');

        content.innerHTML =
            this.chart('Empleados activos por departamento', Object.keys(departments).map(d => ({ label: d, value: departments[d] }))) +
            this.chart('Permisos por estado', byStatus(PortalStore.get('permissions'))) +
            this.chart('Tickets por estado', byStatus(PortalStore.get('tickets'))) +
            this.chart('Tareas por estado', byStatus(PortalStore.get('tasks')));
    },

    // Tarjeta con barras horizontales proporcionales al valor más alto
    chart: function(title, rows) {
        const max = Math.max.apply(null, rows.map(r => r.value).concat(1));
        const total = rows.reduce((sum, r) => sum + r.value, 0);

        return `
            <div class="bg-white rounded-lg p-6 shadow-sm">
                <div class="flex justify-between items-baseline mb-4">
                    <h2 class="text-xl font-semibold text-gray-800">${title}</h2>
                    <span class="text-sm text-gray-500">Total: ${total}</span>
                </div>
                ${rows.length ? rows.map(row => `
                    <div class="mb-3">
                        <div class="flex justify-between text-sm text-gray-700 mb-1">
                            <span>${esc(row.label)}</span>
                            <span class="font-semibold">${row.value}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded h-3">
                            <div class="bg-[#00A8B5] h-3 rounded" style="width: ${(row.value / max) * 100}%;"></div>
                        </div>
                    </div>
                `).join('') : PortalUtils.empty('Sin datos todavía')}
            </div>
        `;
    }
};

// ============================================
// MÓDULO DE AUDITORÍA
// ============================================
const AuditModule = {
    log: function(action, details) {
        const user = document.getElementById('userName') ? document.getElementById('userName').textContent : 'Admin';
        const log = {
            user: user,
            action: action,
            details: details,
            timestamp: new Date().toLocaleString('es-CO'),
            section: NavigationModule.currentSection
        };
        let logs = PortalStore.get('audit');
        logs.push(log);
        if (logs.length > 100) logs = logs.slice(-100);
        PortalStore.set('audit', logs);
    },

    render: function(searchTerm) {
        const table = document.getElementById('auditTable');
        if (!table) return;

        const term = (searchTerm || '').toLowerCase();
        const logs = PortalStore.get('audit').slice().reverse().filter(log =>
            (log.user + ' ' + log.action + ' ' + log.details).toLowerCase().includes(term)
        );

        table.innerHTML = logs.length ? logs.map(log => `
            <tr class="border-b border-gray-200 hover:bg-gray-50 table-row-hover">
                <td class="p-3 text-sm text-gray-600 whitespace-nowrap">${esc(log.timestamp)}</td>
                <td class="p-3 text-sm text-gray-800">${esc(log.user)}</td>
                <td class="p-3 text-sm text-gray-800">${esc(log.action)}</td>
                <td class="p-3 text-sm text-gray-600">${esc(log.details)}</td>
            </tr>
        `).join('') : '<tr><td colspan="4">' + PortalUtils.empty('No hay registros') + '</td></tr>';
    }
};

// ============================================
// MÓDULO DE DOCUMENTOS
// ============================================
const DocumentsModule = {
    render: function() {
        const list = document.getElementById('documentsList');
        if (!list) return;

        const documents = PortalStore.get('documents').slice().reverse();
        list.innerHTML = documents.length ? documents.map(doc => `
            <div class="p-4 rounded-lg border-l-4 border-primary bg-gray-50 flex justify-between items-start gap-4">
                <div>
                    <p class="font-semibold text-gray-800"><i class="bi bi-file-earmark-text"></i> ${esc(doc.name)}</p>
                    <p class="text-sm text-gray-600">${esc(doc.category)}${doc.description ? ' · ' + esc(doc.description) : ''}</p>
                    <p class="text-xs text-gray-500 mt-1">Agregado: ${formatDate(doc.date)}</p>
                </div>
                <div class="flex items-center gap-2">
                    ${doc.url ? '<a href="' + esc(doc.url) + '" target="_blank" rel="noopener" class="' + BTN_SMALL + ' bg-blue-500 hover:bg-blue-600">Abrir</a>' : ''}
                    <button onclick="DocumentsModule.remove(${doc.id})" class="${BTN_SMALL} bg-red-500 hover:bg-red-600">Eliminar</button>
                </div>
            </div>
        `).join('') : PortalUtils.empty('No hay documentos registrados');
    },

    openForm: function() {
        ModalModule.open('Nuevo documento', [
            { name: 'name', label: 'Nombre', required: true },
            { name: 'category', label: 'Categoría', required: true },
            { name: 'url', label: 'Enlace al documento', type: 'url' },
            { name: 'description', label: 'Descripción', type: 'textarea' }
        ], function(values) {
            const documents = PortalStore.get('documents');
            documents.push(Object.assign({ id: Date.now(), date: PortalUtils.today() }, values));
            PortalStore.set('documents', documents);
            AlertModule.show('Documento agregado', 'success');
            AuditModule.log('Agregó documento', values.name);
            DocumentsModule.render();
        });
    },

    remove: function(id) {
        if (!confirm('¿Eliminar este documento?')) return;
        PortalStore.set('documents', PortalStore.get('documents').filter(d => d.id !== id));
        AuditModule.log('Eliminó documento', id);
        this.render();
    }
};

// ============================================
// MÓDULO DE CONFIGURACIÓN
// ============================================
const SettingsModule = {
    render: function() {
        const settings = PortalStore.get('settings');
        document.getElementById('settingCompanyName').value = settings.companyName;
        document.getElementById('settingSupportEmail').value = settings.supportEmail;
        document.getElementById('settingVacationDays').value = settings.vacationDays;
    },

    save: function(event) {
        event.preventDefault();
        PortalStore.set('settings', {
            companyName: document.getElementById('settingCompanyName').value.trim(),
            supportEmail: document.getElementById('settingSupportEmail').value.trim(),
            vacationDays: Number(document.getElementById('settingVacationDays').value)
        });
        AlertModule.show('Configuración guardada', 'success');
        AuditModule.log('Actualizó configuración', 'Sistema');
    }
};

// ============================================
// MÓDULO DE SIDEBAR
// ============================================
const SidebarModule = {
    isOpen: true,
    toggle: function() {
        const sb = document.getElementById('sidebar');
        if (!sb) return;
        this.isOpen = !this.isOpen;
        sb.style.marginLeft = this.isOpen ? '0' : '-100%';
    }
};

// ============================================
// MÓDULO DE AUTENTICACIÓN
// ============================================

function toggleSidebar(){
    SidebarModule.toggle(); 
}
function switchSection(sectionId, menuElement){
    NavigationModule.switchSection(sectionId, menuElement);
    }
function logout(){
}