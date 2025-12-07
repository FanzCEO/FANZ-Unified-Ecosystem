// Modern Creator CRM JavaScript functionality

class CRMApp {
    constructor() {
        this.notifications = [];
        this.observers = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeFeatures();
        this.startAnimations();
        this.setupPerformanceOptimizations();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.onDOMReady();
        });

        // Modern event delegation
        document.addEventListener('click', this.handleGlobalClicks.bind(this));
        document.addEventListener('input', this.handleGlobalInputs.bind(this));
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

        // Performance optimized scroll and resize
        this.setupOptimizedListeners();
    }

    onDOMReady() {
        // Initialize Feather icons with modern configuration
        if (typeof feather !== 'undefined') {
            feather.replace({
                'stroke-width': 2,
                width: 18,
                height: 18
            });
        }

        // Enhanced alert system
        this.initializeAlerts();
        
        // Modern form validation
        this.initializeFormValidation();
        
        // Setup intersection observers for animations
        this.setupIntersectionObservers();
        
        // Initialize tooltips and popovers
        this.initializeBootstrapComponents();
        
        // Setup auto-refresh system
        this.initializeAutoRefresh();
        
        // Initialize search functionality
        this.initializeSearch();
        
        // Setup phone number formatting
        this.initializePhoneFormatting();
        
        // Initialize copy functionality
        this.initializeCopyFeatures();
        
        // Setup workflow builder if on workflows page
        if (window.location.pathname.includes('workflows')) {
            this.initializeWorkflowBuilder();
        }
    }
    
    initializeAlerts() {
        const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
        alerts.forEach(alert => {
            // Add fade-in animation
            alert.classList.add('slide-in-up');
            
            // Enhanced auto-dismiss with progress bar
            this.createDismissTimer(alert, 5000);
        });
    }

    createDismissTimer(alert, duration) {
        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'alert-progress';
        progressBar.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: var(--primary-gradient);
            width: 100%;
            transform-origin: left;
            animation: progressShrink ${duration}ms linear;
        `;
        
        alert.style.position = 'relative';
        alert.appendChild(progressBar);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.transform = 'translateY(-20px)';
                alert.style.opacity = '0';
                
                setTimeout(() => {
                    const bsAlert = new bootstrap.Alert(alert);
                    bsAlert.close();
                }, 300);
            }
        }, duration);
    }

    initializeFormValidation() {
        const forms = document.querySelectorAll('form[data-validate]');
        forms.forEach(form => {
            form.addEventListener('submit', (event) => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.showValidationErrors(form);
                }
                form.classList.add('was-validated');
            });

            // Real-time validation
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearFieldError(input));
            });
        });
    }

    showValidationErrors(form) {
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) {
            firstInvalid.focus();
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    validateField(field) {
        if (!field.checkValidity()) {
            field.classList.add('is-invalid');
            this.showFieldError(field, field.validationMessage);
        } else {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            this.clearFieldError(field);
        }
    }

    showFieldError(field, message) {
        let errorElement = field.parentNode.querySelector('.invalid-feedback');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    clearFieldError(field) {
        const errorElement = field.parentNode.querySelector('.invalid-feedback');
        if (errorElement) {
            errorElement.remove();
        }
        field.classList.remove('is-invalid');
    }
    
    setupIntersectionObservers() {
        // Animate elements when they come into view
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const animateObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const animationType = element.dataset.animate || 'fade-in';
                    element.classList.add(animationType);
                    animateObserver.unobserve(element);
                }
            });
        }, observerOptions);

        // Observe elements with animation attributes
        document.querySelectorAll('[data-animate]').forEach(el => {
            animateObserver.observe(el);
        });

        // Auto-animate cards, stats, and workflow nodes
        document.querySelectorAll('.card, .stats-card, .workflow-node').forEach(el => {
            if (!el.dataset.animate) {
                el.dataset.animate = 'slide-in-up';
                animateObserver.observe(el);
            }
        });
    }

    startAnimations() {
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes progressShrink {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }
            
            @keyframes shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }
            
            .loading-skeleton {
                background: linear-gradient(90deg, 
                    rgba(255,255,255,0.1) 25%, 
                    rgba(255,255,255,0.2) 50%, 
                    rgba(255,255,255,0.1) 75%);
                background-size: 1000px 100%;
                animation: shimmer 2s infinite;
            }
        `;
        document.head.appendChild(style);
    }

    // Auto-calculate end time when start time changes
    initializeTimeCalculation() {
        const startTimeInput = document.getElementById('start_time');
        const endTimeInput = document.getElementById('end_time');
        
        if (startTimeInput && endTimeInput) {
            startTimeInput.addEventListener('change', function() {
                if (this.value) {
                    const startTime = new Date(this.value);
                    const endTime = new Date(startTime.getTime() + (60 * 60 * 1000)); // Add 1 hour
                    
                    const year = endTime.getFullYear();
                    const month = String(endTime.getMonth() + 1).padStart(2, '0');
                    const day = String(endTime.getDate()).padStart(2, '0');
                    const hours = String(endTime.getHours()).padStart(2, '0');
                    const minutes = String(endTime.getMinutes()).padStart(2, '0');
                    
                    endTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
                    
                    // Add smooth animation
                    endTimeInput.style.transform = 'scale(1.02)';
                    setTimeout(() => {
                        endTimeInput.style.transform = 'scale(1)';
                    }, 200);
                }
            });
        }
    }
    
    handleGlobalClicks(event) {
        const target = event.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const handlers = {
            'confirm': this.handleConfirmAction.bind(this),
            'copy': this.handleCopyAction.bind(this),
            'toggle': this.handleToggleAction.bind(this),
            'workflow-execute': this.handleWorkflowExecute.bind(this),
            'show-loading': this.showLoadingState.bind(this)
        };

        if (handlers[action]) {
            handlers[action](event, target);
        }
    }

    handleConfirmAction(event, target) {
        const message = target.dataset.confirm || 'Are you sure?';
        if (!this.showModernConfirm(message)) {
            event.preventDefault();
            return false;
        }
    }

    showModernConfirm(message) {
        // Create a modern confirmation modal instead of alert
        return confirm(message); // Fallback for now, can be enhanced with custom modal
    }

    handleGlobalInputs(event) {
        const target = event.target;
        
        // Auto-format inputs
        if (target.type === 'tel') {
            this.formatPhoneNumber(target);
        }
        
        // Real-time search
        if (target.classList.contains('table-search')) {
            this.performSearch(target);
        }
        
        // Auto-save drafts (for forms)
        if (target.form && target.form.dataset.autosave) {
            this.autoSaveDraft(target.form);
        }
    }
    
    initializePhoneFormatting() {
        const phoneInputs = document.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(input => {
            input.addEventListener('input', () => this.formatPhoneNumber(input));
        });
    }

    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        
        // Add visual feedback
        input.style.transition = 'border-color 0.2s ease';
        
        if (value.length > 0 && !value.startsWith('1')) {
            value = '1' + value;
        }
        
        if (value.length <= 11) {
            if (value.length === 11) {
                input.value = `+${value.substring(0, 1)} (${value.substring(1, 4)}) ${value.substring(4, 7)}-${value.substring(7)}`;
                input.style.borderColor = 'var(--success-color, #28a745)';
            } else if (value.length === 10) {
                input.value = `+1 (${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6)}`;
                input.style.borderColor = 'var(--warning-color, #ffc107)';
            } else {
                input.value = '+' + value;
                input.style.borderColor = '';
            }
        }
        
        // Reset border color after a delay
        setTimeout(() => {
            input.style.borderColor = '';
        }, 1000);
    }
    
    initializeSearch() {
        const searchInputs = document.querySelectorAll('.table-search');
        searchInputs.forEach(input => {
            // Add search icon and clear button
            this.enhanceSearchInput(input);
        });
    }

    enhanceSearchInput(input) {
        const wrapper = document.createElement('div');
        wrapper.className = 'search-wrapper position-relative';
        
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        
        // Add search icon
        const searchIcon = document.createElement('i');
        searchIcon.setAttribute('data-feather', 'search');
        searchIcon.className = 'search-icon position-absolute';
        searchIcon.style.cssText = 'left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; opacity: 0.5;';
        wrapper.appendChild(searchIcon);
        
        // Add clear button
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'btn-clear position-absolute';
        clearBtn.style.cssText = 'right: 12px; top: 50%; transform: translateY(-50%); border: none; background: none; color: #6c757d; cursor: pointer; display: none;';
        clearBtn.innerHTML = '×';
        wrapper.appendChild(clearBtn);
        
        // Style input
        input.style.paddingLeft = '40px';
        input.style.paddingRight = '40px';
        
        // Update icons
        feather.replace();
        
        // Handle input events
        input.addEventListener('input', () => {
            this.performSearch(input);
            clearBtn.style.display = input.value ? 'block' : 'none';
        });
        
        clearBtn.addEventListener('click', () => {
            input.value = '';
            this.performSearch(input);
            clearBtn.style.display = 'none';
            input.focus();
        });
    }

    performSearch(input) {
        const searchTerm = input.value.toLowerCase();
        const tableSelector = input.getAttribute('data-table');
        const table = document.querySelector(tableSelector);
        
        if (!table) return;
        
        const rows = table.querySelectorAll('tbody tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const isVisible = text.includes(searchTerm);
            
            row.style.display = isVisible ? '' : 'none';
            
            if (isVisible) {
                visibleCount++;
                // Add highlight animation for found rows
                if (searchTerm) {
                    row.style.animation = 'none';
                    setTimeout(() => {
                        row.style.animation = 'pulse 0.5s ease-in-out';
                    }, 10);
                }
            }
        });
        
        // Show results count
        this.updateSearchResults(input, visibleCount, rows.length);
    }

    updateSearchResults(input, visible, total) {
        let resultElement = input.parentNode.querySelector('.search-results');
        
        if (!resultElement) {
            resultElement = document.createElement('small');
            resultElement.className = 'search-results text-muted mt-1 d-block';
            input.parentNode.appendChild(resultElement);
        }
        
        if (input.value) {
            resultElement.textContent = `Showing ${visible} of ${total} results`;
            resultElement.style.display = 'block';
        } else {
            resultElement.style.display = 'none';
        }
    }
    
    initializeCopyFeatures() {
        const copyButtons = document.querySelectorAll('[data-copy]');
        copyButtons.forEach(button => {
            button.addEventListener('click', () => this.handleCopyAction(null, button));
        });
    }

    async handleCopyAction(event, button) {
        const text = button.getAttribute('data-copy');
        
        try {
            await navigator.clipboard.writeText(text);
            
            // Enhanced visual feedback
            const originalContent = button.innerHTML;
            const originalClasses = button.className;
            
            button.innerHTML = '<i data-feather="check"></i> Copied!';
            button.className = button.className.replace('btn-outline-', 'btn-') + ' btn-success';
            
            // Add ripple effect
            this.createRippleEffect(button, event || { clientX: button.offsetLeft + button.offsetWidth / 2, clientY: button.offsetTop + button.offsetHeight / 2 });
            
            feather.replace();
            
            // Show toast notification
            this.showNotification('Copied to clipboard!', 'success');
            
            setTimeout(() => {
                button.innerHTML = originalContent;
                button.className = originalClasses;
                feather.replace();
            }, 2000);
            
        } catch (err) {
            console.error('Failed to copy text: ', err);
            this.showNotification('Failed to copy text', 'error');
        }
    }

    createRippleEffect(element, event) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.4);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    // Modern notification system
    showNotification(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;
        
        const icon = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        }[type] || 'info';
        
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i data-feather="${icon}" class="me-2"></i>
                <span class="flex-grow-1">${message}</span>
                <button type="button" class="btn-close btn-close-white ms-2" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        feather.replace();
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto-remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        this.notifications.push(toast);
    }

    // Enhanced utility functions
    formatDateTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return 'Today, ' + date.toLocaleString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (days === 1) {
            return 'Yesterday, ' + date.toLocaleString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (days < 7) {
            return date.toLocaleString('en-US', {
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        } else {
            return `${mins}m`;
        }
    }

    // Performance optimizations
    setupPerformanceOptimizations() {
        // Debounced scroll handler
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.handleScroll();
            }, 16); // ~60fps
        }, { passive: true });

        // Optimized resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }

    setupOptimizedListeners() {
        // Use passive listeners for better performance
        document.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    }

    handleScroll() {
        // Add navbar shadow on scroll
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.style.boxShadow = 'var(--shadow-medium)';
            } else {
                navbar.style.boxShadow = 'none';
            }
        }
    }

    handleResize() {
        // Responsive adjustments
        if (window.innerWidth < 768) {
            this.enableMobileOptimizations();
        } else {
            this.disableMobileOptimizations();
        }
    }

    handleTouchStart() {
        // Add touch feedback
        document.body.classList.add('touch-device');
    }

    enableMobileOptimizations() {
        document.body.classList.add('mobile-optimized');
    }

    disableMobileOptimizations() {
        document.body.classList.remove('mobile-optimized');
    }

    initializeFeatures() {
        this.initializeTimeCalculation();
        this.initializeBootstrapComponents();
        this.initializeAutoRefresh();
    }

    initializeBootstrapComponents() {
        // Enhanced tooltip initialization
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(tooltipTriggerEl => {
            return new bootstrap.Tooltip(tooltipTriggerEl, {
                trigger: 'hover focus',
                animation: true,
                delay: { show: 500, hide: 100 }
            });
        });

        // Enhanced popover initialization
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(popoverTriggerEl => {
            return new bootstrap.Popover(popoverTriggerEl, {
                trigger: 'click',
                animation: true
            });
        });
    }

    initializeAutoRefresh() {
        // Smart auto-refresh for real-time updates
        if (window.location.pathname === '/messages' || window.location.pathname === '/') {
            setInterval(() => {
                if (!document.hidden && navigator.onLine) {
                    this.performBackgroundRefresh();
                }
            }, 30000);
        }
    }

    async performBackgroundRefresh() {
        try {
            const response = await fetch(window.location.href, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            
            if (response.ok) {
                console.log('Background refresh completed');
                // Could implement smart partial updates here
            }
        } catch (err) {
            console.log('Background refresh failed:', err);
        }
    }

    handleKeyboardShortcuts(event) {
        // Check if user is typing in an input field
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.contentEditable === 'true'
        );

        // Don't trigger shortcuts when typing in form fields
        if (isTyping) {
            return;
        }

        // Enhanced keyboard shortcuts
        const shortcuts = {
            'k': () => this.focusSearch(event),
            'n': () => this.openNewModal(event),
            'Escape': () => this.closeModals(),
            '/': () => this.focusSearch(event)
        };

        const key = event.key.toLowerCase();
        const isCtrlOrCmd = event.ctrlKey || event.metaKey;

        if (isCtrlOrCmd && shortcuts[key]) {
            event.preventDefault();
            shortcuts[key]();
        } else if (!isCtrlOrCmd && shortcuts[event.key]) {
            event.preventDefault();
            shortcuts[event.key]();
        }
    }

    focusSearch(event) {
        const searchInput = document.querySelector('.table-search, input[type="search"]');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    openNewModal(event) {
        const newButton = document.querySelector('[data-bs-toggle="modal"]');
        if (newButton) {
            newButton.click();
        }
    }

    closeModals() {
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        });
    }

    // Auto-save functionality
    autoSaveDraft(form) {
        const formData = new FormData(form);
        const draftKey = `draft_${form.id || 'form'}`;
        const draftData = {};
        
        for (let [key, value] of formData.entries()) {
            draftData[key] = value;
        }
        
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        this.showNotification('Draft saved', 'info', 2000);
    }

    // Initialize workflow builder functionality
    initializeWorkflowBuilder() {
        // This would be enhanced with a visual workflow builder
        console.log('Workflow builder initialized');
    }
}

// Initialize the modern CRM app
const crmApp = new CRMApp();

// Enhanced CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .search-wrapper {
        position: relative;
    }
    
    .btn-close-white {
        filter: brightness(0) invert(1);
    }
    
    .touch-device .btn:hover {
        transform: none;
    }
    
    .mobile-optimized .card:hover {
        transform: none;
    }
    
    .mobile-optimized .table-hover tbody tr:hover {
        transform: none;
    }
`;
document.head.appendChild(style);

// Export enhanced global functions
window.CRM = {
    formatDateTime: crmApp.formatDateTime.bind(crmApp),
    formatDuration: crmApp.formatDuration.bind(crmApp),
    showNotification: crmApp.showNotification.bind(crmApp),
    app: crmApp
};
