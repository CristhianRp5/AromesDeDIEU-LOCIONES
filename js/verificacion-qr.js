// ======= VERIFICACIÓN QR JAVASCRIPT ======= 

// Variables globales
let qrVerificationInitialized = false;

// Cargar navbar en el fondo
document.addEventListener('DOMContentLoaded', function() {
    // Cargar navbar silenciosamente
    fetch('html/navbar.html')
        .then(response => response.text())
        .then(data => {
            const navbarContainer = document.getElementById('navbar-container');
            if (navbarContainer) {
                navbarContainer.innerHTML = data;
                
                // Inicializar navbar después de cargarla
                if (typeof initNavbar === 'function') {
                    setTimeout(initNavbar, 100);
                }
            }
        })
        .catch(error => {
            console.log('Navbar no cargada en verificación:', error);
        });
});

// Extraer parámetros de la URL
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        qr: urlParams.get('qr'),
        product: urlParams.get('product')
    };
}

// Cargar datos del QR desde Supabase usando QRService
async function loadQRData(qrId) {
    try {
        console.log('🔍 Buscando QR usando QRService:', qrId);
        
        // Inicializar QRService
        if (typeof window.QRService === 'undefined') {
            console.log('📝 Inicializando QRService...');
            const qrService = new QRService();
            await qrService.initialize();
            window.QRService = qrService;
        }

        // Obtener información del QR usando QRService
        const qrInfo = await window.QRService.getQRInfo(qrId);
        
        if (!qrInfo) {
            console.warn('⚠️ QR no encontrado en base de datos');
            return loadQRDataFromLocalStorage(qrId);
        }

        console.log('✅ Datos QR obtenidos de base de datos:', qrInfo);

        // Registrar el escaneo
        try {
            await window.QRService.registerScan(qrId, {
                timestamp: new Date().toISOString()
            });
            console.log('✅ Escaneo registrado');
        } catch (scanError) {
            console.warn('⚠️ Error registrando escaneo:', scanError);
        }

        // Transformar datos al formato esperado por la página
        return {
            id: qrInfo.qr.id,
            producto: qrInfo.producto?.nombre || 'Producto AROME DE DIEU',
            marca: qrInfo.producto?.marca || 'AROME DE DIEU',
            lote: qrInfo.qr.lote || 'Sin especificar',
            fechaProduccion: qrInfo.qr.fechaProduccion,
            fechaCreacion: qrInfo.qr.fechaCreacion,
            imagen: qrInfo.producto?.imagen_url,
            imageUrl: qrInfo.producto?.imagen_url,
            precio: qrInfo.producto?.precio,
            ml: qrInfo.producto?.ml,
            categoria: qrInfo.producto?.categoria,
            descripcion: qrInfo.producto?.descripcion,
            luxury: qrInfo.producto?.luxury,
            escaneado: true,
            ultimaVerificacion: new Date().toISOString(),
            contadorEscaneos: (qrInfo.qr.totalEscaneos || 0) + 1
        };
        
    } catch (error) {
        console.error('❌ Error cargando datos QR usando QRService:', error);
        return loadQRDataFromLocalStorage(qrId);
    }
}

// Fallback: Cargar datos del QR desde localStorage
function loadQRDataFromLocalStorage(qrId) {
    try {
        console.log('🔄 Usando fallback localStorage para QR:', qrId);
        
        if (typeof window.QRService !== 'undefined') {
            const qrRecord = window.QRService.getQRFromLocalStorage(qrId);
            if (qrRecord) {
                console.log('✅ QR encontrado en localStorage via QRService:', qrRecord);
                return qrRecord;
            }
        }
        
        const qrHistory = JSON.parse(localStorage.getItem('qrHistory') || '[]');
        const qrRecord = qrHistory.find(qr => qr.id === qrId);
        
        if (qrRecord) {
            console.log('✅ QR encontrado en localStorage:', qrRecord);
            return qrRecord;
        }
        
        // Si no se encuentra en el historial, crear datos mock
        console.log('🔧 Creando datos mock para QR:', qrId);
        return {
            id: qrId,
            producto: 'Producto AROME DE DIEU',
            marca: 'AROME DE DIEU',
            lote: 'LOTE-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            fechaCreacion: new Date().toISOString(),
            escaneado: true,
            ultimaVerificacion: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Error cargando datos QR desde localStorage:', error);
        return null;
    }
}

// Actualizar datos en la página
function updateProductInfo(qrData) {
    if (!qrData) return;

    console.log('📋 Actualizando información del producto:', qrData);

    // Elementos principales
    const productNameEl = document.getElementById('productName');
    const productBrandEl = document.getElementById('productBrand');
    const qrCodeEl = document.getElementById('qrCode');
    const productLoteEl = document.getElementById('productLote');
    const verificationDateEl = document.getElementById('verificationDate');

    if (productNameEl) productNameEl.textContent = qrData.producto || 'Producto AROME DE DIEU';
    if (productBrandEl) productBrandEl.textContent = qrData.marca || 'AROME DE DIEU';
    if (qrCodeEl) qrCodeEl.textContent = qrData.id || 'QR-CODE';
    if (productLoteEl) productLoteEl.textContent = qrData.lote || 'Sin especificar';
    
    // Fecha de verificación actual
    const now = new Date();
    const dateString = now.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeString = now.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    if (verificationDateEl) {
        verificationDateEl.textContent = `${dateString} - ${timeString}`;
    }

    // 🔍 DEBUG: Verificar datos de imagen disponibles
    console.log('🖼️ Información de imagen disponible:');
    console.log('- qrData.imagen:', qrData.imagen);
    console.log('- qrData.imageUrl:', qrData.imageUrl);
    console.log('- qrData.imagen_url:', qrData.imagen_url);
    console.log('- qrData.imagenUrl:', qrData.imagenUrl);
    console.log('- qrData.productImage:', qrData.productImage);
    console.log('- qrData.categoria:', qrData.categoria);
    console.log('- qrData.producto:', qrData.producto);

    // Cargar imagen del producto
    loadProductImage(qrData);

    // Marcar como escaneado en localStorage
    markAsScanned(qrData.id);
}

// Cargar imagen del producto
function loadProductImage(qrData) {
    const productImage = document.getElementById('productImage');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    
    if (!productImage || !imagePlaceholder) {
        console.warn('⚠️ Elementos de imagen no encontrados');
        return;
    }

    console.log('🖼️ Datos del producto para imagen:', qrData);

    // Buscar imagen en diferentes posibles ubicaciones (ordenadas por prioridad)
    const possibleImages = [
        // 🎯 PRIORIDAD 1: URLs directas de la base de datos
        qrData.imagen,
        qrData.imageUrl,
        qrData.imagen_url,
        qrData.imagenUrl,
        qrData.productImage,
        
        // 🎯 PRIORIDAD 2: Construir rutas basadas en el nombre del producto
        qrData.producto ? `IMAGENES/${qrData.producto.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}.jpg` : null,
        qrData.producto ? `IMAGENES/${qrData.producto.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}.png` : null,
        qrData.producto ? `IMAGENES/${qrData.producto.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}.webp` : null,
        
        // 🎯 PRIORIDAD 3: Rutas basadas en ID del producto
        qrData.id ? `IMAGENES/producto_${qrData.id}.jpg` : null,
        qrData.id ? `IMAGENES/producto_${qrData.id}.png` : null,
        qrData.id ? `IMAGENES/producto_${qrData.id}.webp` : null,
        
        // 🎯 PRIORIDAD 4: Rutas basadas en categoría
        qrData.categoria === 'Para Ellas' ? 'PARA_ELLAS.png' : null,
        qrData.categoria === 'Para Ellos' ? 'PARA_ELLOS.png' : null,
        qrData.categoria ? `IMAGENES/${qrData.categoria.replace(/\s+/g, '_')}.jpg` : null,
        
        // 🎯 PRIORIDAD 5: Rutas genéricas comunes
        'PARA_ELLAS.png',
        'PARA_ELLOS.png',
        
        // 🎯 PRIORIDAD 6: Rutas de respaldo
        'IMAGENES/producto_default.jpg',
        'IMAGENES/default_product.jpg',
        'IMAGENES/default.png',
        
        // 🎯 PRIORIDAD 7: Buscar en carpeta de lociones específicas
        qrData.categoria === 'Para Ellos' ? 'LOCIONES_PARA _ELLOS/default.jpg' : null,
        
        // 🎯 PRIORIDAD 8: URLs externas si existen
        qrData.external_image_url,
        qrData.url_imagen
    ].filter(Boolean); // Eliminar valores null/undefined

    console.log('🔍 Rutas de imagen a probar:', possibleImages);

    let imageLoaded = false;
    
    // Función optimizada de carga paralela
    function loadImagesFast() {
        console.log('🖼️ Iniciando carga paralela de imágenes...');
        console.log(`📋 Total de rutas a probar: ${possibleImages.length}`);
        
        // Mostrar indicador de carga
        imagePlaceholder.innerHTML = `
            <div class="placeholder-icon">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="placeholder-text">
                Cargando imagen...<br>
                ${qrData.producto || 'Producto'}
            </div>
        `;
        imagePlaceholder.style.display = 'flex';
        productImage.style.display = 'none';
        
        // Promesas para cargar las primeras 8 imágenes en paralelo (optimización)
        const imagePromises = possibleImages.slice(0, 8).map((imageSrc, index) => {
            return new Promise((resolve, reject) => {
                const testImage = new Image();
                const timeout = setTimeout(() => {
                    reject(new Error(`Timeout loading ${imageSrc}`));
                }, 1200); // Aumentado a 1.2s para mejores resultados
                
                testImage.onload = function() {
                    clearTimeout(timeout);
                    if (!imageLoaded) {
                        imageLoaded = true;
                        
                        // Animación suave de carga
                        productImage.src = imageSrc;
                        productImage.style.opacity = '0';
                        productImage.style.display = 'block';
                        imagePlaceholder.style.display = 'none';
                        
                        // Fade in
                        setTimeout(() => {
                            productImage.style.transition = 'opacity 0.4s ease-in-out';
                            productImage.style.opacity = '1';
                        }, 50);
                        
                        console.log(`✅ Imagen cargada exitosamente (posición ${index + 1}):`, imageSrc);
                        resolve({ src: imageSrc, success: true, position: index + 1 });
                    }
                };
                
                testImage.onerror = function() {
                    clearTimeout(timeout);
                    console.log(`❌ Error cargando imagen (posición ${index + 1}):`, imageSrc);
                    reject(new Error(`Failed to load ${imageSrc}`));
                };
                
                // Configurar carga optimizada
                testImage.crossOrigin = 'anonymous';
                testImage.loading = 'eager';
                testImage.src = imageSrc;
            });
        });

        // Usar Promise.race para obtener la primera imagen que cargue
        Promise.race(imagePromises)
            .then(result => {
                console.log(`🏆 Primera imagen cargada desde posición ${result.position}:`, result.src);
            })
            .catch((error) => {
                console.log('⚠️ Error en carga rápida, intentando fallback...', error.message);
                loadImagesFallback();
            });
    }

    // Función de fallback para imágenes restantes
    function loadImagesFallback() {
        console.log('🔄 Intentando carga secuencial de fallback...');
        
        const remainingImages = possibleImages.slice(8); // Continuar desde la posición 8
        let currentIndex = 0;

        function tryNextImage() {
            if (currentIndex >= remainingImages.length || imageLoaded) {
                if (!imageLoaded) {
                    console.warn('⚠️ Agotadas todas las opciones de imagen');
                    showImagePlaceholder();
                }
                return;
            }

            const imageSrc = remainingImages[currentIndex];
            const testImage = new Image();
            
            console.log(`🔍 Probando imagen fallback ${currentIndex + 9}:`, imageSrc);
            
            const timeout = setTimeout(() => {
                console.log(`⏰ Timeout en imagen fallback ${currentIndex + 9}:`, imageSrc);
                currentIndex++;
                tryNextImage();
            }, 800);
            
            testImage.onload = function() {
                clearTimeout(timeout);
                if (!imageLoaded) {
                    imageLoaded = true;
                    
                    // Animación de carga suave
                    productImage.src = imageSrc;
                    productImage.style.opacity = '0';
                    productImage.style.display = 'block';
                    imagePlaceholder.style.display = 'none';
                    
                    setTimeout(() => {
                        productImage.style.transition = 'opacity 0.4s ease-in-out';
                        productImage.style.opacity = '1';
                    }, 50);
                    
                    console.log(`✅ Imagen fallback cargada (posición ${currentIndex + 9}):`, imageSrc);
                }
            };
            
            testImage.onerror = function() {
                clearTimeout(timeout);
                console.log(`❌ Error en imagen fallback ${currentIndex + 9}:`, imageSrc);
                currentIndex++;
                tryNextImage();
            };
            
            testImage.crossOrigin = 'anonymous';
            testImage.src = imageSrc;
        }

        tryNextImage();
    }

    // Mostrar placeholder si no se encuentra imagen
    function showImagePlaceholder() {
        if (!imageLoaded) {
            console.warn('⚠️ No se pudo cargar ninguna imagen del producto');
            console.log('📋 Rutas intentadas sin éxito:', possibleImages);
            
            // Determinar tipo de producto para icono apropiado
            let iconClass = 'fas fa-image';
            let productText = qrData.producto || 'Producto';
            
            if (qrData.categoria) {
                if (qrData.categoria.toLowerCase().includes('ella')) {
                    iconClass = 'fas fa-female';
                } else if (qrData.categoria.toLowerCase().includes('ello')) {
                    iconClass = 'fas fa-male';
                } else if (qrData.categoria.toLowerCase().includes('unisex')) {
                    iconClass = 'fas fa-users';
                }
            }
            
            imagePlaceholder.innerHTML = `
                <div class="placeholder-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="placeholder-text">
                    ${productText}<br>
                    <small style="font-size: 0.7em; opacity: 0.7;">AROME DE DIEU</small>
                </div>
            `;
            
            imagePlaceholder.style.display = 'flex';
            productImage.style.display = 'none';
            
            // Agregar animación de fade in al placeholder
            imagePlaceholder.style.opacity = '0';
            setTimeout(() => {
                imagePlaceholder.style.transition = 'opacity 0.3s ease-in-out';
                imagePlaceholder.style.opacity = '1';
            }, 50);
        }
    }

    // Iniciar carga optimizada
    loadImagesFast();
    
    // Timeout general más corto
    setTimeout(() => {
        if (!imageLoaded) {
            showImagePlaceholder();
        }
    }, 2000); // Reducido de 3000 a 2000ms
}

// Marcar QR como escaneado
function markAsScanned(qrId) {
    try {
        const qrHistory = JSON.parse(localStorage.getItem('qrHistory') || '[]');
        const qrIndex = qrHistory.findIndex(qr => qr.id === qrId);
        
        if (qrIndex !== -1) {
            qrHistory[qrIndex].escaneado = true;
            qrHistory[qrIndex].ultimaVerificacion = new Date().toISOString();
            qrHistory[qrIndex].contadorEscaneos = (qrHistory[qrIndex].contadorEscaneos || 0) + 1;
            
            localStorage.setItem('qrHistory', JSON.stringify(qrHistory));
            console.log('✅ QR marcado como escaneado en localStorage');
        }
    } catch (error) {
        console.error('Error marcando QR como escaneado:', error);
    }
}

// Función principal de inicialización
async function init() {
    console.log('🔍 Inicializando verificación QR...');
    
    if (qrVerificationInitialized) {
        console.log('⚠️ Verificación QR ya inicializada');
        return;
    }
    
    try {
        const params = getUrlParams();
        console.log('📋 Parámetros URL:', params);
        
        if (params.qr) {
            // Mostrar estado de carga
            updateProductInfo({
                producto: 'Verificando producto...',
                marca: 'AROME DE DIEU',
                id: params.qr
            });
            
            const qrData = await loadQRData(params.qr);
            console.log('📦 Datos QR cargados:', qrData);
            
            if (qrData) {
                updateProductInfo(qrData);
                console.log('✅ Verificación QR completada');
            } else {
                showQRError('No se pudo cargar la información del producto');
            }
        } else {
            console.warn('⚠️ No se encontró ID de QR en la URL');
            // Mostrar datos genéricos
            updateProductInfo({
                producto: 'Producto AROME DE DIEU',
                marca: 'AROME DE DIEU',
                id: 'DEMO-QR',
                lote: 'DEMO-001'
            });
        }
        
        qrVerificationInitialized = true;
        
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
        showQRError('Error verificando el producto');
    }
    
    // Mostrar contador de redirección después de 2 segundos para dar tiempo de visualización
    setTimeout(() => {
        showRedirectCountdown();
    }, 2000);
}

// Mostrar error de QR
function showQRError(message) {
    const productNameEl = document.getElementById('productName');
    const verificationTitleEl = document.querySelector('.verification-title');
    const verificationSubtitleEl = document.querySelector('.verification-subtitle');
    
    if (productNameEl) productNameEl.textContent = message;
    if (verificationTitleEl) verificationTitleEl.textContent = 'Error de Verificación';
    if (verificationSubtitleEl) verificationSubtitleEl.textContent = 'No se pudo verificar la autenticidad del producto';
    
    // Cambiar el estado de verificación a error
    const statusElement = document.querySelector('.verification-status');
    if (statusElement) {
        const statusIcon = statusElement.querySelector('.status-icon i');
        const statusText = statusElement.querySelector('.status-text');
        
        statusElement.style.background = 'linear-gradient(135deg, rgba(220, 53, 69, 0.2) 0%, rgba(220, 53, 69, 0.1) 100%)';
        statusElement.style.borderColor = '#dc3545';
        
        if (statusIcon) {
            statusIcon.className = 'fas fa-exclamation-circle';
            statusIcon.style.color = '#dc3545';
        }
        
        if (statusText) {
            statusText.textContent = '⚠ Error de Verificación';
            statusText.style.color = '#dc3545';
        }
    }
}

// Función para mostrar y manejar el contador de redirección
function showRedirectCountdown() {
    const countdownElement = document.getElementById('redirectCountdown');
    const timerElement = document.getElementById('countdownTimer');
    
    if (countdownElement && timerElement) {
        countdownElement.style.display = 'block';
        
        let countdown = 5; // 5 segundos (2 segundos de espera + 5 segundos de countdown = 7 segundos total)
        timerElement.textContent = countdown;
        
        console.log('⏰ Iniciando countdown de redirección:', countdown, 'segundos');
        
        // Actualizar contador cada segundo
        const countdownInterval = setInterval(() => {
            countdown--;
            timerElement.textContent = countdown;
            
            console.log('⏰ Countdown:', countdown, 'segundos restantes');
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                console.log('⏰ Countdown completado - Iniciando redirección');
                redirectToIndex();
            }
        }, 1000);
        
        console.log('⏰ Contador de redirección iniciado - Total: 7 segundos desde carga');
    } else {
        console.warn('⚠️ Elementos de countdown no encontrados');
        // Fallback: redirigir directamente después de 5 segundos
        setTimeout(() => {
            redirectToIndex();
        }, 5000);
    }
}

// Función para redirigir al index con efecto
function redirectToIndex() {
    console.log('🔄 Iniciando redirección a la tienda principal...');
    
    // Añadir efecto de fade out antes de redirigir
    const verificationOverlay = document.querySelector('.verification-overlay');
    if (verificationOverlay) {
        verificationOverlay.classList.add('fade-out');
        console.log('✨ Aplicando efecto de fade-out');
    }
    
    // Mostrar mensaje de redirección
    const countdownElement = document.getElementById('redirectCountdown');
    if (countdownElement) {
        countdownElement.innerHTML = `
            <p class="countdown-text">
                <i class="fas fa-spinner fa-spin"></i>
                Redirigiendo a la tienda...
            </p>
        `;
    }
    
    // Redirigir después del efecto de fade
    setTimeout(() => {
        console.log('🏪 Redirigiendo a index.html...');
        
        // Intentar diferentes rutas en orden de prioridad
        const possibleIndexes = [
            'index.html',
            './index.html',
            '../index.html',
            '/'
        ];
        
        // Verificar si existe index.html
        fetch('index.html', { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    window.location.href = 'index.html';
                } else {
                    // Fallback a la ruta raíz
                    window.location.href = '/';
                }
            })
            .catch(() => {
                console.log('🔄 Usando fallback de redirección');
                // Si no puede verificar, usar ruta relativa
                window.location.href = 'index.html';
            });
            
    }, 800); // Reducido a 800ms para una transición más rápida
}

// ===== FUNCIONES DE DEBUG Y TESTING =====

// Función global para testear el sistema de imágenes dinámicas
window.testImageSystem = function(testData = null) {
    console.log('🧪 === TESTING SISTEMA DE IMÁGENES DINÁMICAS ===');
    
    const defaultTestData = {
        id: 'TEST-001',
        producto: 'Fragancia Test AROME DE DIEU',
        marca: 'AROME DE DIEU',
        categoria: 'Para Ellas',
        imagen: 'PARA_ELLAS.png', // Esta debería cargar
        imagen_url: 'test-image.jpg',
        lote: 'TEST-LOTE-001'
    };
    
    const qrData = testData || defaultTestData;
    
    console.log('📋 Datos de prueba:', qrData);
    console.log('🔄 Iniciando test de carga de imagen...');
    
    updateProductInfo(qrData);
    
    // Mostrar rutas que se van a probar
    setTimeout(() => {
        console.log('⏰ Test completado. Revisa la consola para ver los logs de carga de imagen.');
    }, 3000);
};

// Función global para testear la redirección
window.testRedirection = function(skipCountdown = false) {
    console.log('🧪 === TESTING SISTEMA DE REDIRECCIÓN ===');
    
    if (skipCountdown) {
        console.log('⚡ Test de redirección inmediata');
        redirectToIndex();
    } else {
        console.log('⏰ Test de redirección con countdown');
        showRedirectCountdown();
    }
};

// Función para cancelar la redirección (útil para testing)
window.cancelRedirection = function() {
    console.log('🛑 Cancelando redirección automática');
    
    // Ocultar countdown
    const countdownElement = document.getElementById('redirectCountdown');
    if (countdownElement) {
        countdownElement.style.display = 'none';
    }
    
    // Limpiar cualquier timeout activo
    const highestTimeoutId = setTimeout(";");
    for (let i = 0 ; i < highestTimeoutId ; i++) {
        clearTimeout(i); 
    }
    
    console.log('✅ Redirección cancelada - página permanecerá visible');
};

// Función para verificar el estado de redirección
window.checkRedirectionStatus = function() {
    const countdownElement = document.getElementById('redirectCountdown');
    const timerElement = document.getElementById('countdownTimer');
    
    console.log('📊 === ESTADO DE REDIRECCIÓN ===');
    console.log('- Countdown visible:', countdownElement ? countdownElement.style.display !== 'none' : false);
    console.log('- Tiempo restante:', timerElement ? timerElement.textContent : 'N/A');
    console.log('- URL actual:', window.location.href);
    console.log('- Referrer:', document.referrer);
    
    return {
        countdownVisible: countdownElement ? countdownElement.style.display !== 'none' : false,
        timeRemaining: timerElement ? timerElement.textContent : null,
        currentUrl: window.location.href
    };
};

// Función para simular diferentes escenarios de QR
window.simulateQRScenarios = function() {
    console.log('🎭 === SIMULANDO DIFERENTES ESCENARIOS DE QR ===');
    
    const scenarios = [
        {
            name: 'QR con imagen directa',
            data: {
                id: 'QR-IMG-001',
                producto: 'Perfume Luxury Para Ellas',
                categoria: 'Para Ellas',
                imagen: 'PARA_ELLAS.png'
            }
        },
        {
            name: 'QR solo con categoría',
            data: {
                id: 'QR-CAT-002',
                producto: 'Fragancia Masculina',
                categoria: 'Para Ellos'
            }
        },
        {
            name: 'QR sin imagen disponible',
            data: {
                id: 'QR-NO-IMG-003',
                producto: 'Producto Sin Imagen',
                categoria: 'Unisex'
            }
        }
    ];
    
    scenarios.forEach((scenario, index) => {
        console.log(`\n🎬 Escenario ${index + 1}: ${scenario.name}`);
        setTimeout(() => {
            window.testImageSystem(scenario.data);
        }, index * 5000); // 5 segundos entre cada test
    });
};

// Manejar errores globales
window.addEventListener('error', (e) => {
    console.error('Error en verificación QR:', e.error);
});

// ===== FUNCIONES PRINCIPALES =====

// Función de debug global
window.debugQRVerification = function() {
    console.log('🔧 Debug QR Verification:', {
        initialized: qrVerificationInitialized,
        urlParams: getUrlParams(),
        qrHistory: JSON.parse(localStorage.getItem('qrHistory') || '[]')
    });
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
