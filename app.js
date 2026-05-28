/**
 * Mi Tienda Inteligente - Client Management (Supabase Integration)
 */

// ==========================================================================
// CONFIGURACIÓN DE SUPABASE
// Reemplaza estos valores con las credenciales de tu proyecto de Supabase
// ==========================================================================
const SUPABASE_URL = 'https://jxzwvvenqiqkfpebgqsp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yu6qy_SQFXIF7L_PFOLqAg_A5A81AL-';

// Inicializar cliente de Supabase (se valida si las claves fueron cambiadas)
let supabaseClient = null;
const isSupabaseConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';

if (isSupabaseConfigured) {
    // @ts-ignore
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('customerForm');
    const fullNameInput = document.getElementById('fullName');
    const nameError = document.getElementById('nameError');
    const phoneError = document.getElementById('phoneError');
    const saveButton = document.getElementById('saveButton');
    
    // Contenedores dinámicos de teléfonos
    const phoneInputsContainer = document.getElementById('phoneInputsContainer');
    const addPhoneButton = document.getElementById('addPhoneButton');
    
    const searchClientInput = document.getElementById('searchClient');
    const clientsList = document.getElementById('clientsList');
    const emptyState = document.getElementById('emptyState');
    const toastContainer = document.getElementById('toastContainer');

    // State (Estado Local para cuando Supabase no esté configurado)
    let clients = [];

    // Initialize application
    init();

    async function init() {
        if (!isSupabaseConfigured) {
            console.warn("Supabase no está configurado. Utilizando almacenamiento local temporal (localStorage).");
            showToast('Modo de prueba local. Configura tus claves de Supabase en app.js para conectar la base de datos.', 'error');
            loadLocalStorageData();
        } else {
            await fetchClientsFromSupabase();
        }

        // Event Listeners
        form.addEventListener('submit', handleFormSubmit);
        addPhoneButton.addEventListener('click', addNewPhoneField);
        searchClientInput.addEventListener('input', handleSearch);
        
        // Remove error states dynamically on input
        fullNameInput.addEventListener('input', () => {
            clearFieldError(fullNameInput, nameError);
        });

        // Set up validation for default first phone input
        const firstPhoneInput = phoneInputsContainer.querySelector('.phone-input-field');
        if (firstPhoneInput) {
            setupPhoneInputValidation(firstPhoneInput);
        }
    }

    /**
     * Auxiliar: Cargar datos desde localStorage (Fallback)
     */
    function loadLocalStorageData() {
        const storedClients = localStorage.getItem('smart_store_clients');
        if (storedClients) {
            try {
                clients = JSON.parse(storedClients);
            } catch (e) {
                clients = [];
            }
        }
        renderClients();
    }

    /**
     * Auxiliar: Guardar datos en localStorage (Fallback)
     */
    function saveLocalStorageData() {
        localStorage.setItem('smart_store_clients', JSON.stringify(clients));
    }

    /**
     * Obtener lista de clientes de Supabase (con sus teléfonos relacionados)
     */
    async function fetchClientsFromSupabase() {
        try {
            // Consulta relacional: Trae cliente e internamente sus registros en la tabla cliente_tel
            const { data, error } = await supabaseClient
                .from('cliente')
                .select(`
                    id_cliente,
                    nombre,
                    cliente_tel (
                        id_telefono,
                        telefono
                    )
                `)
                .order('id_cliente', { ascending: false });

            if (error) throw error;

            // Formatear datos para la UI
            clients = data.map(item => ({
                id: item.id_cliente,
                name: item.nombre,
                // Mapear los teléfonos relacionados
                phones: item.cliente_tel ? item.cliente_tel.map(t => t.telefono) : []
            }));

            renderClients();
        } catch (e) {
            console.error("Error al cargar datos de Supabase:", e);
            showToast('Error al conectar con la base de datos de Supabase.', 'error');
            loadLocalStorageData(); // Cargar local por si acaso
        }
    }

    /**
     * Agrega un nuevo campo de texto para teléfonos en el formulario
     */
    function addNewPhoneField() {
        const row = document.createElement('div');
        row.className = 'phone-input-row';
        
        row.innerHTML = `
            <div class="input-wrapper">
                <span class="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                </span>
                <input 
                    type="tel" 
                    class="phone-input-field"
                    placeholder="Ej. 5512345678" 
                    autocomplete="off"
                    required
                >
            </div>
            <button type="button" class="btn-remove-phone" title="Eliminar Teléfono">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        // Asignar eliminación
        row.querySelector('.btn-remove-phone').addEventListener('click', () => {
            row.remove();
            clearFieldError(phoneInputsContainer, phoneError);
        });

        const input = row.querySelector('.phone-input-field');
        setupPhoneInputValidation(input);
        
        phoneInputsContainer.appendChild(row);
        input.focus();
    }

    /**
     * Limpieza y validación en tiempo real para inputs de teléfonos
     */
    function setupPhoneInputValidation(inputElement) {
        inputElement.addEventListener('input', (e) => {
            // Elimina todo lo que no sea número
            e.target.value = e.target.value.replace(/\D/g, '');
            clearFieldError(phoneInputsContainer, phoneError);
        });
    }

    /**
     * Gestión del envío del formulario
     */
    async function handleFormSubmit(e) {
        e.preventDefault();

        const name = fullNameInput.value.trim();
        
        // Obtener todos los teléfonos registrados en el formulario
        const phoneInputs = Array.from(phoneInputsContainer.querySelectorAll('.phone-input-field'));
        const phones = phoneInputs.map(input => input.value.trim()).filter(val => val !== '');

        // Validaciones
        const isNameValid = validateName(name);
        const arePhonesValid = validatePhones(phones, phoneInputs);

        if (!isNameValid || !arePhonesValid) {
            showToast('Por favor, corrige los errores en el formulario.', 'error');
            return;
        }

        // Cambiar botón a estado de carga
        setLoadingState(true);

        if (!isSupabaseConfigured) {
            // Fallback LocalStorage si no hay base de datos configurada
            const tempId = Date.now().toString();
            const newClient = { id: tempId, name, phones };
            clients.push(newClient);
            saveLocalStorageData();
            renderClients();
            resetFormFields();
            showToast(`¡Cliente "${name}" guardado localmente (Modo de prueba)!`, 'success');
            setLoadingState(false);
            return;
        }

        // Inserción en Supabase
        try {
            // 1. Insertar el cliente en la tabla 'cliente' y recuperar el ID generado
            const { data: clientData, error: clientError } = await supabaseClient
                .from('cliente')
                .insert([{ nombre: name }])
                .select();

            if (clientError) throw clientError;
            if (!clientData || clientData.length === 0) {
                throw new Error("No se pudo obtener el ID del cliente registrado.");
            }

            const insertedClientId = clientData[0].id_cliente;

            // 2. Insertar todos los números de teléfono en la tabla 'cliente_tel' asociando el ID
            const phoneRecords = phones.map(phoneStr => ({
                id_cliente: insertedClientId,
                telefono: phoneStr
            }));

            const { error: phonesError } = await supabaseClient
                .from('cliente_tel')
                .insert(phoneRecords);

            if (phonesError) throw phonesError;

            // Éxito
            showToast(`¡Cliente "${name}" registrado con éxito en Supabase!`, 'success');
            resetFormFields();
            await fetchClientsFromSupabase(); // Recargar datos frescos del backend
            
        } catch (error) {
            console.error("Error al registrar cliente en Supabase:", error);
            showToast(`Error de base de datos: ${error.message || 'Consulta el panel.'}`, 'error');
        } finally {
            setLoadingState(false);
        }
    }

    /**
     * Valida el nombre del cliente
     */
    function validateName(name) {
        if (name.length < 3) {
            showFieldError(fullNameInput, nameError, 'El nombre debe tener al menos 3 caracteres.');
            return false;
        }
        clearFieldError(fullNameInput, nameError);
        return true;
    }

    /**
     * Valida todos los campos de teléfono del formulario
     */
    function validatePhones(phonesArray, inputElements) {
        const phoneRegex = /^\d{10}$/;
        let hasError = false;

        // Limpiar estilos previos
        inputElements.forEach(input => input.closest('.input-wrapper').classList.remove('input-field-error'));

        if (phonesArray.length === 0) {
            showFieldError(phoneInputsContainer, phoneError, 'Debes ingresar al menos un número de teléfono.');
            return false;
        }

        inputElements.forEach((inputEl) => {
            const val = inputEl.value.trim();
            if (!phoneRegex.test(val)) {
                inputEl.closest('.form-group').classList.add('has-error');
                hasError = true;
            }
        });

        if (hasError) {
            showFieldError(phoneInputsContainer, phoneError, 'Cada teléfono debe tener exactamente 10 dígitos.');
            return false;
        }

        clearFieldError(phoneInputsContainer, phoneError);
        return true;
    }

    /**
     * Configura el botón en modo carga para dar feedback visual
     */
    function setLoadingState(isLoading) {
        if (isLoading) {
            saveButton.disabled = true;
            saveButton.querySelector('.btn-text').textContent = 'Guardando...';
        } else {
            saveButton.disabled = false;
            saveButton.querySelector('.btn-text').textContent = 'Guardar Cliente';
        }
    }

    /**
     * Limpia el formulario y remueve campos extras de teléfono
     */
    function resetFormFields() {
        form.reset();
        
        // Quitar filas adicionales de teléfono excepto la primera
        const rows = Array.from(phoneInputsContainer.querySelectorAll('.phone-input-row'));
        rows.forEach((row, index) => {
            if (index > 0) row.remove();
        });
    }

    /**
     * Display error styling and message for a field
     */
    function showFieldError(inputEl, errorEl, message) {
        const group = inputEl.closest('.form-group');
        if (group) {
            group.classList.add('has-error');
        }
        if (errorEl && message) {
            errorEl.textContent = message;
        }
    }

    /**
     * Clear error styling and message for a field
     */
    function clearFieldError(inputEl, errorEl) {
        const group = inputEl.closest('.form-group');
        if (group) {
            group.classList.remove('has-error');
        }
    }

    /**
     * Render the clients list dynamically
     */
    function renderClients(filterQuery = '') {
        clientsList.innerHTML = '';

        const query = filterQuery.toLowerCase().trim();
        
        // Filtrar clientes buscando coincidencias en nombre o en cualquiera de sus teléfonos
        const filteredClients = clients.filter(client => 
            client.name.toLowerCase().includes(query) || 
            client.phones.some(phone => phone.includes(query))
        );

        if (filteredClients.length === 0) {
            clientsList.style.display = 'none';
            emptyState.style.display = 'flex';
            
            if (query !== '') {
                emptyState.querySelector('.empty-state-title').textContent = 'Sin resultados';
                emptyState.querySelector('.empty-state-desc').textContent = 'Ningún cliente coincide con la búsqueda.';
            } else {
                emptyState.querySelector('.empty-state-title').textContent = 'No hay clientes registrados';
                emptyState.querySelector('.empty-state-desc').textContent = 'Usa el formulario de la izquierda para registrar tu primer cliente.';
            }
            return;
        }

        emptyState.style.display = 'none';
        clientsList.style.display = 'flex';

        filteredClients.forEach(client => {
            const li = document.createElement('li');
            li.className = 'client-item';
            
            const initials = getInitials(client.name);

            // Generar las etiquetas HTML de cada teléfono
            let phonesHTML = '';
            if (client.phones && client.phones.length > 0) {
                phonesHTML = client.phones.map(phone => `
                    <span class="client-phone-tag">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        ${escapeHTML(phone)}
                    </span>
                `).join('');
            } else {
                phonesHTML = `<span class="client-phone-tag text-muted">Sin teléfono</span>`;
            }

            li.innerHTML = `
                <div class="client-info">
                    <div class="client-avatar">${initials}</div>
                    <div class="client-details">
                        <span class="client-name">${escapeHTML(client.name)}</span>
                        <div class="client-phones-list">
                            ${phonesHTML}
                        </div>
                    </div>
                </div>
                <button class="btn-delete" title="Eliminar Cliente" data-id="${client.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            `;

            // Delete event handler
            const deleteBtn = li.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', () => {
                deleteClient(client.id, client.name);
            });

            clientsList.appendChild(li);
        });
    }

    /**
     * Elimina cliente de Supabase (y sus teléfonos asociados)
     */
    async function deleteClient(id, name) {
        if (!confirm(`¿Estás seguro de que deseas eliminar a ${name}?`)) {
            return;
        }

        if (!isSupabaseConfigured) {
            // Fallback Local
            clients = clients.filter(client => client.id !== id);
            saveLocalStorageData();
            renderClients(searchClientInput.value);
            showToast(`Cliente "${name}" eliminado localmente.`, 'success');
            return;
        }

        try {
            // 1. Eliminar teléfonos asociados en 'cliente_tel'
            const { error: telDelError } = await supabaseClient
                .from('cliente_tel')
                .delete()
                .eq('id_cliente', id);

            if (telDelError) throw telDelError;

            // 2. Eliminar el cliente en 'cliente'
            const { error: clientDelError } = await supabaseClient
                .from('cliente')
                .delete()
                .eq('id_cliente', id);

            if (clientDelError) throw clientDelError;

            showToast(`Cliente "${name}" eliminado de Supabase.`, 'success');
            await fetchClientsFromSupabase(); // Recargar datos
            
        } catch (error) {
            console.error("Error al borrar cliente en Supabase:", error);
            showToast(`Error al borrar en base de datos: ${error.message}`, 'error');
        }
    }

    /**
     * Handle search input typing
     */
    function handleSearch() {
        renderClients(searchClientInput.value);
    }

    /**
     * Generate initials from a name (first 2 words, capitalized)
     */
    function getInitials(name) {
        const words = name.trim().split(/\s+/);
        if (words.length === 0 || words[0] === '') return '?';
        
        let initials = words[0].charAt(0).toUpperCase();
        if (words.length > 1) {
            initials += words[words.length - 1].charAt(0).toUpperCase();
        }
        return initials;
    }

    /**
     * Show internal toast notification
     */
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const iconSVG = type === 'success' 
            ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
               </svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
               </svg>`;

        toast.innerHTML = `
            <span class="toast-icon">${iconSVG}</span>
            <span class="toast-message">${escapeHTML(message)}</span>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    /**
     * Utility: Escape HTML to prevent XSS
     */
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
