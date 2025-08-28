document.addEventListener('DOMContentLoaded', () => {
    // --- Configurazione Airtable (NUOVI DATI) ---
    const AIRTABLE_BASE_ID = 'apppoL3fKAYnY0K1A'; // NUOVO ID BASE!
    const AIRTABLE_PAT = 'patJFPTb4KfYLzoRm.7e0b70399100110760879f5ee61be0740c647966f671cd58ab966fa3455d9278'; // NUOVO TOKEN!
    const CONFIG_TABLE_NAME = 'Configurazione'; // VERIFICA NOME ESATTO
    const LINKS_TABLE_NAME = 'Links';           // VERIFICA NOME ESATTO

    // Mappatura campi Airtable -> nomi chiave script (VERIFICA NOMI CAMPO vs NUOVA BASE)
    const fieldMap = {
        config: {
            title: 'Titolo Pagina', titleSize: 'Dimensione Titolo', logoUrl: 'Logo',
            footerImageAlt: 'Alt Img Footer', footerImageUrl: 'Immagine Footer', backgroundUrl: 'Sfondo', // Campo per Sfondo (img o video)
            showLoader: 'Mostra Loader', loaderText: 'Testo Loader', loaderBarColor: 'Colore Barra Loader',
            loaderTextSize: 'Dimensione Testo Loader', loaderWidth: 'Larghezza Loader', loaderBarSpeed: 'Velocità Barra Loader',
            buttonFontSize: 'Dimensione Font Pulsanti', buttonPadding: 'Padding Pulsanti',
            showCountdown: 'Mostra Countdown', countdownTarget: 'Data Target Countdown', countdownLabel: 'Etichetta Countdown',
            linkedLinks: 'Link Attivi'
        },
        links: { label: 'Etichetta', url: 'Scrivi URL', color: 'Scrivi Colore Pulsante' }
    };

    const defaultButtonColor = 'linear-gradient(180deg, #8a6d3b 0%, #6a512f 100%)';
    const defaultBackgroundTexture = 'url(\'https://www.transparenttextures.com/patterns/dark-wood.png\')'; // URL texture legno

    // --- Elementi DOM ---
    const titleElement = document.getElementById('page-title');
    const logoContainer = document.getElementById('logo-container');
    const linkContainer = document.getElementById('link-container');
    const loadingMessage = document.getElementById('loading-message');
    const loader = document.getElementById('loader');
    const footerImageContainer = document.getElementById('footer-image-container');
    // Elementi Sfondo Dinamico
    const backgroundContainer = document.getElementById('background-container');
    const backgroundVideoElement = document.getElementById('background-video');
    // Countdown Elements
    const countdownContainer = document.getElementById('countdown-container');
    const countdownLabelElement = document.getElementById('countdown-label');
    const countdownTimerDiv = document.getElementById('countdown-timer');
    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    const countdownMessageElement = document.getElementById('countdown-message');
    let countdownIntervalId = null;

    // --- Funzioni Helper ---
    const getField = (fields, fieldName, defaultValue = null) => { if (!fields) return defaultValue; const value = fields[fieldName]; return (value !== undefined && value !== null && value !== '') ? value : defaultValue; };
    // getAttachmentUrl ora è usato specificamente per ottenere l'URL di un'immagine (gestendo le thumbnail)
    const getAttachmentUrl = (fields, fieldName) => { const attach = getField(fields, fieldName); if (Array.isArray(attach) && attach.length > 0) { const first = attach[0]; if (first.thumbnails && first.thumbnails.large) { return first.thumbnails.large.url; } return first.url; } return null; };

    // --- Funzione Principale di Caricamento ---
    async function loadData() {
        if (loadingMessage) loadingMessage.style.display = 'block';
        if (linkContainer) linkContainer.innerHTML = '';

        try {
            const headers = { Authorization: `Bearer ${AIRTABLE_PAT}` };

            // 1. Recupera Configurazione
            const configUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(CONFIG_TABLE_NAME)}?maxRecords=1`;
            console.log("Fetch Config:", configUrl);
            const configResponse = await fetch(configUrl, { headers });
            if (!configResponse.ok) { const errBody = await configResponse.text(); console.error("API Config Error Body:", errBody); throw new Error(`API Config Error: ${configResponse.status}`); }
            const configResult = await configResponse.json();
            if (!configResult.records || configResult.records.length === 0) { throw new Error("Nessun record Configurazione trovato."); }
            const configRecord = configResult.records[0];
            const configFields = configRecord.fields;
            const configRecordId = configRecord.id;
            console.log("Config Data:", configFields, "ID:", configRecordId);

            // 2. Recupera Links Collegati (Logica Invariata)
            const linkedLinkIds = getField(configFields, fieldMap.config.linkedLinks, []);
            let linksData = []; let linksFieldsById = {};
            if (linkedLinkIds.length > 0) {
                const recordIdFilter = linkedLinkIds.map(id => `RECORD_ID()='${id}'`).join(',');
                const filterFormulaLinks = `OR(${recordIdFilter})`;
                const linksUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(LINKS_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaLinks)}`;
                console.log("Fetch Links:", linksUrl);
                const linksResponse = await fetch(linksUrl, { headers });
                if (linksResponse.ok) { const linksResult = await linksResponse.json(); console.log("Links Data Raw:", linksResult.records); if (linksResult.records) { linksResult.records.forEach(rec => { linksFieldsById[rec.id] = { id: rec.id, label: getField(rec.fields, fieldMap.links.label, '?'), url: getField(rec.fields, fieldMap.links.url), color: getField(rec.fields, fieldMap.links.color, defaultButtonColor) }; }); } }
                else { console.warn(`API Links Warning: ${linksResponse.status} ${await linksResponse.text()}`); }
                linksData = linkedLinkIds.map(id => linksFieldsById[id]).filter(link => link !== undefined);
            }
            console.log("Links Data Processed:", linksData);

            // --- Applica Configurazione Visiva ---

            // *** Sfondo Dinamico (Video o Immagine) *** (Logica invariata rispetto alla versione precedente funzionante)
            const backgroundAttachment = getField(configFields, fieldMap.config.backgroundUrl);
            document.body.style.backgroundImage = '';
            if (backgroundContainer) {
                 backgroundContainer.style.backgroundImage = '';
                 backgroundContainer.style.backgroundColor = '#3a2d27';
            }
            if (backgroundVideoElement) {
                backgroundVideoElement.style.display = 'none';
                backgroundVideoElement.removeAttribute('src');
            }
            if (Array.isArray(backgroundAttachment) && backgroundAttachment.length > 0) {
                const firstAttachment = backgroundAttachment[0];
                const attachmentUrl = firstAttachment.url;
                const attachmentType = firstAttachment.type;
                console.log("Trovato allegato Sfondo:", { url: attachmentUrl, type: attachmentType });
                if (attachmentType && attachmentUrl) {
                    if (attachmentType.startsWith('video/')) {
                        console.log("Applicando sfondo VIDEO:", attachmentUrl);
                        if (backgroundVideoElement && backgroundContainer) {
                            backgroundVideoElement.src = attachmentUrl;
                            backgroundVideoElement.style.display = 'block';
                            document.body.style.backgroundImage = '';
                            backgroundContainer.style.backgroundImage = '';
                            backgroundContainer.style.backgroundColor = '#3a2d27';
                        } else { console.error("Elemento #background-video o #background-container non trovato!"); }
                    } else if (attachmentType.startsWith('image/')) {
                        const imageUrl = getAttachmentUrl(configFields, fieldMap.config.backgroundUrl);
                        console.log("Applicando sfondo IMMAGINE:", imageUrl);
                        if (imageUrl && backgroundContainer) {
                            backgroundContainer.style.backgroundImage = `url('${imageUrl}')`;
                            backgroundContainer.style.backgroundSize = 'cover';
                            backgroundContainer.style.backgroundPosition = 'center center';
                            backgroundContainer.style.backgroundRepeat = 'no-repeat';
                            if (backgroundVideoElement) backgroundVideoElement.style.display = 'none';
                            document.body.style.backgroundImage = '';
                        } else {
                             console.warn("URL Immagine non trovato o container mancante.");
                             if (backgroundContainer) { backgroundContainer.style.backgroundImage = defaultBackgroundTexture; backgroundContainer.style.backgroundRepeat = 'repeat'; }
                        }
                    } else {
                        console.warn("Tipo di file non supportato per lo sfondo:", attachmentType);
                        if (backgroundContainer) { backgroundContainer.style.backgroundImage = defaultBackgroundTexture; backgroundContainer.style.backgroundRepeat = 'repeat'; }
                    }
                } else {
                     console.log("Allegato Sfondo non valido. Applicando sfondo di default.");
                      if (backgroundContainer) { backgroundContainer.style.backgroundImage = defaultBackgroundTexture; backgroundContainer.style.backgroundRepeat = 'repeat'; }
                }
            } else {
                console.log("Nessuno sfondo specificato. Applicando sfondo di default.");
                 if (backgroundContainer) { backgroundContainer.style.backgroundImage = defaultBackgroundTexture; backgroundContainer.style.backgroundRepeat = 'repeat'; }
            }
            // *** FINE LOGICA SFONDO ***


            // Titolo Pagina (Logica Invariata)
            const pageTitle = getField(configFields, fieldMap.config.title, 'Menu Pub');
            document.title = pageTitle;
            if (titleElement) {
                titleElement.textContent = pageTitle;
                const titleSize = getField(configFields, fieldMap.config.titleSize);
                if (titleSize) titleElement.style.fontSize = titleSize;
                else titleElement.style.fontSize = '';
            }

            // Countdown Timer (Logica Invariata)
            if (countdownIntervalId) clearInterval(countdownIntervalId);
            const showCountdown = getField(configFields, fieldMap.config.showCountdown, false);
            const countdownTargetStr = getField(configFields, fieldMap.config.countdownTarget);
            const countdownLabel = getField(configFields, fieldMap.config.countdownLabel, '');
            if (countdownContainer && countdownLabelElement && countdownTimerDiv && daysElement && hoursElement && minutesElement && secondsElement && countdownMessageElement) {
                if (showCountdown === true && countdownTargetStr) {
                    const targetDate = new Date(countdownTargetStr);
                    if (!isNaN(targetDate) && targetDate.getTime() > Date.now()) {
                        console.log("Avvio Countdown verso:", targetDate);
                        countdownLabelElement.textContent = countdownLabel;
                        countdownMessageElement.style.display = 'none';
                        countdownTimerDiv.style.display = 'block';
                        countdownContainer.style.display = 'block';
                        const updateCountdown = () => {
                             const now = new Date().getTime(); const distance = targetDate.getTime() - now;
                             if(distance < 0){ clearInterval(countdownIntervalId); countdownTimerDiv.style.display = 'none'; countdownLabelElement.style.display = 'none'; countdownMessageElement.textContent = "Tempo Scaduto!"; countdownMessageElement.style.display = 'block'; console.log("Countdown terminato."); return; }
                             const days = Math.floor(distance / (1000*60*60*24)); const hours = Math.floor((distance % (1000*60*60*24))/(1000*60*60)); const minutes = Math.floor((distance % (1000*60*60))/(1000*60)); const seconds = Math.floor((distance % (1000*60))/1000);
                             daysElement.textContent = String(days).padStart(2,'0'); hoursElement.textContent = String(hours).padStart(2,'0'); minutesElement.textContent = String(minutes).padStart(2,'0'); secondsElement.textContent = String(seconds).padStart(2,'0');
                        };
                        updateCountdown();
                        countdownIntervalId = setInterval(updateCountdown, 1000);
                    } else { console.log("Countdown non avviato: data non valida o passata.", countdownTargetStr); if (countdownContainer) countdownContainer.style.display = 'none'; }
                } else { console.log("Countdown disattivato nelle impostazioni."); if (countdownContainer) countdownContainer.style.display = 'none'; }
            } else { console.warn("Elementi HTML del Countdown mancanti."); if (countdownContainer) countdownContainer.style.display = 'none'; }

            // Loader (Logica Invariata)
            const showLoader = getField(configFields, fieldMap.config.showLoader, false);
            if (loader) {
                 if (showLoader) {
                     loader.style.display = 'flex';
                     const loaderTextElement = document.getElementById('loading-text-container');
                     const loaderBarElement = loader.querySelector('.loader-bar');
                     if (loaderTextElement) { loaderTextElement.textContent = getField(configFields, fieldMap.config.loaderText, 'Caricamento...'); }
                     if (loaderBarElement) {
                         const barColor = getField(configFields, fieldMap.config.loaderBarColor);
                         const barSpeed = getField(configFields, fieldMap.config.loaderBarSpeed);
                         if (barColor) { loaderBarElement.style.backgroundColor = barColor; console.log("Colore barra:", barColor); } else { loaderBarElement.style.backgroundColor = '';}
                         if (typeof barSpeed === 'number' && barSpeed > 0) { loaderBarElement.style.animationDuration = barSpeed + 's'; console.log("Velocità barra:", barSpeed); }
                         else { loaderBarElement.style.animationDuration = ''; }
                     } else { console.warn("Elemento .loader-bar non trovato."); }
                     if (loaderTextElement) {
                          const textSize = getField(configFields, fieldMap.config.loaderTextSize);
                          if (textSize) { loaderTextElement.style.fontSize = textSize; console.log("Dim txt loader:", textSize); }
                          else { loaderTextElement.style.fontSize = ''; }
                     }
                     const loaderWidth = getField(configFields, fieldMap.config.loaderWidth);
                     if (loaderWidth) { loader.style.width = loaderWidth; loader.style.maxWidth = 'none'; console.log("Width loader:", loaderWidth); }
                     else { loader.style.width = ''; loader.style.maxWidth = ''; }
                 } else {
                     loader.style.display = 'none';
                 }
            } else { console.warn("Elemento #loader non trovato."); }

            // Logo (Logica Invariata)
            const logoUrl = getAttachmentUrl(configFields, fieldMap.config.logoUrl); logoContainer.innerHTML = ''; if (logoUrl) { const li = document.createElement('img'); li.src = logoUrl; li.alt = 'Logo'; logoContainer.appendChild(li); }

            // Pulsanti Link (MODIFICATO per aggiungere classe speciale al menu)
            linkContainer.innerHTML = '';
            if (linksData && linksData.length > 0) {
                const btnFs = getField(configFields, fieldMap.config.buttonFontSize);
                const btnPad = getField(configFields, fieldMap.config.buttonPadding);
                linksData.forEach(link => {
                    if (link.url) {
                        const btn = document.createElement('a');
                        btn.href = link.url;
                        btn.textContent = link.label;
                        btn.className = 'link-button'; // Classe base per tutti

                        // --- MODIFICA INSERITA QUI ---
                        // Controlla se questo è il link al menu e aggiungi una classe speciale
                        if (link.url.toLowerCase() === 'menu.html') {
                            btn.classList.add('menu-button-highlight');
                            console.log("Aggiunta classe speciale al pulsante Menu:", link.label);
                        }
                        // --- FINE MODIFICA ---

                        // Gestione target (invariata, ma messa dopo l'aggiunta della classe)
                        if (link.url.toLowerCase() === 'menu.html') {
                            btn.target = '_top'; // Apre nella stessa finestra/tab
                        } else {
                            btn.target = '_blank'; // Apre in nuova finestra/tab
                            btn.rel = 'noopener noreferrer'; // Sicurezza per target _blank
                        }

                        // Applica stili (invariato)
                        btn.style.background = link.color || defaultButtonColor;
                        if(btnFs) btn.style.fontSize = btnFs;
                        if(btnPad) btn.style.padding = btnPad;

                        linkContainer.appendChild(btn);
                    } else {
                        console.warn(`Link '${link.label}' skipped (no URL).`);
                    }
                });
            } else {
                linkContainer.innerHTML = '<p>Nessun link attivo collegato.</p>';
            }
            // --- FINE LOGICA PULSANTI LINK ---


            // Immagine Footer (Logica Invariata)
            const footerImageUrl=getAttachmentUrl(configFields,fieldMap.config.footerImageUrl);if(footerImageContainer){footerImageContainer.innerHTML='';if(footerImageUrl){const fi=document.createElement('img');fi.src=footerImageUrl;fi.alt=getField(configFields,fieldMap.config.footerImageAlt,'');footerImageContainer.appendChild(fi);}}

            if (loadingMessage) loadingMessage.style.display = 'none';

        } catch (error) {
             console.error('ERRORE NEL CARICAMENTO DATI:', error);
             if (loadingMessage) loadingMessage.style.display = 'none';
             const errorDiv = document.createElement('div');
             errorDiv.className = 'error-message';
             errorDiv.textContent = 'Oops! Qualcosa è andato storto nel caricare le informazioni. Riprova più tardi.';
             if(linkContainer) { linkContainer.parentNode.insertBefore(errorDiv, linkContainer); }
             else if (document.body) { document.body.appendChild(errorDiv); }
             if (titleElement) { titleElement.textContent = 'Errore'; document.body.classList.add('error-page'); }
              if (backgroundContainer) {
                 backgroundContainer.style.backgroundImage = defaultBackgroundTexture;
                 backgroundContainer.style.backgroundRepeat = 'repeat';
              }
        }
    }
    loadData();
});
