// build-index.js (Basato sul tuo script funzionante)

const fetch = require('node-fetch');
const fs = require('fs');

// --- Configurazione Airtable (NUOVE CHIAVI USATE IN MODO SICURO) ---
const AIRTABLE_BASE_ID = 'appGnw9kTGPSj9F59';
const AIRTABLE_PAT = process.env.AIRTABLE_PAT_KEY;
const CONFIG_TABLE_NAME = 'Configurazione';
const LINKS_TABLE_NAME = 'Links';

// --- Mappatura Campi (dal tuo script) ---
const fieldMap = {
    config: {
        title: 'Titolo Pagina', logoUrl: 'Logo', backgroundUrl: 'Sfondo', linkedLinks: 'Link Attivi'
    },
    links: { label: 'Etichetta', url: 'Scrivi URL' }
};
const defaultBackgroundTexture = "url('https://www.transparenttextures.com/patterns/dark-wood.png')";

// --- Funzioni Helper (dal tuo script) ---
const getField = (fields, fieldName, defaultValue = null) => { if (!fields) return defaultValue; const value = fields[fieldName]; return (value !== undefined && value !== null && value !== '') ? value : defaultValue; };
const getAttachmentUrl = (fields, fieldName) => { const attach = getField(fields, fieldName); if (Array.isArray(attach) && attach.length > 0) { const first = attach[0]; if (first.thumbnails && first.thumbnails.large) { return first.thumbnails.large.url; } return first.url; } return null; };

async function buildIndex() {
    console.log("Inizio build della pagina principale...");
    if (!AIRTABLE_PAT) throw new Error("Errore: La chiave API AIRTABLE_PAT_KEY non è impostata!");

    try {
        const headers = { Authorization: `Bearer ${AIRTABLE_PAT}` };
        
        // 1. Recupera Configurazione
        const configUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(CONFIG_TABLE_NAME)}?maxRecords=1`;
        const configResponse = await fetch(configUrl, { headers });
        if (!configResponse.ok) throw new Error(`API Config Error: ${await configResponse.text()}`);
        const configResult = await configResponse.json();
        const configFields = configResult.records[0].fields;

        // 2. Prepara lo sfondo (logica dal tuo script)
        let videoSrc = '';
        let videoDisplay = 'none';
        let containerStyle = `background-image: ${defaultBackgroundTexture}; background-repeat: repeat;`;
        const backgroundAttachment = getField(configFields, fieldMap.config.backgroundUrl);
        if (Array.isArray(backgroundAttachment) && backgroundAttachment.length > 0) {
            const firstAttachment = backgroundAttachment[0];
            if (firstAttachment.type && firstAttachment.url) {
                if (firstAttachment.type.startsWith('video/')) {
                    videoSrc = firstAttachment.url;
                    videoDisplay = 'block';
                    containerStyle = 'background-color: #3a2d27;';
                } else if (firstAttachment.type.startsWith('image/')) {
                    const imageUrl = getAttachmentUrl(configFields, fieldMap.config.backgroundUrl);
                    containerStyle = `background-image: url('${imageUrl}'); background-size: cover; background-position: center center; background-repeat: no-repeat;`;
                }
            }
        }

        // 3. Recupera e Prepara i Link
        const linkedLinkIds = getField(configFields, fieldMap.config.linkedLinks, []);
        let linksHTML = '';
        if (linkedLinkIds.length > 0) {
            const recordIdFilter = linkedLinkIds.map(id => `RECORD_ID()='${id}'`).join(',');
            const linksUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(LINKS_TABLE_NAME)}?filterByFormula=OR(${recordIdFilter})`;
            const linksResponse = await fetch(linksUrl, { headers });
            if (linksResponse.ok) {
                const linksResult = await linksResponse.json();
                const linksById = linksResult.records.reduce((acc, rec) => { acc[rec.id] = rec.fields; return acc; }, {});
                const linksData = linkedLinkIds.map(id => linksById[id]).filter(Boolean);
                linksHTML = linksData.map(link => {
                    const url = getField(link, fieldMap.links.url, '#');
                    const label = getField(link, fieldMap.links.label, 'Link');
                    const isMenu = url.toLowerCase().includes('menu.html');
                    const target = isMenu ? '_top' : '_blank';
                    const rel = isMenu ? '' : 'noopener noreferrer';
                    const specialClass = isMenu ? 'menu-button-highlight' : '';
                    return `<a href="${url}" class="link-button ${specialClass}" target="${target}" ${rel}>${label}</a>`;
                }).join('\n');
            }
        }
        if (!linksHTML) linksHTML = '<p>Nessun link disponibile.</p>';

        // 4. Prepara altri dati
        const logoUrl = getAttachmentUrl(configFields, fieldMap.config.logoUrl);
        const logoHTML = logoUrl ? `<img src="${logoUrl}" alt="Logo">` : '';
        const pageTitle = getField(configFields, fieldMap.config.title, 'Benvenuti');
        
        // 5. Applica tutto al template
        const template = fs.readFileSync('index.template.html', 'utf-8');
        const finalHTML = template
            .replace('<!-- PAGE_TITLE_PLACEHOLDER -->', pageTitle)
            .replace('<!-- LOGO_PLACEHOLDER -->', logoHTML)
            .replace('<!-- LINKS_PLACEHOLDER -->', linksHTML)
            .replace('<!-- CONTAINER_STYLE_PLACEHOLDER -->', containerStyle)
            .replace('<!-- VIDEO_SRC_PLACEHOLDER -->', videoSrc)
            .replace('<!-- VIDEO_DISPLAY_PLACEHOLDER -->', videoDisplay);

        fs.writeFileSync('index.html', finalHTML);
        console.log("Build index.html completata con successo (con logica sfondo originale)!");

    } catch (error) {
        console.error('ERRORE build index:', error);
        process.exit(1);
    }
}

buildIndex();// build-index.js (Basato sul tuo script funzionante)



// --- Configurazione Airtable (NUOVE CHIAVI USATE IN MODO SICURO) ---
const AIRTABLE_BASE_ID = 'appGnw9kTGPSj9F59';
const AIRTABLE_PAT = process.env.AIRTABLE_PAT_KEY;
const CONFIG_TABLE_NAME = 'Configurazione';
const LINKS_TABLE_NAME = 'Links';

// --- Mappatura Campi (dal tuo script) ---
const fieldMap = {
    config: {
        title: 'Titolo Pagina', logoUrl: 'Logo', backgroundUrl: 'Sfondo', linkedLinks: 'Link Attivi'
    },
    links: { label: 'Etichetta', url: 'Scrivi URL' }
};
const defaultBackgroundTexture = "url('https://www.transparenttextures.com/patterns/dark-wood.png')";

// --- Funzioni Helper (dal tuo script) ---
const getField = (fields, fieldName, defaultValue = null) => { if (!fields) return defaultValue; const value = fields[fieldName]; return (value !== undefined && value !== null && value !== '') ? value : defaultValue; };
const getAttachmentUrl = (fields, fieldName) => { const attach = getField(fields, fieldName); if (Array.isArray(attach) && attach.length > 0) { const first = attach[0]; if (first.thumbnails && first.thumbnails.large) { return first.thumbnails.large.url; } return first.url; } return null; };

async function buildIndex() {
    console.log("Inizio build della pagina principale...");
    if (!AIRTABLE_PAT) throw new Error("Errore: La chiave API AIRTABLE_PAT_KEY non è impostata!");

    try {
        const headers = { Authorization: `Bearer ${AIRTABLE_PAT}` };
        
        // 1. Recupera Configurazione
        const configUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(CONFIG_TABLE_NAME)}?maxRecords=1`;
        const configResponse = await fetch(configUrl, { headers });
        if (!configResponse.ok) throw new Error(`API Config Error: ${await configResponse.text()}`);
        const configResult = await configResponse.json();
        const configFields = configResult.records[0].fields;

        // 2. Prepara lo sfondo (logica dal tuo script)
        let videoSrc = '';
        let videoDisplay = 'none';
        let containerStyle = `background-image: ${defaultBackgroundTexture}; background-repeat: repeat;`;
        const backgroundAttachment = getField(configFields, fieldMap.config.backgroundUrl);
        if (Array.isArray(backgroundAttachment) && backgroundAttachment.length > 0) {
            const firstAttachment = backgroundAttachment[0];
            if (firstAttachment.type && firstAttachment.url) {
                if (firstAttachment.type.startsWith('video/')) {
                    videoSrc = firstAttachment.url;
                    videoDisplay = 'block';
                    containerStyle = 'background-color: #3a2d27;';
                } else if (firstAttachment.type.startsWith('image/')) {
                    const imageUrl = getAttachmentUrl(configFields, fieldMap.config.backgroundUrl);
                    containerStyle = `background-image: url('${imageUrl}'); background-size: cover; background-position: center center; background-repeat: no-repeat;`;
                }
            }
        }

        // 3. Recupera e Prepara i Link
        const linkedLinkIds = getField(configFields, fieldMap.config.linkedLinks, []);
        let linksHTML = '';
        if (linkedLinkIds.length > 0) {
            const recordIdFilter = linkedLinkIds.map(id => `RECORD_ID()='${id}'`).join(',');
            const linksUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(LINKS_TABLE_NAME)}?filterByFormula=OR(${recordIdFilter})`;
            const linksResponse = await fetch(linksUrl, { headers });
            if (linksResponse.ok) {
                const linksResult = await linksResponse.json();
                const linksById = linksResult.records.reduce((acc, rec) => { acc[rec.id] = rec.fields; return acc; }, {});
                const linksData = linkedLinkIds.map(id => linksById[id]).filter(Boolean);
                linksHTML = linksData.map(link => {
                    const url = getField(link, fieldMap.links.url, '#');
                    const label = getField(link, fieldMap.links.label, 'Link');
                    const isMenu = url.toLowerCase().includes('menu.html');
                    const target = isMenu ? '_top' : '_blank';
                    const rel = isMenu ? '' : 'noopener noreferrer';
                    const specialClass = isMenu ? 'menu-button-highlight' : '';
                    return `<a href="${url}" class="link-button ${specialClass}" target="${target}" ${rel}>${label}</a>`;
                }).join('\n');
            }
        }
        if (!linksHTML) linksHTML = '<p>Nessun link disponibile.</p>';

        // 4. Prepara altri dati
        const logoUrl = getAttachmentUrl(configFields, fieldMap.config.logoUrl);
        const logoHTML = logoUrl ? `<img src="${logoUrl}" alt="Logo">` : '';
        const pageTitle = getField(configFields, fieldMap.config.title, 'Benvenuti');
        
        // 5. Applica tutto al template
        const template = fs.readFileSync('index.template.html', 'utf-8');
        const finalHTML = template
            .replace('<!-- PAGE_TITLE_PLACEHOLDER -->', pageTitle)
            .replace('<!-- LOGO_PLACEHOLDER -->', logoHTML)
            .replace('<!-- LINKS_PLACEHOLDER -->', linksHTML)
            .replace('<!-- CONTAINER_STYLE_PLACEHOLDER -->', containerStyle)
            .replace('<!-- VIDEO_SRC_PLACEHOLDER -->', videoSrc)
            .replace('<!-- VIDEO_DISPLAY_PLACEHOLDER -->', videoDisplay);

        fs.writeFileSync('index.html', finalHTML);
        console.log("Build index.html completata con successo (con logica sfondo originale)!");

    } catch (error) {
        console.error('ERRORE build index:', error);
        process.exit(1);
    }
}

buildIndex();
