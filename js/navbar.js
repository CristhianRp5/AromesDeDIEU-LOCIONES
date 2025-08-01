// Variables globales
let initAttempts = 0;
const MAX_ATTEMPTS = 10;
let navbarInitialized = false;

// Función principal de inicialización de la navbar
function initNavbar() {
    console.log('Iniciando inicialización de navbar');
    if (navbarInitialized) {
        console.log('La navbar ya está inicializada');
        return;
    }

    const navbar = document.querySelector('.navbar');
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const navbarMenu = document.querySelector('.navbar-menu');

    if (!navbar || !hamburgerMenu || !navbarMenu) {
        console.log('Elementos de navbar no encontrados, reintentando...');
        initAttempts++;
        if (initAttempts < MAX_ATTEMPTS) {
            setTimeout(initNavbar, 100);
        }
        return;
    }

    console.log('Elementos de navbar encontrados, configurando eventos');
    
    // Toggle del menú hamburguesa
    hamburgerMenu.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Hamburger menu clicked!');
        hamburgerMenu.classList.toggle('active');
        navbarMenu.classList.toggle('active');
        document.body.style.overflow = hamburgerMenu.classList.contains('active') ? 'hidden' : '';
        console.log('Hamburger active:', hamburgerMenu.classList.contains('active'));
        console.log('Menu active:', navbarMenu.classList.contains('active'));
    });

    // Cerrar menú al hacer click en enlaces finales (que no tienen submenús)
    navbarMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            const parentLi = link.closest('li');
            const hasSubmenu = parentLi && parentLi.classList.contains('has-submenu');
            
            // Solo cerrar el menú si el enlace no tiene submenú Y no es un enlace placeholder (#)
            if (!hasSubmenu && link.getAttribute('href') !== '#') {
                hamburgerMenu.classList.remove('active');
                navbarMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Manejar submenús con mejores animaciones
    document.querySelectorAll('.has-submenu').forEach(item => {
        const link = item.querySelector('a');
        const submenu = item.querySelector('.submenu');
        const arrow = item.querySelector('.submenu-arrow');
        
        if (link && submenu && arrow) {
            link.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    
                    // Cerrar otros submenús abiertos con animación
                    document.querySelectorAll('.has-submenu.active').forEach(openItem => {
                        if (openItem !== item) {
                            openItem.classList.remove('active');
                            const openLink = openItem.querySelector('a');
                            const openArrow = openItem.querySelector('.submenu-arrow');
                            if (openLink) {
                                openLink.setAttribute('aria-expanded', 'false');
                            }
                            if (openArrow) {
                                openArrow.style.transform = '';
                            }
                        }
                    });
                    
                    // Toggle del submenú actual con animación mejorada
                    const isActive = item.classList.contains('active');
                    
                    if (!isActive) {
                        // Abrir submenú
                        item.classList.add('active');
                        link.setAttribute('aria-expanded', 'true');
                        arrow.style.transform = 'rotate(180deg)';
                        
                        // Animar los elementos del submenú
                        setTimeout(() => {
                            const submenuItems = submenu.querySelectorAll('a');
                            submenuItems.forEach((item, index) => {
                                setTimeout(() => {
                                    item.style.animation = `slideInSubmenu 0.3s ease forwards`;
                                }, index * 50);
                            });
                        }, 100);
                    } else {
                        // Cerrar submenú
                        item.classList.remove('active');
                        link.setAttribute('aria-expanded', 'false');
                        arrow.style.transform = '';
                        
                        // Limpiar animaciones
                        const submenuItems = submenu.querySelectorAll('a');
                        submenuItems.forEach(item => {
                            item.style.animation = '';
                        });
                    }
                    
                    console.log('Submenu toggled:', link.textContent, 'Active:', !isActive);
                }
            });

            // Mejorar feedback visual en hover para desktop
            if (window.innerWidth > 768) {
                item.addEventListener('mouseenter', () => {
                    arrow.style.transform = 'translateY(-1px)';
                });
                
                item.addEventListener('mouseleave', () => {
                    if (!item.classList.contains('active')) {
                        arrow.style.transform = '';
                    }
                });
            }
        }
    });

    // Cerrar submenús al hacer click fuera de ellos
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && navbarMenu.classList.contains('active')) {
            const clickedElement = e.target;
            const isInsideSubmenu = clickedElement.closest('.has-submenu');
            
            if (!isInsideSubmenu) {
                // Cerrar todos los submenús abiertos con animación
                document.querySelectorAll('.has-submenu.active').forEach(item => {
                    item.classList.remove('active');
                    const link = item.querySelector('a');
                    const arrow = item.querySelector('.submenu-arrow');
                    const submenu = item.querySelector('.submenu');
                    
                    if (link) {
                        link.setAttribute('aria-expanded', 'false');
                    }
                    if (arrow) {
                        arrow.style.transform = '';
                    }
                    if (submenu) {
                        const submenuItems = submenu.querySelectorAll('a');
                        submenuItems.forEach(item => {
                            item.style.animation = '';
                        });
                    }
                });
            }
        }
    });

    navbarInitialized = true;
    console.log('✓ Navbar inicializada correctamente');
}

// Event listener para cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Intentando inicializar navbar');
    
    // Intentar inicializar la navbar inmediatamente
    initNavbar();

    // Si no se inicializó en el primer intento, crear un observer para detectar cambios
    if (!navbarInitialized) {
        console.log('Primera inicialización falló, creando observer');
        const observer = new MutationObserver((mutations) => {
            if (!navbarInitialized) {
                console.log('Cambio detectado en DOM, reintentando inicialización');
                initNavbar();
            } else {
                observer.disconnect();
            }
        });

        observer.observe(document.body, { 
            childList: true,
            subtree: true 
        });
    }
});

// Función adicional para inicialización manual si es necesario
window.forceInitNavbar = function() {
    navbarInitialized = false;
    initAttempts = 0;
    initNavbar();
};

// ======= DETECCIÓN AUTOMÁTICA DE COLOR DE FONDO ======= 

function detectBackgroundColor() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // Función para calcular la luminancia de un color
    function getLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    // Función para extraer valores RGB de un color
    function getRGBValues(color) {
        const div = document.createElement('div');
        div.style.color = color;
        document.body.appendChild(div);
        const computedColor = window.getComputedStyle(div).color;
        document.body.removeChild(div);
        
        const match = computedColor.match(/\d+/g);
        return match ? match.map(Number) : [255, 255, 255];
    }

    // Función principal de detección
    function checkBackgroundBrightness() {
        // Obtener la posición de la navbar
        const navbarRect = navbar.getBoundingClientRect();
        const navbarCenter = {
            x: navbarRect.left + navbarRect.width / 2,
            y: navbarRect.top + navbarRect.height / 2
        };

        // Crear un elemento temporal para detectar el color de fondo
        const detector = document.createElement('div');
        detector.style.position = 'fixed';
        detector.style.left = navbarCenter.x + 'px';
        detector.style.top = navbarCenter.y + 'px';
        detector.style.width = '1px';
        detector.style.height = '1px';
        detector.style.pointerEvents = 'none';
        detector.style.zIndex = '-1';
        detector.style.opacity = '0';
        
        document.body.appendChild(detector);

        // Obtener el color de fondo computado
        const computedStyle = window.getComputedStyle(detector);
        let backgroundColor = computedStyle.backgroundColor;

        // Si no hay color de fondo específico, buscar en elementos padre
        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
            const elementsBelow = document.elementsFromPoint(navbarCenter.x, navbarCenter.y + 100);
            
            for (let element of elementsBelow) {
                if (element === navbar || element === detector) continue;
                
                const elementStyle = window.getComputedStyle(element);
                const bgColor = elementStyle.backgroundColor;
                const bgImage = elementStyle.backgroundImage;
                
                if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                    backgroundColor = bgColor;
                    break;
                }
                
                // Si tiene imagen de fondo, asumimos que es oscura por defecto
                if (bgImage !== 'none') {
                    backgroundColor = 'rgb(50, 50, 50)';
                    break;
                }
            }
        }

        document.body.removeChild(detector);

        // Si aún no hay color específico, usar blanco por defecto
        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
            backgroundColor = 'rgb(255, 255, 255)';
        }

        // Convertir a RGB y calcular luminancia
        const [r, g, b] = getRGBValues(backgroundColor);
        const luminance = getLuminance(r, g, b);
        
        // Si la luminancia es alta (fondo claro), activar modo oscuro
        const isLightBackground = luminance > 0.5;
        
        if (isLightBackground) {
            navbar.classList.add('dark-mode');
            console.log('🌞 Fondo claro detectado - Navbar en modo oscuro', {
                backgroundColor,
                rgb: [r, g, b],
                luminance: luminance.toFixed(3)
            });
        } else {
            navbar.classList.remove('dark-mode');
            console.log('🌙 Fondo oscuro detectado - Navbar en modo claro', {
                backgroundColor,
                rgb: [r, g, b],
                luminance: luminance.toFixed(3)
            });
        }
    }

    // Ejecutar detección inicial
    checkBackgroundBrightness();

    // Detectar cambios en el scroll y cuando se carga la página
    let ticking = false;
    function handleScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                checkBackgroundBrightness();
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkBackgroundBrightness);
    
    // Observar cambios en el DOM que puedan afectar el fondo
    const observer = new MutationObserver(() => {
        setTimeout(checkBackgroundBrightness, 100);
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });

    // Función de debug global
    window.debugNavbarBackground = checkBackgroundBrightness;
}

// Inicializar la detección de color de fondo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar un poco para que la navbar esté completamente cargada
    setTimeout(detectBackgroundColor, 500);
});

// También inicializar cuando la navbar esté lista
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(detectBackgroundColor, 500);
    });
} else {
    setTimeout(detectBackgroundColor, 100);
}
