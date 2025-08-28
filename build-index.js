// build-index.js

const fetch = require('node-fetch');
const fs = require('fs');

// --- Configurazione Airtable (CON I TUOI NUOVI DATI USATI IN MODO SICURO) ---
const AIRTABLE_BASE_ID = 'appGnw9kTGPSj9F59'; // <-- NUOVO ID BASE
const AIRTABLE_PAT = process.env.AIRTABLE_PAT_KEY; // <-- CHIAVE SEGRETA LETTA DA NETLIFY
const CONFIG_TABLE_NAME = 'Configurazione';
const LINKS_TABLE_NAME = 'Links';

// Funzioni Helper
const getField = (fields, fieldName, defaultValue = null) => { if (!fields) return defaultValue; const value = fields[fieldName]; return (value !== undefined && value !== null && value !== '') ? value : defaultValue; };
const getAttachmentUrl = (fields, fieldName) => { const attach = getField(fields, fieldName); if (Array.isArray(attach) && attach.length > 0) { return attach[0].url; } return null; };

async function buildIndex() {
    console.log("Inizio processo di build della pagina principale...");
    if (!AIRTABLE_PAT) throw new Error("Errore: La chiave API AIRTABLE_PAT_KEY non è impostata!");

    try {
        const headers = { Authorization: `Bearer ${AIRTABLE_PAT}` };

        // 1. Prendi la configurazione
        const configUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(CONFIG_TABLE_NAME)}?maxRecords=1`;
        const configResponse = await fetch(configUrl, { headers });
        if (!configResponse.ok) throw new Error(`API Config Error: ${await configResponse.text()}`);
        const configResult = await configResponse.json();
        const configFields = configResult.records[0].fields;

        // 2. Prendi i link
        const linkedLinkIds = getField(configFields, 'Link Attivi', []);
        let linksData = [];
        if (linkedLinkIds.length > 0) {
            const filter = `OR(${linkedLinkIds.map(id => `RECORD_ID()='${id}'`).join(',')})`;
            const linksUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(LINKS_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filter)}`;
            const linksResponse = await fetch(linksUrl, { headers });
            if (linksResponse.ok) {
                const linksResult = await linksResponse.json();
                const linksById = linksResult.records.reduce((acc, rec) => {
                    acc[rec.id] = rec.fields;
                    return acc;
                }, {});
                linksData = linkedLinkIds.map(id => linksById[id]).filter(Boolean);
            }
        }
        
        // 3. Genera l'HTML per i link
        let linksHTML = '';
        if (linksData.length > 0) {
            linksHTML = linksData.map(link => {
                const url = getField(link, 'Scrivi URL', '#');
                const label = getField(link, 'Etichetta', 'Link');
                const isMenu = url.toLowerCase().includes('menu.html');
                const target = isMenu ? '_top' : '_blank';
                const rel = isMenu ? '' : 'noopener noreferrer';
                const specialClass = isMenu ? 'menu-button-highlight' : '';
                return `<a href="${url}" class="link-button ${specialClass}" target="${target}" ${rel}>${label}</a>`;
            }).join('\n');
        } else {
            linksHTML = '<p>Nessun link disponibile.</p>';
        }

        // 4. Prepara altri dati per il template
        const logoUrl = getAttachmentUrl(configFields, 'Logo');
        const logoHTML = logoUrl ? `<img src="${logoUrl}" alt="Logo">` : '';
        const pageTitle = getField(configFields, 'Titolo Pagina', 'Benvenuti');

        // 5. Leggi il template, sostituisci i segnaposto e scrivi il file finale
        const template = fs.readFileSync('index.template.html', 'utf-8');
        const finalHTML = template
            .replace('<!-- PAGE_TITLE_PLACEHOLDER -->', pageTitle)
            .replace('<!-- LOGO_PLACEHOLDER -->', logoHTML)
            .replace('<!-- LINKS_PLACEHOLDER -->', linksHTML);

        fs.writeFileSync('index.html', finalHTML);
        console.log("Build completata: index.html creato con successo!");

    } catch (error) {
        console.error('ERRORE DURANTE LA BUILD di index:', error);
        process.exit(1);
    }
}

buildIndex();