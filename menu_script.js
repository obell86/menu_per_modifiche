document.addEventListener('DOMContentLoaded', () => {
    // --- Configurazione Airtable ---
    const AIRTABLE_BASE_ID = 'apppoL3fKAYnY0K1A';
    const AIRTABLE_PAT = 'patJFPTb4KfYLzoRm.7e0b70399100110760879f5ee61be0740c647966f671cd58ab966fa3455d9278';
    const MENU_CATEGORIE_TABLE_NAME = 'Menu_Categorie'; // Verifica Esattezza Nome
    const MENU_ARTICOLI_TABLE_NAME = 'Menu_Articoli';   // Verifica Esattezza Nome

    // Mappatura campi Menu (Verifica Esattezza Nomi Campi vs Airtable)
    const fieldMap = {
        menuCategorie: { nome: 'Nome Categoria', ordine: 'Ordine Visualizzazione', attivo: 'Stato Attivo', configurazione: 'Configurazione' },
        menuArticoli: { nome: 'Nome Articolo', prezzo: 'Prezzo', descrizione: 'Descrizione', categoria: 'Categoria', attivo: 'Stato Attivo', configurazione: 'Configurazione' }
    };

    // --- Elementi DOM ---
    const menuContent = document.getElementById('menu-content');
    const menuLoadingMessage = document.getElementById('menu-loading-message');

    // --- Funzioni Helper ---
    const getField = (fields, fieldName, defaultValue = null) => { if (!fields) return defaultValue; const value = fields[fieldName]; return (value !== undefined && value !== null && value !== '') ? value : defaultValue; };

    // --- Funzioni Menu ---
    function renderMenu(menuData) {
        if (!menuContent) { console.error("Errore: Elemento #menu-content non trovato."); return; }
        if (!menuData || menuData.length === 0) { menuContent.innerHTML = '<p>Il menu non è disponibile al momento.</p>'; console.log("renderMenu: Nessun dato valido ricevuto."); return; }
        let menuHTML = '';
        menuData.forEach(category => {
            if (!category.items || category.items.length === 0) return;
            menuHTML += `<div class="menu-category"><h3 class="category-title" tabindex="0">${category.name || '?'}</h3><ul class="item-list" style="max-height: 0; overflow: hidden;">`;
            category.items.forEach(item => {
                let formattedPrice = ''; const priceValue = item.price; if (typeof priceValue === 'number') { formattedPrice = `€${priceValue.toFixed(2)}`; } else if (typeof priceValue === 'string') { formattedPrice = priceValue; }
                menuHTML += `<li class="menu-item"><div class="item-details"><span class="item-name">${item.name || '?'}</span>`;
                if(item.description) { menuHTML += `<p class="item-description">${item.description}</p>`; }
                menuHTML += `</div>`; if(formattedPrice) { menuHTML += `<span class="item-price">${formattedPrice}</span>`; } menuHTML += `</li>`;
            });
            menuHTML += `</ul></div>`;
        });
        menuContent.innerHTML = menuHTML; addAccordionListeners(); console.log("Menu renderizzato (menu.html).");
    }
    function addAccordionListeners() { const titles = menuContent.querySelectorAll('.category-title'); titles.forEach(t => { t.addEventListener('click', () => toggleCategory(t)); t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCategory(t); } }); }); }
    function toggleCategory(titleElement) { const div = titleElement.parentElement; const ul = titleElement.nextElementSibling; if (!ul || ul.tagName !== 'UL') return; const isOpen = div.classList.contains('category-open'); if (isOpen) { div.classList.remove('category-open'); ul.style.maxHeight = '0'; } else { div.classList.add('category-open'); ul.style.maxHeight = ul.scrollHeight + 'px'; } }

    // --- Funzione Principale di Caricamento Menu ---
    async function loadMenuData() {
        if (menuLoadingMessage) menuLoadingMessage.style.display = 'block';

        const configRecordId = 'recK0pTqrdvJWLi9d'; // ID Config Principale Confermato
        if (!configRecordId) { /* ... (errore ID mancante) ... */ return; }

        const catAttivoField = fieldMap.menuCategorie.attivo; const catConfigField = fieldMap.menuCategorie.configurazione;
        const itemAttivoField = fieldMap.menuArticoli.attivo; const itemConfigField = fieldMap.menuArticoli.configurazione;
        const catCategoriaField = fieldMap.menuArticoli.categoria; // Campo Link 'Categoria' in Articoli
        console.log(`NOMI CAMPO USATI: Categoria[Attivo='${catAttivoField}', Config='${catConfigField}'], Articolo[Attivo='${itemAttivoField}', Config='${itemConfigField}', CategoriaLink='${catCategoriaField}']`);

        if (!catAttivoField || !catConfigField || !itemAttivoField || !itemConfigField || !catCategoriaField) { /* Errore fieldMap */ return; }

        try {
            const headers = { Authorization: `Bearer ${AIRTABLE_PAT}` };
            let allActiveCategories = []; let allActiveItems = [];

            // 1. Recupera TUTTE le Categorie ATTIVE
            const filterFormulaCategoriesSimple = `{${catAttivoField}}=1`;
            console.log("Filtro Categorie API (SOLO ATTIVE):", filterFormulaCategoriesSimple);
            const sortOrder = `sort[0][field]=${encodeURIComponent(fieldMap.menuCategorie.ordine)}&sort[0][direction]=asc`;
            const categoriesUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_CATEGORIE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaCategoriesSimple)}&${sortOrder}`;
            console.log("Fetch Categories (Solo Attive):", categoriesUrl);
            const categoriesResponse = await fetch(categoriesUrl, { headers });
            if (categoriesResponse.ok) { const res = await categoriesResponse.json(); allActiveCategories = res.records || []; console.log("Categories Data Raw (Solo Attive):", allActiveCategories); }
            else { throw new Error(`API Categorie (Solo Attive): ${categoriesResponse.status} ${await categoriesResponse.text()}`); }

            // 2. Recupera TUTTI gli Articoli ATTIVI
            const filterFormulaItemsSimple = `{${itemAttivoField}}=1`;
            console.log("Filtro Articoli API (SOLO ATTIVI):", filterFormulaItemsSimple);
            const itemsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_ARTICOLI_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaItemsSimple)}`;
            console.log("Fetch Items (Solo Attivi):", itemsUrl);
            const itemsResponse = await fetch(itemsUrl, { headers });
             if (itemsResponse.ok) { const res = await itemsResponse.json(); allActiveItems = res.records || []; console.log("Items Data Raw (Solo Attivi):", allActiveItems); }
             else { throw new Error(`API Articoli (Solo Attivi): ${itemsResponse.status} ${await itemsResponse.text()}`); }

            // ====================================================================
            // === PUNTO 3: Elabora Dati Menu (Logica Chiave - NON è un commento) ===
            // ====================================================================
            let processedMenuData = [];
            if (allActiveCategories.length > 0 && allActiveItems.length > 0) {
                 // Filtra le categorie per l'ID configurazione corretto
                 const filteredCategories = allActiveCategories.filter(catRec => {
                     const linkedConfigIds = getField(catRec.fields, catConfigField, []);
                     return Array.isArray(linkedConfigIds) && linkedConfigIds.includes(configRecordId);
                 });
                 console.log("Categorie filtrate per Config ID in JS:", filteredCategories);

                 // Filtra gli articoli per l'ID configurazione corretto
                 const filteredItems = allActiveItems.filter(itemRec => {
                    const linkedConfigIds = getField(itemRec.fields, itemConfigField, []);
                    return Array.isArray(linkedConfigIds) && linkedConfigIds.includes(configRecordId);
                 });
                 console.log("Articoli filtrati per Config ID in JS:", filteredItems);

                 // --- Logica di ABBINAMENTO Articoli a Categorie ---
                 if (filteredCategories.length > 0 && filteredItems.length > 0) {
                     processedMenuData = filteredCategories.map(catRec => { // Itera su categorie filtrate
                         const catId = catRec.id; // ID della categoria corrente
                         const categoryName = getField(catRec.fields, fieldMap.menuCategorie.nome, 'Categoria Mancante');

                         // Filtra TUTTI gli articoli filtrati per config, tenendo solo quelli di QUESTA categoria
                         const items = filteredItems.filter(itemRec => {
                                 // Prendi l'array di ID dal campo LINK 'Categoria' dell'articolo
                                 const linkedCategoryIds = getField(itemRec.fields, catCategoriaField, []);
                                 // Controlla se l'ID della categoria corrente (catId) è presente in quell'array
                                 return Array.isArray(linkedCategoryIds) && linkedCategoryIds.includes(catId);
                             })
                             .map(itemRec => ({ // Mappa i campi dell'articolo abbinato in un oggetto pulito
                                 id: itemRec.id,
                                 name: getField(itemRec.fields, fieldMap.menuArticoli.nome, 'Nome Mancante'),
                                 price: getField(itemRec.fields, fieldMap.menuArticoli.prezzo),
                                 description: getField(itemRec.fields, fieldMap.menuArticoli.descrizione, '')
                             }));

                         // Ritorna l'oggetto finale per questa categoria (con i suoi articoli abbinati)
                         return { id: catId, name: categoryName, items: items };

                     }).filter(category => category.items.length > 0); // Rimuovi categorie che non hanno avuto articoli abbinati

                     console.log("Menu Data Processed (Filtro JS):", processedMenuData);
                      if (processedMenuData.length === 0) {
                          console.warn("ATTENZIONE: Trovate categorie e articoli attivi per questa config, ma il link Articolo->Categoria è errato o il confronto ID fallisce.");
                      }
                 } else {
                      if (filteredCategories.length === 0) console.log("Nessuna CATEGORIA attiva trovata per Config ID:", configRecordId, "dopo filtro JS.");
                      if (filteredItems.length === 0) console.log("Nessun ARTICOLO attivo trovato per Config ID:", configRecordId, "dopo filtro JS.");
                 }

            } else {
                 if (allActiveCategories.length === 0) console.log("Nessuna categoria ATTIVA trovata in totale (Filtro API {Stato Attivo}=1 fallito?).");
                 if (allActiveItems.length === 0) console.log("Nessun articolo ATTIVO trovato in totale (Filtro API {Stato Attivo}=1 fallito?).");
            }

            // 4. Renderizza il Menu
            renderMenu(processedMenuData);

        } catch (error) {
            console.error('ERRORE:', error);
            if (menuContent) menuContent.innerHTML = `<p class="error-message">Errore nel caricamento del menu: ${error.message}</p>`;
        } finally {
            if (menuLoadingMessage) menuLoadingMessage.style.display = 'none';
        }
    }
    loadMenuData();
});
