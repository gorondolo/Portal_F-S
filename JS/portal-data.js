// ============================================
// DATOS Y UTILIDADES COMPARTIDAS DEL PORTAL
// (panel de empleado y panel de administrador)
// ============================================

// ALMACÉN DE DATOS EN localStorage
const PortalStore = {
    keys: {
        employees: 'portal_employees',
        announcements: 'portal_announcements',
        events: 'portal_events',
        tasks: 'portal_tasks',
        tickets: 'employee_tickets',
        permissions: 'employee_permission_requests',
        forms: 'portal_form_submissions',
        documents: 'portal_documents',
        settings: 'portal_settings',
        pendingUsers: 'pendingUsers',
        passwordResets: 'passwordResetRequests',
        audit: 'audit_logs'
    },

    // Datos de ejemplo que se usan mientras no haya nada guardado
    seeds: {
        employees: [
            { id: 1, name: 'Miguel Angel Osorio', email: 'practicantefsy@frutosysemillas.com', department: 'Sistemas', position: 'Pasante de Sistemas', phone: '+57 300 123 4567', startDate: '2024-09-01', role: 'Empleado', status: 'active' },
            { id: 2, name: 'Ana García', email: 'ana@frutosysemillas.com', department: 'Recursos Humanos', position: '', phone: '', startDate: '', role: 'Empleado', status: 'active' },
            { id: 3, name: 'Juan López', email: 'juan@frutosysemillas.com', department: 'Ventas', position: '', phone: '', startDate: '', role: 'Empleado', status: 'active' },
            { id: 4, name: 'María Rodríguez', email: 'maria@frutosysemillas.com', department: 'Operaciones', position: '', phone: '', startDate: '', role: 'Empleado', status: 'active' }
        ],
        announcements: [
            { id: 1, title: 'Mantenimiento de Sistemas', description: 'Se realizará mantenimiento el sábado 7 de octubre de 8 PM a 12 PM.', date: '2026-10-06', priority: 'important' },
            { id: 2, title: 'Nuevo Código de Conducta', description: 'Se ha actualizado el código de conducta empresarial.', date: '2026-10-01', priority: 'normal' }
        ],
        events: [
            { id: 1, title: 'Reunión de Departamento', date: '2026-10-10', time: '14:00' },
            { id: 2, title: 'Día de Receso', date: '2026-10-12', time: '' }
        ],
        tasks: [
            { id: 1, title: 'Revisar reportes de ventas', assignedTo: 'Miguel Angel Osorio', assignedBy: 'Gerente de Ventas', dueDate: '2026-10-10', status: 'pending' },
            { id: 2, title: 'Completar formulario de evaluación', assignedTo: 'Miguel Angel Osorio', assignedBy: 'Recursos Humanos', dueDate: '2026-10-05', status: 'completed' },
            { id: 3, title: 'Actualizar inventario', assignedTo: 'Miguel Angel Osorio', assignedBy: 'Operaciones', dueDate: '2026-10-15', status: 'pending' }
        ],
        tickets: [
            { id: 'TKT-001', category: 'tecnico', subject: 'Acceso a carpeta compartida', description: '', priority: 'media', status: 'resolved', employeeName: 'Miguel Angel Osorio', timestamp: '2026-10-04T09:00:00' },
            { id: 'TKT-002', category: 'tecnico', subject: 'Actualizar contraseña', description: '', priority: 'media', status: 'in_progress', employeeName: 'Miguel Angel Osorio', timestamp: '2026-10-05T09:00:00' }
        ],
        permissions: [],
        forms: [],
        documents: [],
        pendingUsers: [],
        passwordResets: [],
        audit: [],
        settings: { companyName: 'Frutos y Semillas', supportEmail: '', vacationDays: 15 }
    },

    get: function(name) {
        const seed = JSON.parse(JSON.stringify(this.seeds[name]));
        const raw = localStorage.getItem(this.keys[name]);
        if (raw === null) return seed;

        try {
            return JSON.parse(raw);
        } catch (e) {
            return seed;
        }
    },

    set: function(name, value) {
        localStorage.setItem(this.keys[name], JSON.stringify(value));
    }
};

// ============================================
// UTILIDADES DE PRESENTACIÓN
// ============================================
const PortalUtils = {
    statusInfo: {
        pending: { label: 'Pendiente', color: 'yellow' },
        approved: { label: 'Aprobada', color: 'green' },
        rejected: { label: 'Rechazada', color: 'red' },
        open: { label: 'Abierto', color: 'blue' },
        in_progress: { label: 'En proceso', color: 'yellow' },
        resolved: { label: 'Resuelto', color: 'green' },
        completed: { label: 'Completada', color: 'green' },
        reviewed: { label: 'Revisado', color: 'green' },
        active: { label: 'Activo', color: 'green' },
        inactive: { label: 'Inactivo', color: 'gray' }
    },

    categoryLabels: { tecnico: 'Soporte Técnico', rrhh: 'Recursos Humanos', general: 'General' },
    permissionLabels: { vacaciones: 'Vacaciones', permiso_personal: 'Permiso Personal', licencia_medica: 'Licencia Médica', otro: 'Otro' },
    formLabels: { 'cambio-datos': 'Cambio de Datos', 'incidente': 'Reporte de Incidente' },

    // Escapa texto escrito por usuarios antes de insertarlo como HTML
    esc: function(text) {
        const div = document.createElement('div');
        div.textContent = text === undefined || text === null ? '' : String(text);
        return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    formatDate: function(value) {
        if (!value) return '';
        const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + 'T00:00:00') : new Date(value);
        if (isNaN(date.getTime())) return value;
        return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    today: function() {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    },

    statusBadge: function(status) {
        const info = this.statusInfo[status] || { label: status, color: 'gray' };
        return '<span class="text-xs bg-' + info.color + '-100 text-' + info.color + '-800 px-3 py-1 rounded font-semibold whitespace-nowrap">' + info.label + '</span>';
    },

    empty: function(message) {
        return '<p class="text-gray-500 text-center py-6">' + message + '</p>';
    }
};

// ============================================
// MÓDULO DE VENTANA CON FORMULARIO
// ============================================
const ModalModule = {
    onSubmit: null,
    inputClass: 'w-full p-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none',

    ensure: function() {
        if (document.getElementById('formModal')) return;

        const modal = document.createElement('div');
        modal.id = 'formModal';
        modal.className = 'hidden fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50';
        modal.innerHTML =
            '<div class="bg-white rounded-lg p-8 w-full max-w-lg mx-4 shadow-2xl overflow-y-auto" style="max-height: 90vh;">' +
                '<h2 id="formModalTitle" class="text-xl font-bold text-gray-800 mb-4"></h2>' +
                '<form id="formModalForm">' +
                    '<div id="formModalFields" class="space-y-4"></div>' +
                    '<div class="flex gap-4 mt-6">' +
                        '<button type="submit" id="formModalSubmit" class="flex-1 bg-[#00A8B5] text-white py-2 rounded-lg font-semibold hover:bg-[#20C4D1] transition-all"></button>' +
                        '<button type="button" onclick="ModalModule.close()" class="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-all">Cancelar</button>' +
                    '</div>' +
                '</form>' +
            '</div>';
        document.body.appendChild(modal);

        modal.addEventListener('click', function(e) {
            if (e.target === modal) ModalModule.close();
        });

        document.getElementById('formModalForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const values = {};
            new FormData(e.target).forEach((value, key) => values[key] = value.trim());
            const callback = ModalModule.onSubmit;
            ModalModule.close();
            if (callback) callback(values);
        });
    },

    // fields: [{ name, label, type: 'text'|'email'|'date'|'time'|'number'|'select'|'textarea', options, value, required }]
    open: function(title, fields, onSubmit, submitLabel) {
        this.ensure();
        const esc = PortalUtils.esc;

        document.getElementById('formModalTitle').textContent = title;
        document.getElementById('formModalSubmit').textContent = submitLabel || 'Guardar';
        document.getElementById('formModalFields').innerHTML = fields.map(field => {
            const value = field.value === undefined || field.value === null ? '' : field.value;
            const required = field.required ? ' required' : '';
            let control;

            if (field.type === 'select') {
                control = '<select name="' + field.name + '" class="' + this.inputClass + '"' + required + '>' +
                    field.options.map(option =>
                        '<option value="' + esc(option.value) + '"' + (String(option.value) === String(value) ? ' selected' : '') + '>' + esc(option.label) + '</option>'
                    ).join('') + '</select>';
            } else if (field.type === 'textarea') {
                control = '<textarea name="' + field.name + '" rows="4" class="' + this.inputClass + '"' + required + '>' + esc(value) + '</textarea>';
            } else {
                control = '<input type="' + (field.type || 'text') + '" name="' + field.name + '" value="' + esc(value) + '" class="' + this.inputClass + '"' + required + '>';
            }

            return '<div><label class="block text-gray-700 font-semibold mb-2">' + esc(field.label) + (field.required ? ' *' : '') + '</label>' + control + '</div>';
        }).join('');

        this.onSubmit = onSubmit;
        document.getElementById('formModal').classList.remove('hidden');
    },

    close: function() {
        const modal = document.getElementById('formModal');
        if (modal) modal.classList.add('hidden');
        this.onSubmit = null;
    }
};
