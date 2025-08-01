// Script de diagnóstico para errores en móviles
// Coloca este script en la consola del navegador en un dispositivo móvil
// para detectar problemas específicos

console.log('🔍 DIAGNÓSTICO MÓVIL - Aromes De Dieu');
console.log('================================');

// 1. Verificar viewport
const viewport = document.querySelector('meta[name="viewport"]');
console.log('✅ Viewport:', viewport ? viewport.content : '❌ NO ENCONTRADO');

// 2. Verificar recursos CSS
const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
console.log(`📱 CSS Files encontrados: ${cssLinks.length}`);
cssLinks.forEach((link, index) => {
    const isLoaded = link.sheet ? '✅' : '❌';
    console.log(`${isLoaded} CSS ${index + 1}: ${link.href}`);
});

// 3. Verificar recursos JS
const scripts = document.querySelectorAll('script[src]');
console.log(`📱 JS Files encontrados: ${scripts.length}`);
scripts.forEach((script, index) => {
    console.log(`📄 JS ${index + 1}: ${script.src}`);
});

// 4. Verificar errores de red
const checkResources = async () => {
    const resources = performance.getEntriesByType('resource');
    const failedResources = resources.filter(resource => 
        resource.transferSize === 0 && resource.decodedBodySize === 0
    );
    
    console.log('🌐 RECURSOS FALLIDOS:');
    if (failedResources.length === 0) {
        console.log('✅ Todos los recursos cargaron correctamente');
    } else {
        failedResources.forEach(resource => {
            console.log(`❌ FALLÓ: ${resource.name}`);
        });
    }
};

// 5. Verificar versioning
const checkVersioning = () => {
    const versionsFound = new Set();
    const allLinks = [...cssLinks, ...scripts];
    
    allLinks.forEach(element => {
        const url = element.href || element.src;
        const versionMatch = url.match(/v=(\d+\.\d+)/);
        if (versionMatch) {
            versionsFound.add(versionMatch[1]);
        }
    });
    
    console.log('🔢 VERSIONES ENCONTRADAS:', Array.from(versionsFound));
    if (versionsFound.size === 1) {
        console.log('✅ Versioning consistente');
    } else {
        console.log('⚠️ VERSIONES INCONSISTENTES - Esto puede causar problemas');
    }
};

// 6. Verificar touch events
const checkTouchSupport = () => {
    const hasTouch = 'ontouchstart' in window;
    console.log(`👆 Touch Support: ${hasTouch ? '✅' : '❌'}`);
    
    if (hasTouch) {
        console.log('📱 Dispositivo táctil detectado');
    }
};

// 7. Verificar orientación
const checkOrientation = () => {
    if (screen.orientation) {
        console.log(`📱 Orientación: ${screen.orientation.type}`);
    }
    console.log(`📏 Dimensiones: ${window.innerWidth}x${window.innerHeight}`);
};

// 8. Verificar localStorage/sessionStorage
const checkStorage = () => {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        console.log('💾 LocalStorage: ✅');
    } catch (e) {
        console.log('💾 LocalStorage: ❌', e.message);
    }
};

// Ejecutar todas las verificaciones
setTimeout(() => {
    checkResources();
    checkVersioning();
    checkTouchSupport();
    checkOrientation();
    checkStorage();
    
    // Detectar errores en consola
    const originalError = console.error;
    console.error = function(...args) {
        console.log('🚨 ERROR DETECTADO:', ...args);
        originalError.apply(console, args);
    };
    
    console.log('================================');
    console.log('✅ Diagnóstico completado');
    console.log('📱 Si ves errores ❌, compártelos para resolverlos');
}, 2000);

// Monitorear errores de red
window.addEventListener('error', (e) => {
    if (e.target !== window) {
        console.log('🚨 ERROR DE RECURSO:', e.target.src || e.target.href);
    }
});
