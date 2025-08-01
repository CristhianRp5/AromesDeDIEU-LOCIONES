/* ======= POPUP DE DESCUENTO - FUNCIONALIDAD OPTIMIZADA ======= */

class DiscountPopup {
    constructor() {
        // Prevenir múltiples instancias
        if (window.discountPopupInstance) {
            return window.discountPopupInstance;
        }
        
        this.popup = document.getElementById('discount-popup');
        this.closeBtn = document.querySelector('.popup-close');
        this.form = document.getElementById('discount-form');
        this.emailInput = document.querySelector('.email-input');
        this.submitBtn = document.querySelector('.submit-btn');
        this.isInitialized = false;
        this.isVisible = false;
        
        // Verificar que los elementos existen antes de inicializar
        if (this.popup && this.closeBtn && this.form) {
            this.init();
        } else {
            console.warn('⚠️ Elementos del popup no encontrados, reintentando...');
            setTimeout(() => this.constructor(), 500);
        }
    }
    
    init() {
        if (this.isInitialized) {
            console.log('🔄 Popup ya inicializado, saltando...');
            return;
        }
        
        // Event listeners únicos
        this.setupEventListeners();
        
        // Mostrar popup después de un breve delay
        setTimeout(() => {
            this.showPopup();
        }, 1000);
        
        this.isInitialized = true;
        console.log('✅ Popup inicializado correctamente');
    }
    
    setupEventListeners() {
        // Prevenir event listeners duplicados
        if (this.closeBtn._hasDiscountListener) return;
        
        // Cerrar con botón X
        this.closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hidePopup();
        });
        this.closeBtn._hasDiscountListener = true;
        
        // Cerrar clickeando fuera
        this.popup.addEventListener('click', (e) => {
            if (e.target === this.popup) {
                e.preventDefault();
                e.stopPropagation();
                this.hidePopup();
            }
        });
        
        // Formulario
        if (this.form && !this.form._hasDiscountListener) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            this.form._hasDiscountListener = true;
        }
        
        // Cerrar con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                e.preventDefault();
                this.hidePopup();
            }
        });
    }
    
    showPopup() {
        if (this.isVisible) return; // Prevenir múltiples llamadas
        
        try {
            document.body.style.overflow = 'hidden';
            this.popup.classList.add('active');
            this.isVisible = true;
            
            // Analytics tracking (opcional)
            this.trackEvent('popup_shown');
            console.log('📱 Popup mostrado');
        } catch (error) {
            console.error('❌ Error mostrando popup:', error);
        }
    }
    
    hidePopup() {
        if (!this.isVisible) return; // Prevenir múltiples llamadas
        
        try {
            document.body.style.overflow = '';
            this.popup.classList.remove('active');
            this.isVisible = false;
            
            // Analytics tracking
            this.trackEvent('popup_closed');
            console.log('🚪 Popup cerrado');
            
            // Limpiar cualquier timeout activo
            if (this.autoCloseTimeout) {
                clearTimeout(this.autoCloseTimeout);
                this.autoCloseTimeout = null;
            }
        } catch (error) {
            console.error('❌ Error cerrando popup:', error);
        }
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const email = this.emailInput.value.trim();
        
        if (!this.validateEmail(email)) {
            this.showError('Por favor, ingresa un email válido');
            return;
        }
        
        // Deshabilitar botón durante envío
        this.submitBtn.disabled = true;
        this.submitBtn.textContent = 'PROCESANDO...';
        
        try {
            // Simular envío (aquí puedes integrar con tu backend)
            await this.submitEmail(email);
            
            // Mostrar éxito
            this.showSuccess();
            
            // Analytics tracking
            this.trackEvent('email_submitted', { email });
            
        } catch (error) {
            this.showError('Error al procesar. Inténtalo de nuevo.');
            console.error('Error submitting email:', error);
        } finally {
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = 'OBTENER DESCUENTO';
        }
    }
    
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    async submitEmail(email) {
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Aquí puedes integrar con tu sistema de newsletter
        // Por ejemplo: Mailchimp, ConvertKit, etc.
        console.log('Email submitted:', email);
        
        // Guardar en localStorage para futuras referencias
        const subscribers = JSON.parse(localStorage.getItem('arome_subscribers') || '[]');
        subscribers.push({
            email,
            timestamp: Date.now(),
            discountCode: this.generateDiscountCode()
        });
        localStorage.setItem('arome_subscribers', JSON.stringify(subscribers));
        
        return { success: true };
    }
    
    generateDiscountCode() {
        return 'AROME15-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }
    
    showSuccess() {
        const discountCode = this.generateDiscountCode();
        const rightPanel = document.querySelector('.popup-right');
        
        rightPanel.innerHTML = `
            <div class="popup-success">
                <div class="success-icon">✓</div>
                <h3 class="success-message">¡Gracias por suscribirte!</h3>
                <p class="success-code">Código de descuento: <strong>${discountCode}</strong></p>
                <p class="form-description">
                    Usa este código en tu primera compra para obtener 15% de descuento.
                    También te enviaremos ofertas exclusivas a tu email.
                </p>
                <button class="submit-btn" onclick="window.discountPopupInstance?.hidePopup()">
                    CONTINUAR COMPRANDO
                </button>
            </div>
        `;
        
        // Auto-cerrar después de 8 segundos con timeout controlado
        this.autoCloseTimeout = setTimeout(() => {
            this.hidePopup();
        }, 8000);
    }
    
    showError(message) {
        // Crear elemento de error si no existe
        let errorElement = document.querySelector('.popup-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'popup-error';
            errorElement.style.cssText = `
                color: #e74c3c;
                font-size: 0.9rem;
                margin-top: 10px;
                padding: 8px 12px;
                background: rgba(231, 76, 60, 0.1);
                border-radius: 4px;
                font-family: 'Montserrat', sans-serif;
            `;
            this.form.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Ocultar error después de 4 segundos
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 4000);
        
        // Shake animation en el input
        this.emailInput.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            this.emailInput.style.animation = '';
        }, 500);
    }
    
    trackEvent(eventName, data = {}) {
        try {
            // Integración con Google Analytics, Facebook Pixel, etc.
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, {
                    event_category: 'discount_popup',
                    ...data
                });
            }
            
            console.log('📊 Event tracked:', eventName, data);
        } catch (error) {
            console.warn('⚠️ Error tracking event:', error);
        }
    }
}

// CSS para animación shake
const shakeCSS = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;

// Agregar CSS de animación de forma segura
function addShakeCSS() {
    if (!document.querySelector('#shake-animation-css')) {
        const style = document.createElement('style');
        style.id = 'shake-animation-css';
        style.textContent = shakeCSS;
        document.head.appendChild(style);
    }
}

// Función de inicialización segura
function initDiscountPopup() {
    // Prevenir múltiples inicializaciones
    if (window.discountPopupInstance) {
        console.log('🔄 Popup ya existe, reutilizando instancia...');
        return window.discountPopupInstance;
    }
    
    try {
        addShakeCSS();
        window.discountPopupInstance = new DiscountPopup();
        console.log('✅ Popup inicializado exitosamente');
        return window.discountPopupInstance;
    } catch (error) {
        console.error('❌ Error inicializando popup:', error);
        return null;
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDiscountPopup);
} else {
    // DOM ya está listo
    initDiscountPopup();
}

// Export para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiscountPopup;
}
