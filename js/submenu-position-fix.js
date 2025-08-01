// Sistema inteligente de ajuste de posicionamiento de submenús
// Este archivo debe cargarse después del navbar.js principal

(function() {
    'use strict';

    let submenuPositionInitialized = false;
    
    function initSubmenuPositioning() {
        if (submenuPositionInitialized) return;
        
        console.log('🔧 Inicializando sistema de posicionamiento inteligente de submenús');
        
        const submenus = document.querySelectorAll('.submenu');
        
        if (submenus.length === 0) {
            console.log('⚠️ No se encontraron submenús para ajustar');
            setTimeout(initSubmenuPositioning, 500); // Reintentar
            return;
        }

        submenus.forEach((submenu, index) => {
            const container = submenu.closest('.has-submenu');
            
            if (!container) {
                console.log(`⚠️ Contenedor no encontrado para submenú ${index}`);
                return;
            }

            // Crear observer para detectar cuando el submenú se hace visible
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && 
                        (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                        adjustSubmenuPosition(submenu, container);
                    }
                });
            });

            // Observar cambios en el estilo del submenú
            observer.observe(submenu, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });

            // Ajustar posición en hover/mouseenter
            container.addEventListener('mouseenter', function() {
                if (window.innerWidth > 768) { // Solo en desktop
                    setTimeout(() => adjustSubmenuPosition(submenu, container), 50);
                }
            });

            console.log(`✅ Submenú ${index + 1} configurado para ajuste automático`);
        });

        // Ajustar en cambios de viewport
        window.addEventListener('resize', debounce(function() {
            console.log('📱 Reajustando submenús por cambio de viewport');
            submenus.forEach(submenu => {
                const container = submenu.closest('.has-submenu');
                if (container) {
                    adjustSubmenuPosition(submenu, container);
                }
            });
        }, 250));

        submenuPositionInitialized = true;
        console.log('✅ Sistema de posicionamiento de submenús inicializado correctamente');
    }

    function adjustSubmenuPosition(submenu, container) {
        // Solo ajustar en desktop
        if (window.innerWidth <= 768) return;

        // Resetear clases de ajuste previas
        submenu.classList.remove('adjust-left', 'adjust-right');
        
        // Obtener dimensiones
        const submenuRect = submenu.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // Calcular si el submenú se sale de la pantalla
        const submenuLeft = submenuRect.left;
        const submenuRight = submenuRect.right;
        const margin = 20; // Margen de seguridad
        
        let needsAdjustment = false;
        let adjustmentType = '';

        // Verificar si se sale por la izquierda
        if (submenuLeft < margin) {
            needsAdjustment = true;
            adjustmentType = 'left';
            console.log(`🔧 Submenú se sale por la izquierda (${submenuLeft.toFixed(1)}px), aplicando ajuste`);
        }
        // Verificar si se sale por la derecha
        else if (submenuRight > viewportWidth - margin) {
            needsAdjustment = true;
            adjustmentType = 'right';
            console.log(`🔧 Submenú se sale por la derecha (${submenuRight.toFixed(1)}px > ${viewportWidth - margin}px), aplicando ajuste`);
        }

        if (needsAdjustment) {
            submenu.classList.add(`adjust-${adjustmentType}`);
            
            // Verificar el resultado después del ajuste
            setTimeout(() => {
                const newRect = submenu.getBoundingClientRect();
                const success = newRect.left >= 0 && newRect.right <= viewportWidth;
                console.log(`${success ? '✅' : '⚠️'} Ajuste ${adjustmentType} ${success ? 'exitoso' : 'parcial'}: ${newRect.left.toFixed(1)}px - ${newRect.right.toFixed(1)}px`);
            }, 100);
        } else {
            console.log(`✅ Submenú posicionado correctamente: ${submenuLeft.toFixed(1)}px - ${submenuRight.toFixed(1)}px`);
        }
    }

    // Utilidad de debounce para optimizar el resize
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Función para diagnóstico manual
    window.diagnoseSubmenuPositioning = function() {
        console.log('🔍 Diagnóstico manual de posicionamiento de submenús');
        
        const submenus = document.querySelectorAll('.submenu');
        console.log(`📊 Total de submenús encontrados: ${submenus.length}`);
        
        submenus.forEach((submenu, index) => {
            const container = submenu.closest('.has-submenu');
            const rect = submenu.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            console.log(`📏 Submenú ${index + 1}:`);
            console.log(`   - Posición: ${rect.left.toFixed(1)}px - ${rect.right.toFixed(1)}px`);
            console.log(`   - Contenedor: ${containerRect.left.toFixed(1)}px - ${containerRect.right.toFixed(1)}px`);
            console.log(`   - Clases: ${submenu.className}`);
            console.log(`   - Visible: ${rect.width > 0 && rect.height > 0}`);
            console.log(`   - Opacidad: ${window.getComputedStyle(submenu).opacity}`);
        });
    };

    // Función para forzar reajuste
    window.forceSubmenuReposition = function() {
        console.log('🔄 Forzando reajuste de todos los submenús');
        const submenus = document.querySelectorAll('.submenu');
        submenus.forEach(submenu => {
            const container = submenu.closest('.has-submenu');
            if (container) {
                adjustSubmenuPosition(submenu, container);
            }
        });
    };

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSubmenuPositioning);
    } else {
        initSubmenuPositioning();
    }

    // Reintentar si la navbar no está lista
    setTimeout(() => {
        if (!submenuPositionInitialized) {
            console.log('🔄 Reintentando inicialización de posicionamiento de submenús');
            initSubmenuPositioning();
        }
    }, 1000);

})();
