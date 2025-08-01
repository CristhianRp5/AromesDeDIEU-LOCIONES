// Funciones globales de testing para Para Ellas
window.testFiltersEllas = function() {
    console.log('🧪 TESTEO COMPLETO DE FILTROS PARA ELLAS');
    
    // 1. Verificar elementos
    const minBtn = document.getElementById('minPriceBtnEllas');
    const maxBtn = document.getElementById('maxPriceBtnEllas');
    const discountBtn = document.getElementById('discountBtnEllas');
    const clearBtn = document.getElementById('clearFiltersBtnEllas');
    const container = document.getElementById('filterButtonsContainerEllas');
    
    console.log('🔍 Elementos encontrados:', {
        minBtn: !!minBtn,
        maxBtn: !!maxBtn,
        discountBtn: !!discountBtn,
        clearBtn: !!clearBtn,
        container: !!container,
        containerVisible: container ? container.style.display !== 'none' : false
    });
    
    // 2. Verificar manager
    if (window.paraEllasManager) {
        console.log('✅ ParaEllasManager disponible');
        console.log('📊 Productos cargados:', window.paraEllasManager.productos?.length || 0);
        console.log('📊 Productos filtrados:', window.paraEllasManager.filteredProducts?.length || 0);
    } else {
        console.error('❌ ParaEllasManager NO disponible');
    }
    
    // 3. Simular click en precio mínimo
    if (minBtn) {
        console.log('🖱️ Simulando click en precio mínimo...');
        minBtn.click();
    }
};

window.toggleFiltersEllas = function() {
    const toggleBtn = document.getElementById('toggleFiltersBtnEllas');
    if (toggleBtn) {
        console.log('🔄 Haciendo toggle de filtros...');
        toggleBtn.click();
    } else {
        console.error('❌ Botón toggle no encontrado');
    }
};

window.debugFiltersEllas = function() {
    if (window.paraEllasManager && typeof window.paraEllasManager.debugFilters === 'function') {
        window.paraEllasManager.debugFilters();
    } else {
        console.error('❌ debugFilters no disponible');
    }
};

// Para Ellas - Integración con Supabase (Versión Final)
class ParaEllasManager {
    constructor() {
        this.productos = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.isAddingToCart = false; // Flag para prevenir clicks duplicados
        this.priceFilterInitialized = false; // Flag para prevenir inicialización múltiple
        this.activeFilters = {
            category: '',
            search: '',
            brand: '',
            subcategoria: '',
            priceMin: 0,
            priceMax: 10000000
        };
        
        this.init();
        this.initVideoHero();
    }

    // Inicializar el video hero
    initVideoHero() {
        document.addEventListener('DOMContentLoaded', () => {
            const video = document.querySelector('.hero-video');
            const overlay = document.querySelector('.video-overlay');
            const textContent = document.querySelector('.video-text-content');
            
            if (video) {
                // Asegurar que el video se reproduce automáticamente
                video.addEventListener('loadeddata', () => {
                    console.log('Video cargado correctamente');
                    video.play().catch(e => {
                        console.log('Error al reproducir video:', e);
                    });
                });
                
                // Forzar visibilidad del overlay
                if (overlay && textContent) {
                    overlay.style.display = 'flex';
                    overlay.style.zIndex = '10';
                    textContent.style.color = 'white';
                    textContent.style.visibility = 'visible';
                    textContent.style.opacity = '1';
                    
                    console.log('Overlay configurado correctamente');
                }
            }
        });
    }

    async init() {
        console.log('🚀 Inicializando ParaEllasManager...');
        
        // Hacer el manager disponible globalmente para reintentos
        window.paraEllasManager = this;
        
        this.showLoadingIndicator('Verificando dependencias...');
        
        // Verificar que Supabase esté disponible sin crear múltiples instancias
        if (typeof window.supabase === 'undefined' && typeof initSupabase === 'function') {
            console.log('🔄 Inicializando Supabase...');
            this.updateLoadingDetails('Configurando conexión a la base de datos...');
            initSupabase();
        }
        
        // Verificar dependencias
        const dependencies = this.checkDependencies();
        if (Object.values(dependencies).some(dep => !dep)) {
            console.error('❌ Algunas dependencias no están disponibles:', dependencies);
            this.hideLoadingIndicator();
            this.showError('Error de configuración', 'Faltan dependencias requeridas para cargar los productos');
            return;
        }
        
        this.updateLoadingDetails('Configurando eventos...');
        await this.loadProducts();
        
        this.updateLoadingDetails('Configurando interfaz...');
        this.setupEventListeners();
        this.renderProducts();
        this.setupFilters();
        this.setupPriceFilter();
        this.setupPagination(); // Agregar configuración de paginación
        
        // Hacer el manager disponible globalmente
        window.paraEllasManager = this;
        window.debugPricesEllas = () => this.debugPriceRange();
        window.testPricesEllas = () => this.testPriceCalculation();
        
        // Función de debug para el toggle
        window.debugToggleEllas = () => {
            const toggleBtn = document.getElementById('toggleFilterBtnEllas');
            const filterContainer = document.querySelector('.simple-price-filters');
            const filterButtons = document.getElementById('filterButtonsContainerEllas');
            
            console.log('🔍 Debug Toggle Estado:', {
                toggleBtn: !!toggleBtn,
                filterContainer: !!filterContainer,
                filterButtons: !!filterButtons,
                isCollapsed: filterContainer ? filterContainer.classList.contains('collapsed') : 'N/A',
                classList: filterContainer ? Array.from(filterContainer.classList) : 'N/A',
                buttonHeight: filterButtons ? filterButtons.offsetHeight : 'N/A',
                buttonScrollHeight: filterButtons ? filterButtons.scrollHeight : 'N/A',
                computedMaxHeight: filterButtons ? window.getComputedStyle(filterButtons).maxHeight : 'N/A',
                computedOpacity: filterButtons ? window.getComputedStyle(filterButtons).opacity : 'N/A'
            });
            
            return {
                toggleBtn,
                filterContainer,
                filterButtons
            };
        };
        
        // Función para forzar toggle
        window.forceToggleEllas = () => {
            const elements = window.debugToggleEllas();
            if (elements.filterContainer) {
                elements.filterContainer.classList.toggle('collapsed');
                console.log('✅ Toggle forzado ejecutado');
                window.debugToggleEllas();
            }
        };
        
        // Agregar panel de herramientas de debug
        this.addDebugPanel();
        
        console.log('✅ ParaEllasManager inicializado completamente');
        console.log('🔧 Para debug de precios, ejecuta: debugPricesEllas() o testPricesEllas()');
    }

    async loadProducts() {
        try {
            console.log('📦 Cargando productos para ellas...');
            this.showLoadingIndicator('Conectando con la base de datos...');
            
            // Verificar que ProductosService esté disponible
            if (typeof ProductosService === 'undefined') {
                console.error('❌ ProductosService no está disponible');
                this.hideLoadingIndicator();
                this.showError('Servicio de productos no disponible', 'ProductosService no está cargado correctamente');
                this.productos = [];
                this.filteredProducts = [];
                return;
            }
            
            this.updateLoadingDetails('Obteniendo productos para mujeres...');
            
            // Medir tiempo de carga
            const startTime = performance.now();
            
            // Cargar productos específicos para mujeres
            this.productos = await ProductosService.obtenerProductosPorCategoria('para-ellas');
            this.filteredProducts = [...this.productos];
            
            const endTime = performance.now();
            const loadTime = endTime - startTime;
            
            console.log(`✅ ${this.productos.length} productos cargados en ${loadTime.toFixed(2)}ms`);
            
            // Log adicional para debugging de precios
            if (this.productos.length > 0) {
                const productSample = this.productos.slice(0, 3);
                console.log('📋 Muestra de productos cargados:', productSample.map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    precio: p.precio,
                    categoria: p.categoria
                })));
                
                const allPrices = this.productos.map(p => p.precio || 0).filter(p => p > 0);
                console.log(`💰 Precios encontrados: ${allPrices.length}/${this.productos.length} productos tienen precio válido`);
                if (allPrices.length > 0) {
                    console.log(`📊 Rango inicial: $${Math.min(...allPrices)} - $${Math.max(...allPrices)}`);
                }
            }
            
            this.hideLoadingIndicator();
            
            if (this.productos.length === 0) {
                console.warn('⚠️ No se encontraron productos para la categoría "para-ellas"');
                this.showError('No se encontraron productos', 'No hay productos disponibles para la categoría "para-ellas"');
            } else {
                console.log(`✅ Productos cargados exitosamente:`, this.productos.slice(0, 3));
                console.log(`📊 Estadísticas: ${this.productos.length} productos, ${[...new Set(this.productos.map(p => p.marca))].length} marcas`);
            }
            
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.hideLoadingIndicator();
            this.showError('Error cargando productos', error.message);
            this.productos = [];
            this.filteredProducts = [];
        }
    }

    showLoadingIndicator(message = 'Cargando productos...') {
        const indicator = document.getElementById('loadingIndicator');
        const loadingText = indicator?.querySelector('.loading-text');
        
        if (indicator) {
            indicator.style.display = 'flex';
            if (loadingText) {
                loadingText.textContent = message;
            }
        }
        
        // También marcar el grid como loading
        const grid = document.querySelector('.index-grid');
        if (grid) {
            grid.classList.add('loading');
        }
    }

    updateLoadingDetails(details) {
        const loadingDetails = document.getElementById('loadingDetails');
        if (loadingDetails) {
            loadingDetails.textContent = details;
        }
    }

    hideLoadingIndicator() {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
        
        // Remover clase loading del grid
        const grid = document.querySelector('.index-grid');
        if (grid) {
            grid.classList.remove('loading');
        }
    }

    showError(title, message) {
        const container = document.querySelector('.index-grid');
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-message">
                <h3>${title}</h3>
                <p>${message}</p>
                <p>Tiempo de carga: ${new Date().toLocaleTimeString()}</p>
                <button class="retry-button" onclick="window.paraEllasManager?.init()">
                    Reintentar carga
                </button>
            </div>
        `;
    }

    checkDependencies() {
        console.log('🔍 Verificando dependencias...');
        
        const dependencies = {
            'Supabase JS': typeof window.supabase !== 'undefined',
            'initSupabase': typeof initSupabase !== 'undefined',
            'ProductosService': typeof ProductosService !== 'undefined',
            'supabaseClient': typeof supabaseClient !== 'undefined'
        };
        
        Object.entries(dependencies).forEach(([name, available]) => {
            console.log(`${available ? '✅' : '❌'} ${name}: ${available ? 'Disponible' : 'NO DISPONIBLE'}`);
        });
        
        return dependencies;
    }

    setupEventListeners() {
        // Configurar event listeners para filtros y búsqueda
        this.setupSearchFilter();
        this.setupCategoryFilters();
        this.setupBrandFilter();
        this.setupSubcategoryFilters();
        this.setupPaginationEvents();
        this.setupToggleFilters(); // Agregar toggle de filtros
    }

    setupSearchFilter() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.activeFilters.search = e.target.value.toLowerCase();
                    this.applyFilters();
                }, 300);
            });
        }
    }

    setupCategoryFilters() {
        const categoryButtons = document.querySelectorAll('.filter-btn[data-filter-type="category"]');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Actualizar clases activas
                categoryButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Aplicar filtro
                this.activeFilters.category = btn.dataset.filterValue;
                this.applyFilters();
            });
        });
    }

    setupBrandFilter() {
        const brandSelect = document.getElementById('brandFilter');
        if (brandSelect) {
            brandSelect.addEventListener('change', (e) => {
                this.activeFilters.brand = e.target.value;
                this.applyFilters();
            });
        }
    }

    setupSubcategoryFilters() {
        // Generar subcategorías dinámicamente
        this.renderSubcategoryFilters();
        
        // Configurar event listeners
        const subcategoryButtons = document.querySelectorAll('.filter-btn[data-filter-type="subcategoria"]');
        subcategoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                subcategoryButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.activeFilters.subcategoria = btn.dataset.filterValue;
                this.applyFilters();
            });
        });
    }

    setupToggleFilters() {
        const toggleBtn = document.getElementById('toggleFiltersBtnEllas');
        const filterButtonsContainer = document.getElementById('filterButtonsContainerEllas');
        
        if (toggleBtn && filterButtonsContainer) {
            // Estado inicial - filtros ocultos por defecto
            let filtersVisible = false;
            
            // Configurar estado inicial
            filterButtonsContainer.style.display = 'none';
            toggleBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron-icon">
                    <polyline points="18,15 12,9 6,15"></polyline>
                </svg>
            `;
            toggleBtn.setAttribute('title', 'Mostrar filtros');
            
            toggleBtn.addEventListener('click', () => {
                filtersVisible = !filtersVisible;
                
                if (filtersVisible) {
                    filterButtonsContainer.style.display = 'flex';
                    toggleBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron-icon">
                            <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                    `;
                    toggleBtn.setAttribute('title', 'Ocultar filtros');
                    console.log('🔽 Filtros expandidos');
                } else {
                    filterButtonsContainer.style.display = 'none';
                    toggleBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron-icon">
                            <polyline points="18,15 12,9 6,15"></polyline>
                        </svg>
                    `;
                    toggleBtn.setAttribute('title', 'Mostrar filtros');
                    console.log('🔼 Filtros colapsados');
                }
            });
            
            console.log('✅ Toggle de filtros configurado (cerrado por defecto)');
        } else {
            console.warn('⚠️ No se encontraron elementos para toggle de filtros');
        }
    }

    renderSubcategoryFilters() {
        const subcategoryContainer = document.querySelector('.subcategory-filters');
        const subcategorias = [...new Set(this.productos.map(p => p.subcategoria).filter(Boolean))].sort();
        
        if (subcategoryContainer && subcategorias.length > 0) {
            const subcategoriasHTML = subcategorias.map(sub => `
                <button class="filter-btn" data-filter-type="subcategoria" data-filter-value="${sub}">
                    ${sub}
                </button>
            `).join('');
            
            subcategoryContainer.innerHTML = `
                <div class="filter-group">
                    <h4>Subcategorías</h4>
                    <button class="filter-btn active" data-filter-type="subcategoria" data-filter-value="">
                        Todas
                    </button>
                    ${subcategoriasHTML}
                </div>
            `;
            
            // Reconfigurar event listeners después de crear los botones
            const newButtons = subcategoryContainer.querySelectorAll('.filter-btn[data-filter-type="subcategoria"]');
            newButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    newButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    this.activeFilters.subcategoria = btn.dataset.filterValue;
                    this.applyFilters();
                });
            });
        }
    }

    setupPriceFilter() {
        // Prevenir configuración múltiple
        if (this.priceFilterInitialized) {
            console.log('⚠️ Filtro de precio ya inicializado, saltando...');
            return;
        }
        
        console.log('🔧 Ejecutando setupPriceFilter para ellas...');
        console.log('📊 Estado actual - productos cargados:', this.productos.length);
        
        // Asegurar que el DOM esté listo
        const initializeFilters = () => {
            // Verificar si existen los nuevos filtros simples
            const simplePriceFilters = document.querySelector('.simple-price-filters');
            console.log('🔍 Elemento simple-price-filters encontrado:', !!simplePriceFilters);
            
            if (simplePriceFilters) {
                console.log('🎯 Inicializando filtros simples...');
                this.initializeSimplePriceFiltersEllas();
                this.priceFilterInitialized = true;
            } else {
                console.warn('⚠️ No se encontraron filtros simples, usando legacy...');
                // Fallback al filtro antiguo si no existen los nuevos
                this.initializeLegacyPriceFilterEllas();
                this.priceFilterInitialized = true;
            }
        };
        
        // Si el DOM ya está listo, ejecutar inmediatamente
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(initializeFilters, 100); // Pequeño delay para asegurar que todo esté renderizado
        } else {
            // Si no, esperar a que esté listo
            document.addEventListener('DOMContentLoaded', initializeFilters);
        }
    }

    initializeSimplePriceFiltersEllas() {
        console.log('🎨 Inicializando filtros de precio simples para ellas');
        
        // Agregar un pequeño delay para asegurar que el DOM esté completamente renderizado
        setTimeout(() => {
            this._setupPriceFiltersEllas();
        }, 100);
    }

    _setupPriceFiltersEllas() {
        console.log('🔧 Configurando filtros de precio para ellas...');
        
        // Buscar elementos con más debugging - sin importar si están visibles
        const elements = {
            minPriceBtn: document.getElementById('minPriceBtnEllas'),
            maxPriceBtn: document.getElementById('maxPriceBtnEllas'),
            discountBtn: document.getElementById('discountBtnEllas'),
            clearFiltersBtn: document.getElementById('clearFiltersBtnEllas'),
            filterButtonsContainer: document.getElementById('filterButtonsContainerEllas'),
            simplePriceFilters: document.querySelector('.simple-price-filters')
        };

        console.log('🔍 Debug elementos encontrados:', {
            minPriceBtn: !!elements.minPriceBtn,
            maxPriceBtn: !!elements.maxPriceBtn,
            discountBtn: !!elements.discountBtn,
            clearFiltersBtn: !!elements.clearFiltersBtn,
            filterButtonsContainer: !!elements.filterButtonsContainer,
            simplePriceFilters: !!elements.simplePriceFilters
        });

        // Debug adicional: verificar IDs en el DOM
        console.log('🔍 IDs encontrados en el DOM:', {
            minPriceBtnEllas: !!document.getElementById('minPriceBtnEllas'),
            maxPriceBtnEllas: !!document.getElementById('maxPriceBtnEllas'),
            discountBtnEllas: !!document.getElementById('discountBtnEllas'),
            clearFiltersBtnEllas: !!document.getElementById('clearFiltersBtnEllas'),
            filterButtonsContainerEllas: !!document.getElementById('filterButtonsContainerEllas')
        });

        if (!elements.minPriceBtn || !elements.maxPriceBtn || !elements.discountBtn) {
            console.error('❌ ELEMENTOS DE FILTRO NO ENCONTRADOS para ellas');
            console.log('🔍 Elementos disponibles en el DOM:', 
                Array.from(document.querySelectorAll('[id*="Btn"]')).map(el => el.id)
            );
            
            // Intentar reconfigurar después de un delay
            setTimeout(() => {
                console.log('🔄 Reintentando configuración de filtros...');
                this._setupPriceFiltersEllas();
            }, 500);
            return;
        }

        // Obtener rango de precios de los productos
        const prices = this.productos.map(p => p.precio || 0).filter(p => p > 0);
        if (prices.length === 0) {
            console.warn('⚠️ No hay productos con precios válidos');
            return;
        }

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        console.log(`💰 Rango de precios: $${minPrice} - $${maxPrice}`);

        // Event listeners para los botones de filtro
        elements.minPriceBtn.addEventListener('click', () => {
            console.log('🖱️ CLICK en botón Precio Mínimo (Ellas)');
            console.log('📊 Estado antes del filtro:', {
                productos: this.productos.length,
                filteredProducts: this.filteredProducts?.length || 0
            });
            
            this.clearActiveFiltersEllas();
            elements.minPriceBtn.classList.add('active');
            this.applySortFilterEllas('price_asc');
        });

        elements.maxPriceBtn.addEventListener('click', () => {
            console.log('🖱️ Click en botón Precio Máximo (Ellas)');
            console.log('📊 Estado antes del filtro:', {
                productos: this.productos.length,
                filteredProducts: this.filteredProducts?.length || 0
            });
            
            this.clearActiveFiltersEllas();
            elements.maxPriceBtn.classList.add('active');
            this.applySortFilterEllas('price_desc');
        });

        elements.discountBtn.addEventListener('click', () => {
            console.log('🖱️ Click en botón Con Descuento (Ellas)');
            console.log('📊 Estado antes del filtro:', {
                productos: this.productos.length,
                filteredProducts: this.filteredProducts?.length || 0
            });
            
            this.clearActiveFiltersEllas();
            elements.discountBtn.classList.add('active');
            
            // Asegurar que filteredProducts esté inicializado
            if (!this.filteredProducts) {
                this.filteredProducts = [...this.productos];
            }
            
            this.applyDiscountFilterEllas();
        });

        // Event listener para limpiar filtros
        if (elements.clearFiltersBtn) {
            elements.clearFiltersBtn.addEventListener('click', () => {
                console.log('🧹 Limpiando todos los filtros (Ellas)');
                this.clearAllFiltersEllas();
            });
        }

        console.log('✅ Filtros de precio simples inicializados para ellas');
    }

    // Función de debugging para probar filtros manualmente
    debugFilters() {
        console.log('🔧 === DEBUG DE FILTROS PARA ELLAS ===');
        console.log('📊 Estado actual:', {
            productos: this.productos?.length || 0,
            filteredProducts: this.filteredProducts?.length || 0,
            currentPage: this.currentPage,
            productsPerPage: this.productsPerPage
        });
        
        console.log('🔍 Elementos de filtro:', {
            minPriceBtn: !!document.getElementById('minPriceBtnEllas'),
            maxPriceBtn: !!document.getElementById('maxPriceBtnEllas'),
            discountBtn: !!document.getElementById('discountBtnEllas'),
            clearFiltersBtn: !!document.getElementById('clearFiltersBtnEllas')
        });
        
        console.log('💰 Muestra de precios:', 
            this.productos?.slice(0, 5).map(p => ({
                nombre: p.nombre,
                precio: p.precio,
                precio_descuento: p.precio_descuento
            })) || []
        );
        
        return {
            productos: this.productos?.length || 0,
            filteredProducts: this.filteredProducts?.length || 0,
            elementos: {
                minPriceBtn: !!document.getElementById('minPriceBtnEllas'),
                maxPriceBtn: !!document.getElementById('maxPriceBtnEllas'),
                discountBtn: !!document.getElementById('discountBtnEllas')
            }
        };
    }

    // Función para probar filtro de precio mínimo manualmente
    testMinPriceFilter() {
        console.log('🧪 === TESTE DE FILTRO PRECIO MÍNIMO ===');
        this.clearActiveFiltersEllas();
        document.getElementById('minPriceBtnEllas')?.classList.add('active');
        this.applySortFilterEllas('price_asc');
    }

    // Función para probar filtro de precio máximo manualmente
    testMaxPriceFilter() {
        console.log('🧪 === TESTE DE FILTRO PRECIO MÁXIMO ===');
        this.clearActiveFiltersEllas();
        document.getElementById('maxPriceBtnEllas')?.classList.add('active');
        this.applySortFilterEllas('price_desc');
    }

    // Función para probar filtro de descuento manualmente
    testDiscountFilter() {
        console.log('🧪 === TESTE DE FILTRO DESCUENTO ===');
        this.clearActiveFiltersEllas();
        document.getElementById('discountBtnEllas')?.classList.add('active');
        if (!this.filteredProducts) {
            this.filteredProducts = [...this.productos];
        }
        this.applyDiscountFilterEllas();
    }

    clearActiveFiltersEllas() {
        console.log('🧹 Limpiando filtros activos de botones (Ellas)');
        
        // Buscar todos los botones de filtro simple
        const filterButtons = [
            document.getElementById('minPriceBtnEllas'),
            document.getElementById('maxPriceBtnEllas'),
            document.getElementById('discountBtnEllas')
        ].filter(Boolean); // Eliminar elementos null
        
        console.log(`🔍 Botones de filtro encontrados: ${filterButtons.length}`);
        
        filterButtons.forEach(btn => {
            if (btn) {
                btn.classList.remove('active');
                console.log(`✅ Clase 'active' removida de: ${btn.id}`);
            }
        });
        
        // También buscar por clase como fallback
        const allFilterBtns = document.querySelectorAll('.simple-filter-btn.active');
        console.log(`🔍 Botones adicionales con clase active: ${allFilterBtns.length}`);
        
        allFilterBtns.forEach(btn => {
            btn.classList.remove('active');
            console.log(`✅ Clase 'active' removida de: ${btn.id || btn.className}`);
        });
    }

    clearAllFiltersEllas() {
        console.log('🧹 Limpiando todos los filtros activos (Ellas)');
        
        // Limpiar filtros de botones
        this.clearActiveFiltersEllas();
        
        // Restaurar todos los productos
        if (this.productos && this.productos.length > 0) {
            this.filteredProducts = [...this.productos];
            console.log(`✅ Filtros limpiados, ${this.filteredProducts.length} productos restaurados`);
        } else {
            console.warn('⚠️ No hay productos para restaurar');
            this.filteredProducts = [];
        }
        
        // Limpiar otros filtros activos
        this.activeFilters = {
            category: '',
            brand: '',
            subcategoria: '',
            search: '',
            priceMin: 0,
            priceMax: Infinity
        };
        
        // Limpiar barra de búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Limpiar filtros de categoría
        const categoryButtons = document.querySelectorAll('.index-filter');
        categoryButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === '') {
                btn.classList.add('active');
            }
        });
        
        // Limpiar filtros dinámicos
        const dynamicFilterButtons = document.querySelectorAll('.filter-btn');
        dynamicFilterButtons.forEach(btn => btn.classList.remove('active'));
        
        // Resetear página a la primera
        this.currentPage = 1;
        
        // Actualizar vista
        this.renderProducts();
        this.updateResultsCount();
        this.updatePagination();
        
        console.log('✅ Todos los filtros han sido limpiados (Ellas)');
    }

    applySortFilterEllas(sortType) {
        console.log(`🔄 Aplicando ordenamiento: ${sortType} (Ellas)`);
        
        // Asegurar que filteredProducts esté inicializado
        if (!this.filteredProducts || this.filteredProducts.length === 0) {
            console.log('⚠️ filteredProducts no inicializado, usando productos originales');
            this.filteredProducts = [...this.productos];
        }
        
        console.log(`📊 Productos a ordenar: ${this.filteredProducts.length}`);
        
        // Debug: Mostrar algunos precios antes del ordenamiento
        const priceSample = this.filteredProducts.slice(0, 5).map(p => ({
            nombre: p.nombre?.substring(0, 20) + '...',
            precio: p.precio,
            precio_original: p.precio_original,
            precio_descuento: p.precio_descuento
        }));
        console.log('💰 Muestra de precios antes del ordenamiento:', priceSample);
        
        let sortedProducts = [...this.filteredProducts];
        
        if (sortType === 'price_asc') {
            console.log('⬆️ Ordenando por precio ascendente');
            sortedProducts.sort((a, b) => {
                const priceA = parseFloat(a.precio) || 0;
                const priceB = parseFloat(b.precio) || 0;
                return priceA - priceB;
            });
        } else if (sortType === 'price_desc') {
            console.log('⬇️ Ordenando por precio descendente');
            sortedProducts.sort((a, b) => {
                const priceA = parseFloat(a.precio) || 0;
                const priceB = parseFloat(b.precio) || 0;
                return priceB - priceA;
            });
        }
        
        // Debug: Mostrar algunos precios después del ordenamiento
        const sortedPriceSample = sortedProducts.slice(0, 5).map(p => ({
            nombre: p.nombre?.substring(0, 20) + '...',
            precio: p.precio
        }));
        console.log('💰 Muestra de precios después del ordenamiento:', sortedPriceSample);
        
        this.filteredProducts = sortedProducts;
        this.currentPage = 1;
        
        console.log(`✅ Productos ordenados: ${this.filteredProducts.length}`);
        
        this.renderProducts();
        this.updateResultsCount();
        this.updatePagination();
    }

    updateResultsCount() {
        const resultsElement = document.getElementById('searchResults');
        if (!resultsElement) {
            console.warn('⚠️ Elemento searchResults no encontrado');
            return;
        }

        const total = this.filteredProducts?.length || 0;
        const totalOriginal = this.productos?.length || 0;
        
        console.log(`📊 Actualizando contador: ${total} de ${totalOriginal} productos`);
        
        if (total === totalOriginal) {
            // Ocultar contador si se muestran todos los productos
            resultsElement.style.display = 'none';
        } else {
            // Mostrar contador con resultados filtrados
            resultsElement.style.display = 'block';
            resultsElement.textContent = `Mostrando ${total} de ${totalOriginal} productos`;
        }
    }

    updatePagination() {
        console.log('📄 Actualizando paginación...');
        
        if (!this.filteredProducts || this.filteredProducts.length === 0) {
            console.warn('⚠️ No hay productos para paginar');
            return;
        }
        
        const totalProducts = this.filteredProducts.length;
        const totalPages = Math.ceil(totalProducts / this.productsPerPage);
        
        console.log(`📊 Paginación: Página ${this.currentPage} de ${totalPages} (${totalProducts} productos, ${this.productsPerPage} por página)`);
        
        // Actualizar información de paginación si existe
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            const startItem = (this.currentPage - 1) * this.productsPerPage + 1;
            const endItem = Math.min(this.currentPage * this.productsPerPage, totalProducts);
            paginationInfo.textContent = `Mostrando ${startItem}-${endItem} de ${totalProducts} productos`;
        }
    }

    applyDiscountFilterEllas() {
        console.log('🔄 Aplicando filtro de descuento/oferta (Ellas)');
        console.log(`📊 Total productos disponibles: ${this.productos.length}`);
        
        // Asegurar que tenemos productos disponibles
        if (!this.productos || this.productos.length === 0) {
            console.warn('⚠️ No hay productos disponibles para filtrar');
            this.filteredProducts = [];
            this.renderProducts();
            this.updateResultsCount();
            this.updatePagination();
            return;
        }
        
        // Debug: Mostrar algunos productos para ver su estructura
        if (this.productos.length > 0) {
            console.log('🔍 Estructura del primer producto:', this.productos[0]);
            
            // Mostrar todos los campos únicos de todos los productos
            const allKeys = new Set();
            this.productos.slice(0, 5).forEach(producto => {
                Object.keys(producto).forEach(key => allKeys.add(key));
            });
            console.log('🗝️ Campos disponibles en productos:', Array.from(allKeys).sort());
        }
        
        // Filtrar productos que tengan descuento O estén en oferta
        this.filteredProducts = this.productos.filter(producto => {
            // Verificar múltiples formas de descuento/oferta
            const hasDiscountPrice = producto.precio_descuento && 
                                   producto.precio_descuento < producto.precio;
            
            const isOnSale = producto.estado === 'oferta' || 
                           producto.status === 'oferta' ||
                           producto.en_oferta === true ||
                           producto.oferta === true;
            
            const hasPercentageDiscount = (producto.descuento && producto.descuento > 0) ||
                                        (producto.discount && producto.discount > 0) ||
                                        (producto.porcentaje_descuento && producto.porcentaje_descuento > 0);
            
            // Verificar por nombre/descripción que contenga palabras clave
            const nameHasDiscount = producto.nombre && 
                                  (producto.nombre.toLowerCase().includes('oferta') ||
                                   producto.nombre.toLowerCase().includes('descuento') ||
                                   producto.nombre.toLowerCase().includes('sale') ||
                                   producto.nombre.toLowerCase().includes('promo'));
            
            // Debug para cada producto que coincida
            const isFiltered = hasDiscountPrice || isOnSale || hasPercentageDiscount || nameHasDiscount;
            if (isFiltered) {
                console.log(`✅ Producto con descuento/oferta: ${producto.nombre}`, {
                    precio: producto.precio,
                    precio_descuento: producto.precio_descuento,
                    estado: producto.estado,
                    descuento: producto.descuento,
                    en_oferta: producto.en_oferta,
                    oferta: producto.oferta,
                    hasDiscountPrice,
                    isOnSale,
                    hasPercentageDiscount,
                    nameHasDiscount
                });
            }
            
            return isFiltered;
        });
        
        console.log(`🎯 Productos con descuento/oferta encontrados: ${this.filteredProducts.length}`);
        
        if (this.filteredProducts.length === 0) {
            console.warn('⚠️ No se encontraron productos con descuento/oferta (Ellas)');
            // Mostrar qué estados tienen los productos
            const estados = [...new Set(this.productos.map(p => p.estado).filter(Boolean))];
            console.log('📋 Estados disponibles en productos:', estados);
            
            // Mostrar algunos productos para análisis
            console.log('🔍 Primeros 3 productos para análisis:', 
                       this.productos.slice(0, 3).map(p => ({
                           nombre: p.nombre,
                           estado: p.estado,
                           precio: p.precio,
                           precio_descuento: p.precio_descuento,
                           descuento: p.descuento
                       })));
        }
        
        this.currentPage = 1;
        this.renderProducts();
        this.updateResultsCount();
        this.updatePagination();
    }

    initializeLegacyPriceFilterEllas() {
        console.log('🔧 Inicializando filtro de precio legacy para ellas');
        
        // Implementación básica para compatibilidad hacia atrás
        const legacyPriceFilter = document.querySelector('.price-filter');
        if (legacyPriceFilter) {
            console.log('📊 Filtro de precio legacy encontrado');
            // Aquí se puede agregar lógica legacy si es necesario
        }
    }

    // Función de compatibilidad - ya no se usa activamente
    initializeRedesignedPriceFilterEllas() {
        console.log('⚠️ Función initializeRedesignedPriceFilterEllas deprecada - usando filtros simples');
        
        // Redirigir al nuevo sistema de filtros simples
        this.initializeSimplePriceFiltersEllas();
    }

    
    initializeLegacyPriceFilterEllas() {
        console.log('🔧 Inicializando filtro de precio legacy para ellas');
        
        // Implementación básica para compatibilidad hacia atrás
        const legacyPriceFilter = document.querySelector('.price-filter');
        if (legacyPriceFilter) {
            console.log('📊 Filtro de precio legacy encontrado');
            // Aquí se puede agregar lógica legacy si es necesario
        }
    }

    // Función helper para formatear precio para input
    formatPriceForInput(price) {
        return new Intl.NumberFormat('es-CO').format(price);
    }

    // Función helper para parsear precio desde input
    parsePriceFromInput(inputValue) {
        const cleaned = inputValue.replace(/[^\d]/g, '');
        const parsed = parseInt(cleaned);
        return isNaN(parsed) ? null : parsed;
    }

    updateSliderRangeVisual(minSlider, maxSlider) {
        const rangeElement = document.getElementById('priceSliderRangeEllas');
        if (!rangeElement) return;

        const min = parseInt(minSlider.min);
        const max = parseInt(minSlider.max);
        const minVal = parseInt(minSlider.value);
        const maxVal = parseInt(maxSlider.value);

        const minPercent = ((minVal - min) / (max - min)) * 100;
        const maxPercent = ((maxVal - min) / (max - min)) * 100;

        rangeElement.style.left = `${minPercent}%`;
        rangeElement.style.width = `${maxPercent - minPercent}%`;
    }

    applyFilters() {
        console.log('🔍 Aplicando filtros...', this.activeFilters);
        
        const startTime = performance.now();
        
        let filtered = [...this.productos];
        
        // Filtro de búsqueda
        if (this.activeFilters.search) {
            const searchTerm = this.activeFilters.search;
            filtered = filtered.filter(product => 
                product.nombre.toLowerCase().includes(searchTerm) ||
                product.marca.toLowerCase().includes(searchTerm) ||
                (product.descripcion && product.descripcion.toLowerCase().includes(searchTerm))
            );
        }
        
        // Filtro de categoría
        if (this.activeFilters.category) {
            filtered = filtered.filter(product => 
                product.subcategoria === this.activeFilters.category ||
                product.categoria === this.activeFilters.category
            );
        }
        
        // Filtro de marca
        if (this.activeFilters.brand) {
            filtered = filtered.filter(product => product.marca === this.activeFilters.brand);
        }
        
        // Filtro de subcategoría
        if (this.activeFilters.subcategoria) {
            filtered = filtered.filter(product => product.subcategoria === this.activeFilters.subcategoria);
        }
        
        // Filtro de precio
        filtered = filtered.filter(product => 
            product.precio >= this.activeFilters.priceMin && 
            product.precio <= this.activeFilters.priceMax
        );
        
        const endTime = performance.now();
        const filterTime = endTime - startTime;
        
        this.filteredProducts = filtered;
        this.currentPage = 1; // Reset pagination
        
        console.log(`🔍 Filtros aplicados en ${filterTime.toFixed(2)}ms: ${filtered.length}/${this.productos.length} productos`);
        
        this.renderProducts();
        this.updatePagination();
    }

    renderProducts() {
        const container = document.querySelector('.index-grid');
        if (!container) {
            console.error('❌ Contenedor .index-grid no encontrado');
            return;
        }
        
        console.log(`🎬 Renderizando productos - Página ${this.currentPage}`, {
            totalProductos: this.productos.length,
            productosFilterados: this.filteredProducts.length,
            productosPerPage: this.productsPerPage
        });
        
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const productsToShow = this.filteredProducts.slice(startIndex, endIndex);
        
        console.log(`📊 Productos a mostrar: ${productsToShow.length} (índices ${startIndex} a ${endIndex})`);
        
        if (productsToShow.length === 0) {
            console.warn('⚠️ No hay productos para mostrar');
            container.innerHTML = `
                <div class="no-products-message">
                    <h3>No se encontraron productos</h3>
                    <p>Intenta ajustar los filtros para ver más resultados</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = productsToShow.map(product => this.createProductCard(product)).join('');
        
        // Configurar event listeners para las tarjetas
        this.setupProductCardEvents();
        
        // Actualizar paginación
        this.updatePagination();
        
        console.log(`📄 Página ${this.currentPage}: Mostrando ${productsToShow.length} productos de ${this.filteredProducts.length} total`);
    }

    createProductCard(product) {
        // Generar etiqueta de estado
        const estado = product.estado || 'disponible';
        const isOnSale = estado === 'oferta';
        
        // Calcular precios si hay descuento
        const precioInfo = this.getPrecioInfo(product);
        
        // Obtener imagen
        const imageSrc = this.getImagePath(product.imagen_url || product.imagen);
        const productName = product.nombre || 'Producto sin nombre';
        
        // Generar descripción corta
        const description = this.generateDescription(product);
        
        // Generar opciones de tamaño (simuladas - puedes conectar con datos reales)
        const sizeOptions = this.generateSizeOptions(product);
        
        // Generar etiquetas dinámicas
        const badges = this.generateProductBadges(product);
        
        return `
        <div class="index-item" data-product-id="${product.id}">
            ${badges}
            
            <div class="item-image">
                <img src="${imageSrc}" 
                     alt="${productName}"
                     loading="lazy"
                     onerror="this.src='../IMAGENES/PARA_ELLAS.png';">
                
                ${sizeOptions}
                
                <div class="item-overlay">
                    <button class="quick-view-btn" data-product-id="${product.id}">
                        Vista Rápida
                    </button>
                </div>
            </div>
            
            <div class="item-content">
                <h3 class="item-title">${product.nombre || 'Sin nombre'}</h3>
                <p class="item-size">${product.ml || 100} ML</p>
                <p class="item-description">${description}</p>
                
                <div class="item-price">${precioInfo}</div>
                
                ${this.generateAddToCartButton(product)}
            </div>
            
            <div class="product-badges">
                ${badges}
            </div>
        </div>
        `;
    }

    setupProductCardEvents() {
        // Remover event listeners existentes del contenedor
        const container = document.querySelector('.index-grid');
        if (!container) return;
        
        // Remover event listeners anteriores clonando el contenedor (más eficiente que remover uno por uno)
        const newContainer = container.cloneNode(true);
        container.parentNode.replaceChild(newContainer, container);
        
        // Usar event delegation para manejar eventos
        newContainer.addEventListener('click', (e) => {
            // Event listener para agregar al carrito
            if (e.target.classList.contains('add-to-bag-btn')) {
                e.stopPropagation();
                const productId = e.target.dataset.productId;
                console.log('🛒 Botón carrito clickeado para producto:', productId);
                this.addToCart(productId);
                return;
            }
            
            // Event listener para vista rápida
            if (e.target.classList.contains('quick-view-btn')) {
                e.stopPropagation();
                const productId = e.target.dataset.productId;
                console.log('👁️ Botón vista rápida clickeado para producto:', productId);
                this.showQuickView(productId);
                return;
            }
            
            // Event listener para ver detalles al hacer click en la tarjeta
            const productCard = e.target.closest('.index-item');
            if (productCard && !e.target.closest('button')) {
                const productId = productCard.dataset.productId;
                console.log('📄 Tarjeta clickeada para producto:', productId);
                this.showProductDetails(productId);
            }
        });
    }

    addToCart(productId) {
        // Prevenir múltiples ejecuciones rápidas
        if (this.isAddingToCart) {
            console.warn('⚠️ Ya se está agregando un producto al carrito, ignorando click duplicado');
            return;
        }
        
        this.isAddingToCart = true;
        setTimeout(() => { this.isAddingToCart = false; }, 1000); // Reset después de 1 segundo
        
        const product = this.productos.find(p => p.id == productId);
        if (!product) {
            console.error('❌ Producto no encontrado:', productId);
            this.isAddingToCart = false;
            return;
        }
        
        // ✅ VALIDAR STOCK - Si está agotado, mostrar alerta
        if (product.stock <= 0 || product.estado === 'agotado') {
            console.warn('⚠️ Producto agotado:', product.nombre);
            this.showTemporaryMessage('🚫 Producto agotado - No disponible para agregar al carrito', 'error');
            this.isAddingToCart = false;
            return;
        }
        
        if (product.estado === 'proximo') {
            console.warn('⚠️ Producto próximo - no disponible aún');
            this.showTemporaryMessage('🔜 Producto próximamente disponible', 'warning');
            this.isAddingToCart = false;
            return;
        }

        console.log('🛒 [ParaEllas] Agregando producto al carrito:', product.nombre, '(ID:', productId, ')');

        // Función para agregar el producto de forma segura
        const addProductSafely = () => {
            if (window.shoppingCart && window.shoppingCart.isInitialized) {
                console.log('✅ [ParaEllas] Carrito disponible y inicializado');
                
                // ✅ CALCULAR PRECIO CON DESCUENTO SI APLICA
                let finalPrice = parseFloat(product.precio);
                if (product.descuento && product.descuento > 0) {
                    finalPrice = finalPrice * (1 - product.descuento / 100);
                    console.log(`💰 Aplicando descuento ${product.descuento}%: $${product.precio} → $${finalPrice.toFixed(0)}`);
                }
                
                // Asegurar que la imagen tenga la ruta correcta
                const productForCart = {
                    ...product,
                    precio: finalPrice, // ✅ Usar precio con descuento
                    precio_original: product.precio, // Guardar precio original para referencia
                    imagen_url: this.getImagePath(product.imagen_url || product.imagen),
                    imagen: this.getImagePath(product.imagen_url || product.imagen)
                };
                
                window.shoppingCart.addItem(productForCart);
                console.log('✅ [ParaEllas] Producto agregado exitosamente al carrito');
                
                // Verificar que se agregó correctamente
                setTimeout(() => {
                    const cartStatus = window.shoppingCart.getCartStatus();
                    console.log(`🔍 [ParaEllas] Verificación post-agregado: ${cartStatus.totalItems} items en carrito`);
                }, 200);
                
            } else {
                console.warn('⚠️ [ParaEllas] Carrito no disponible o no inicializado');
                console.log('🔧 [ParaEllas] Estado del carrito:', {
                    exists: !!window.shoppingCart,
                    initialized: window.shoppingCart ? window.shoppingCart.isInitialized : false,
                    singleton: !!window.getShoppingCartInstance
                });
                
                // Intentar obtener/inicializar usando singleton
                if (window.getShoppingCartInstance) {
                    console.log('🔄 [ParaEllas] Usando función singleton...');
                    const cart = window.getShoppingCartInstance();
                    if (cart && cart.isInitialized) {
                        console.log('✅ [ParaEllas] Carrito obtenido via singleton');
                        
                        // ✅ CALCULAR PRECIO CON DESCUENTO SI APLICA
                        let finalPrice = parseFloat(product.precio);
                        if (product.descuento && product.descuento > 0) {
                            finalPrice = finalPrice * (1 - product.descuento / 100);
                            console.log(`💰 Aplicando descuento ${product.descuento}%: $${product.precio} → $${finalPrice.toFixed(0)}`);
                        }
                        
                        const productForCart = {
                            ...product,
                            precio: finalPrice, // ✅ Usar precio con descuento
                            precio_original: product.precio, // Guardar precio original para referencia
                            imagen_url: this.getImagePath(product.imagen_url || product.imagen),
                            imagen: this.getImagePath(product.imagen_url || product.imagen)
                        };
                        cart.addItem(productForCart);
                    } else {
                        console.error('❌ [ParaEllas] Singleton no funcionó');
                        this.showTemporaryMessage('Error: Carrito no disponible');
                    }
                } else {
                    console.error('❌ [ParaEllas] Función singleton no disponible');
                    this.showTemporaryMessage('Error: Sistema de carrito no disponible');
                }
            }
            this.isAddingToCart = false;
        };

        // Verificar si el carrito está disponible inmediatamente
        if (window.shoppingCart && window.shoppingCart.isInitialized) {
            addProductSafely();
        } else {
            // Esperar un poco y reintentar
            console.log('⏳ [ParaEllas] Esperando inicialización del carrito...');
            let attempts = 0;
            const maxAttempts = 5;
            
            const checkAndAdd = () => {
                attempts++;
                console.log(`🔄 [ParaEllas] Intento ${attempts}/${maxAttempts} de agregar producto`);
                
                if (window.shoppingCart && window.shoppingCart.isInitialized) {
                    console.log('✅ [ParaEllas] Carrito listo después de esperar');
                    addProductSafely();
                } else if (attempts < maxAttempts) {
                    console.log(`⏳ [ParaEllas] Reintentando en 500ms...`);
                    setTimeout(checkAndAdd, 500);
                } else {
                    console.error('❌ [ParaEllas] Carrito no se inicializó después de múltiples intentos');
                    // Último recurso: forzar inicialización
                    if (window.forceInitCart) {
                        console.log('🔧 [ParaEllas] Forzando inicialización del carrito...');
                        window.forceInitCart();
                        setTimeout(() => {
                            if (window.shoppingCart) {
                                addProductSafely();
                            } else {
                                this.showTemporaryMessage('Error: No se pudo inicializar el carrito');
                                this.isAddingToCart = false;
                            }
                        }, 1000);
                    } else {
                        this.showTemporaryMessage('El sistema de carrito no está disponible en este momento');
                        this.isAddingToCart = false;
                    }
                }
            };
            
            checkAndAdd();
        }
    }

    showProductDetails(productId) {
        const product = this.productos.find(p => p.id == productId);
        if (!product) {
            console.error('❌ Producto no encontrado:', productId);
            return;
        }
        
        console.log('👁️ Mostrando detalles del producto:', product.nombre);
        
        // Usar el método showQuickView existente
        this.showQuickView(productId);
    }

    showQuickView(productId) {
        const product = this.productos.find(p => p.id == productId);
        if (!product) return;

        const modal = document.querySelector('.quick-view-modal');
        const modalBody = modal.querySelector('.modal-body');
        
        const imageSrc = this.getImagePath(product.imagen_url || product.imagen);
        const productName = product.nombre || 'Producto sin nombre';

        modalBody.innerHTML = `
            <div class="quick-view-content">
                <div class="quick-view-image">
                    <img src="${imageSrc}" 
                         alt="${productName}"
                         onerror="this.src='../IMAGENES/PARA_ELLAS.png'"
                         loading="lazy">
                </div>
                <div class="quick-view-info">
                    <h2>${product.nombre}</h2>
                    <p class="brand">${product.marca || ''}</p>
                    <div class="price">${this.getPrecioInfo(product)}</div>
                    ${product.descripcion ? `<p class="description">${product.descripcion}</p>` : ''}
                    ${product.notas ? `
                        <div class="notes">
                            <h4>Notas:</h4>
                            <p>${Array.isArray(product.notas) ? product.notas.join(', ') : product.notas}</p>
                        </div>
                    ` : ''}
                    <div class="actions">
                        <button class="add-to-cart-btn" onclick="window.paraEllasManager.addToCart(${product.id})">
                            Agregar al Carrito
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Cerrar modal
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.onclick = () => this.closeQuickView();
        }

        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeQuickView();
            }
        };
    }

    closeQuickView() {
        const modal = document.querySelector('.quick-view-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    setupPaginationEvents() {
        // Los event listeners de paginación se configuran en updatePagination()
    }

    updatePagination() {
        const totalProducts = this.filteredProducts.length;
        const totalPages = Math.ceil(totalProducts / this.productsPerPage);
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = Math.min(startIndex + this.productsPerPage, totalProducts);

        // Update pagination info
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            paginationInfo.textContent = `Mostrando ${startIndex + 1}-${endIndex} de ${totalProducts} fragancias`;
        }

        // Update pagination buttons
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= totalPages;
        }

        // Update pagination numbers
        const paginationNumbers = document.getElementById('paginationNumbers');
        if (paginationNumbers && totalPages > 1) {
            let numbersHTML = '';
            
            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                    numbersHTML += `
                        <button class="pagination-number ${i === this.currentPage ? 'active' : ''}" 
                                onclick="window.paraEllasManager.goToPage(${i})">
                            ${i}
                        </button>
                    `;
                } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                    numbersHTML += '<span class="pagination-ellipsis">...</span>';
                }
            }
            
            paginationNumbers.innerHTML = numbersHTML;
        }

        // Hide pagination if only one page
        const paginationContainer = document.querySelector('.pagination-container');
        if (paginationContainer) {
            paginationContainer.style.display = totalPages > 1 ? 'flex' : 'none';
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderProducts();
    }

    setupPagination() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderProducts();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderProducts();
                }
            });
        }
    }

    // Método para reinicializar el manager
    async reinitialize() {
        console.log('🔄 Reinicializando ParaEllasManager...');
        this.productos = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        await this.init();
    }

    // Método para forzar recarga de productos
    async reloadProducts() {
        console.log('🔄 Recargando productos...');
        await this.loadProducts();
        this.setupPriceFilter();
        this.applyFilters();
    }

    // Agregar panel de herramientas de debug
    addDebugPanel() {
        // Solo agregar en modo desarrollo
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const debugPanel = document.createElement('div');
            debugPanel.id = 'debug-tools-ellas';
            debugPanel.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px;
                border-radius: 8px;
                z-index: 9999;
                font-size: 12px;
            `;
            
            debugPanel.innerHTML = `
                <div style="margin-bottom: 5px; font-weight: bold;">🔧 Debug Ellas</div>
                <button onclick="window.testPricesEllas()" style="margin: 2px; padding: 4px 8px; font-size: 11px;">🧪 Test</button>
                <button onclick="window.debugPricesEllas()" style="margin: 2px; padding: 4px 8px; font-size: 11px;">💰 Precios</button>
                <button onclick="console.log('Productos Ellas:', window.paraEllasManager.productos)" style="margin: 2px; padding: 4px 8px; font-size: 11px;">📦 Log</button>
                <button onclick="window.paraEllasManager.reloadProducts()" style="margin: 2px; padding: 4px 8px; font-size: 11px;">🔄 Reload</button>
            `;
            
            document.body.appendChild(debugPanel);
        }
    }

    // Función específica para testear y verificar precios
    testPriceCalculation() {
        console.group('🧪 TEST COMPLETO DE PRECIOS PARA ELLAS');
        
        // 1. Verificar productos cargados
        console.log('📊 Total productos:', this.productos.length);
        
        if (this.productos.length === 0) {
            console.error('❌ No hay productos cargados');
            console.groupEnd();
            return false;
        }
        
        // 2. Analizar estructura de precios
        console.log('🔍 Muestra de productos:');
        this.productos.slice(0, 5).forEach((p, i) => {
            console.log(`  ${i+1}. ${p.nombre || 'Sin nombre'} - Precio: ${p.precio || 'No definido'}`);
        });
        
        // 3. Extraer y filtrar precios
        const allPrices = this.productos.map(p => p.precio);
        const validPrices = allPrices.filter(p => p && p > 0);
        const invalidPrices = allPrices.filter(p => !p || p <= 0);
        
        console.log('💰 Análisis de precios:');
        console.log(`  - Precios válidos: ${validPrices.length}`);
        console.log(`  - Precios inválidos: ${invalidPrices.length}`);
        console.log(`  - Precios válidos ordenados:`, validPrices.sort((a,b) => a-b));
        
        if (validPrices.length === 0) {
            console.error('❌ No hay precios válidos');
            console.groupEnd();
            return false;
        }
        
        // 4. Calcular rangos
        const minPrice = Math.min(...validPrices);
        const maxPrice = Math.max(...validPrices);
        
        console.log('📈 Rangos calculados:');
        console.log(`  - Precio mínimo: $${this.formatPrice(minPrice)} (${minPrice})`);
        console.log(`  - Precio máximo: $${this.formatPrice(maxPrice)} (${maxPrice})`);
        
        // 5. Verificar elementos DOM
        const minSlider = document.getElementById('minPriceSliderEllas');
        const maxSlider = document.getElementById('maxPriceSliderEllas');
        const display = document.getElementById('priceRangeDisplayEllas');
        
        console.log('🎛️ Estado elementos DOM:');
        console.log('  - minSlider:', minSlider ? `${minSlider.min}-${minSlider.max} (valor: ${minSlider.value})` : 'NO ENCONTRADO');
        console.log('  - maxSlider:', maxSlider ? `${maxSlider.min}-${maxSlider.max} (valor: ${maxSlider.value})` : 'NO ENCONTRADO');
        console.log('  - display:', display ? display.textContent : 'NO ENCONTRADO');
        
        console.groupEnd();
        
        return {
            productCount: this.productos.length,
            validPrices: validPrices.length,
            minPrice,
            maxPrice,
            slidersConfigured: !!(minSlider && maxSlider)
        };
    }

    // Función de debug para verificar los rangos de precios
    debugPriceRange() {
        console.group('🔍 DEBUG RANGOS DE PRECIOS PARA ELLAS');
        
        const prices = this.productos.map(p => p.precio || 0).filter(p => p > 0);
        console.log('📊 Total de productos:', this.productos.length);
        console.log('💰 Productos con precio válido:', prices.length);
        console.log('🏷️ Todos los precios:', prices.sort((a,b) => a-b));
        
        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            console.log(`📉 Precio mínimo: $${this.formatPrice(minPrice)}`);
            console.log(`📈 Precio máximo: $${this.formatPrice(maxPrice)}`);
            
            // Verificar elementos del filtro
            const minSlider = document.getElementById('minPriceSliderEllas');
            const maxSlider = document.getElementById('maxPriceSliderEllas');
            const display = document.getElementById('priceRangeDisplayEllas');
            
            console.log('🎛️ Estado de los sliders:');
            console.log('- Min slider:', minSlider ? `${minSlider.min} a ${minSlider.max}, valor: ${minSlider.value}` : 'No encontrado');
            console.log('- Max slider:', maxSlider ? `${maxSlider.min} a ${maxSlider.max}, valor: ${maxSlider.value}` : 'No encontrado');
            console.log('- Display:', display ? display.textContent : 'No encontrado');
        }
        
        console.groupEnd();
        return { productCount: this.productos.length, priceCount: prices.length, prices: prices.sort((a,b) => a-b) };
    }

    // Método de debug para verificar el estado
    debugCart() {
        console.group('🛒 DEBUG DEL CARRITO EN PARA ELLAS');
        console.log('¿Existe window.shoppingCart?', !!window.shoppingCart);
        console.log('¿Es función addItem?', typeof window.shoppingCart?.addItem === 'function');
        console.log('¿Está inicializado el carrito?', window.shoppingCart?.isInitialized);
        console.log('Items en carrito:', window.shoppingCart?.items?.length || 0);
        console.groupEnd();
    }

    // Método para testing
    testAddToCart() {
        if (this.productos.length > 0) {
            const testProduct = this.productos.find(p => p.estado === 'disponible' || !p.estado);
            if (testProduct) {
                console.log('🧪 Testing agregar al carrito:', testProduct.nombre);
                this.addToCart(testProduct.id);
            }
        }
    }

    // Función auxiliar para generar información de precio
    getPrecioInfo(product) {
        const precio = product.precio || 0;
        const estado = product.estado || 'disponible';
        const descuento = product.descuento || 0;
        
        if (estado === 'oferta' && descuento > 0) {
            const precioConDescuento = precio - (precio * descuento / 100);
            return `
                <div class="precio-con-descuento">
                    <span class="precio-original">$${this.formatPrice(precio)}</span>
                    <span class="precio-oferta">$${this.formatPrice(precioConDescuento)}</span>
                    <span class="descuento-badge">-${descuento}%</span>
                </div>
            `;
        } else {
            return `$${this.formatPrice(precio)}`;
        }
    }

    // Función auxiliar para obtener la ruta correcta de imagen placeholder
    getPlaceholderImagePath() {
        // Detectar si estamos en la carpeta html/ o en la raíz
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/') || currentPath.includes('\\html\\');
        
        if (isInHtmlFolder) {
            return '../IMAGENES/PARA_ELLAS.png';
        } else {
            return 'IMAGENES/PARA_ELLAS.png';
        }
    }

    // Función auxiliar para obtener la ruta correcta de cualquier imagen
    getImagePath(imagePath) {
        if (!imagePath) return this.getPlaceholderImagePath();
        
        // Limpiar espacios y caracteres extraños
        imagePath = imagePath.trim();
        
        // Si es una URL completa (http/https), usarla tal como está
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            console.log(`🌐 Usando URL externa: ${imagePath}`);
            return imagePath;
        }
        
        // Si es data URL (base64), usarla tal como está
        if (imagePath.startsWith('data:image/')) {
            console.log(`📄 Usando imagen base64: ${imagePath.substring(0, 50)}...`);
            return imagePath;
        }
        
        // Si es una ruta relativa que empieza con ../, usarla tal como está
        if (imagePath.startsWith('../')) {
            console.log(`📂 Usando ruta relativa: ${imagePath}`);
            return imagePath;
        }
        
        // Para rutas locales, determinar el contexto actual
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/') || currentPath.includes('\\html\\');
        
        let finalPath;
        
        if (isInHtmlFolder && !imagePath.startsWith('../')) {
            // Estamos en html/ y la imagen no tiene ../, agregar ../
            finalPath = `../${imagePath}`;
        } else {
            finalPath = imagePath;
        }
        
        console.log(`🖼️ Ruta de imagen local procesada: ${imagePath} → ${finalPath}`);
        return finalPath;
    }

    // Métodos auxiliares para el diseño Tom Ford
    generateDescription(product) {
        // Usar la descripción real del producto si existe, sino generar una basada en las notas
        if (product.descripcion && product.descripcion.trim()) {
            return product.descripcion.trim();
        }
        
        // Si tiene notas, usar las notas como descripción
        if (product.notas && product.notas.trim()) {
            const notas = product.notas.trim();
            return `Con notas de ${notas}`;
        }
        
        // Solo como último recurso, usar descripciones genéricas por marca
        const descriptions = {
            'Chanel': 'Una fragancia elegante y sofisticada con notas florales y especiadas.',
            'Dior': 'Un aroma floral y feminino con notas delicadas.',
            'Versace': 'Una fragancia fresca y vibrante con notas mediterráneas.',
            'Armani': 'Una composición moderna y femenina con notas florales.',
            'Givenchy': 'Una fragancia intensa y elegante con notas orientales.',
            'Paco Rabanne': 'Un perfume audaz y seductor con notas florales.',
            'Calvin Klein': 'Una fragancia fresca y contemporánea.',
            'Hugo Boss': 'Un aroma elegante y sofisticado.',
            'Carolina Herrera': 'Una fragancia sofisticada con notas florales y especiadas.'
        };
        
        const marca = product.marca || 'Fragancia';
        return descriptions[marca] || 'Una fragancia única y cautivadora con notas distintivas.';
    }
    
    generateSizeOptions(product) {
        // Generar opciones de tamaño comunes
        const sizes = ['30 ml', '50 ml', '100 ml'];
        const availableSizes = sizes.slice(0, Math.floor(Math.random() * 3) + 1); // 1-3 tamaños
        
        if (availableSizes.length <= 1) return '';
        
        const sizeHTML = availableSizes.map(size => 
            `<a href="#" class="size-option" onclick="window.paraEllasManager.selectSize('${size}', ${product.id}); return false;">${size}</a>`
        ).join('');
        
        return `<div class="size-options">${sizeHTML}</div>`;
    }
    
    // Método para manejar selección de tamaño
    selectSize(size, productId) {
        console.log(`Tamaño seleccionado: ${size} para producto ${productId}`);
        // Aquí puedes agregar lógica para manejar la selección de tamaño
        // Por ejemplo, actualizar el precio o mostrar disponibilidad
    }
    
    // Generar etiquetas dinámicas para todos los productos
    generateProductBadges(product) {
        const badges = [];
        
        // Etiqueta por estado (SALE, AGOTADO, etc.)
        const estado = product.estado || 'disponible';
        switch (estado) {
            case 'oferta':
                badges.push({ text: 'SALE', class: 'sale-badge' });
                break;
            case 'agotado':
                badges.push({ text: 'AGOTADO', class: 'sold-out-badge' });
                break;
            case 'proximo':
                badges.push({ text: 'PRÓXIMAMENTE', class: 'coming-soon-badge' });
                break;
            case 'nuevo':
                badges.push({ text: 'NUEVO', class: 'new-badge' });
                break;
        }

        // Etiqueta por marca premium
        const marca = product.marca || '';
        const marcasPremium = ['Chanel', 'Dior', 'Tom Ford', 'Creed', 'Maison Margiela'];
        if (marcasPremium.includes(marca)) {
            badges.push({ text: 'PREMIUM', class: 'premium-badge' });
        }
        
        // Etiqueta LUXURY - priorizar campo luxury de BD sobre precio alto
        if (product.luxury === true) {
            badges.push({ text: 'LUXURY', class: 'luxury-badge' });
        } else {
            // Solo si no está marcado como luxury en BD, usar precio como criterio
            const precio = product.precio || 0;
            if (precio > 500000) {
                badges.push({ text: 'LUXURY', class: 'luxury-badge' });
            }
        }
        
        // Etiqueta de descuento
        if (product.descuento && product.descuento > 0) {
            badges.push({ text: `-${product.descuento}%`, class: 'discount-badge' });
        }
        
        // Etiqueta especial para productos destacados (basado en popularidad simulada)
        const isPopular = (product.id % 7) === 0; // Cada 7mo producto
        if (isPopular) {
            badges.push({ text: 'POPULAR', class: 'popular-badge' });
        }
        
        // Etiqueta por edición limitada (simulada)
        const isLimited = marca === 'Chanel' && (product.id % 10) === 0;
        if (isLimited) {
            badges.push({ text: 'LIMITED', class: 'limited-badge' });
        }
        
        // Generar HTML para las etiquetas (máximo 2 para no sobrecargar)
        const maxBadges = badges.slice(0, 2);
        return maxBadges.map((badge, index) => 
            `<div class="${badge.class}" style="top: ${10 + (index * 35)}px;">${badge.text}</div>`
        ).join('');
    }

    formatPrice(price) {
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    showTemporaryMessage(message, type = 'info') {
        const notification = document.createElement('div');
        
        // Definir colores según el tipo
        let backgroundColor, borderColor;
        switch(type) {
            case 'error':
                backgroundColor = '#dc3545';
                borderColor = '#dc3545';
                break;
            case 'warning':
                backgroundColor = '#ffc107';
                borderColor = '#ffc107';
                break;
            case 'success':
                backgroundColor = '#28a745';
                borderColor = '#28a745';
                break;
            default:
                backgroundColor = '#2c2c2c';
                borderColor = '#2c2c2c';
        }
        
        notification.style.cssText = `
            position: fixed; top: 80px; right: 20px; z-index: 10000;
            background: ${backgroundColor}; color: white; padding: 12px 20px;
            border-radius: 8px; font-family: 'Montserrat', sans-serif;
            font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-left: 4px solid ${borderColor};
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    generateAddToCartButton(product) {
        const isOutOfStock = product.stock <= 0 || product.estado === 'agotado';
        const isComingSoon = product.estado === 'proximo';
        
        if (isOutOfStock) {
            return `
                <button class="add-to-bag-btn disabled" disabled>
                    🚫 AGOTADO
                </button>
            `;
        }
        
        if (isComingSoon) {
            return `
                <button class="add-to-bag-btn disabled" disabled>
                    🔜 PRÓXIMAMENTE
                </button>
            `;
        }
        
        return `
            <button class="add-to-bag-btn" data-product-id="${product.id}">
                AGREGAR AL CARRITO
            </button>
        `;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, inicializando ParaEllasManager...');
    
    // Pequeño delay para asegurar que todas las dependencias estén cargadas
    setTimeout(() => {
        if (!window.paraEllasManager) {
            window.paraEllasManager = new ParaEllasManager();
            
            // Exponer funciones de debugging globalmente
            window.debugFiltersEllas = () => window.paraEllasManager.debugFilters();
            window.testMinPriceFilterEllas = () => window.paraEllasManager.testMinPriceFilter();
            window.testMaxPriceFilterEllas = () => window.paraEllasManager.testMaxPriceFilter();
            window.testDiscountFilterEllas = () => window.paraEllasManager.testDiscountFilter();
            
            console.log('🔧 Funciones de debug disponibles:');
            console.log('   - debugFiltersEllas() - Ver estado de filtros');
            console.log('   - testMinPriceFilterEllas() - Probar filtro precio mínimo');
            console.log('   - testMaxPriceFilterEllas() - Probar filtro precio máximo');
            console.log('   - testDiscountFilterEllas() - Probar filtro descuento');
        }
    }, 1000);
});

// También inicializar en window.load como backup
window.addEventListener('load', function() {
    if (!window.paraEllasManager) {
        console.log('🔄 Inicializando ParaEllasManager desde window.load...');
        window.paraEllasManager = new ParaEllasManager();
        
        // Agregar funciones de debug globales
        window.debugPricesEllas = () => window.paraEllasManager.debugPriceRange();
        window.testPricesEllas = () => window.paraEllasManager.testPriceCalculation();
        console.log('🔧 Para debug de precios para ellas, ejecuta: testPricesEllas() o debugPricesEllas()');
    }
});

// Hacer la clase disponible globalmente
window.ParaEllasManager = ParaEllasManager;
