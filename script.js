
let risorseDatabase = [];

function uploadResources() {
    const fileInput = document.getElementById('resourcesFile');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            risorseDatabase = [];
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (row.length >= 2) {
                    risorseDatabase.push({
                        risorsa: row[0],
                        dimensione: parseFloat(row[1]),
                        disponibile: formatTodayDate()
                    });
                }
            }
            document.getElementById('uploadResourcesMessage').textContent = 'File risorse aggiornato correttamente!';
        };
        reader.readAsArrayBuffer(file);
    }
}

function uploadAvailability() {
    const fileInput = document.getElementById('availabilityFile');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                const risorsa = row[0];
                const disponibile = row[1];
                let resource = risorseDatabase.find(r => r.risorsa === risorsa);
                if (resource) {
                    resource.disponibile = disponibile;
                }
            }
            document.getElementById('uploadMessage').textContent = 'Disponibilità risorse caricata con successo!';
        };
        reader.readAsArrayBuffer(file);
    }
}

function searchResources() {
    const searchDate = document.getElementById('searchDate').value;
    const searchSize = parseFloat(document.getElementById('searchSize').value);
    if (!searchDate || isNaN(searchSize)) {
        alert('Inserisci correttamente data e lunghezza mezzo!');
        return;
    }

    const results = risorseDatabase.filter(resource => {
        const resourceDateParts = resource.disponibile.split('/');
        const resourceDate = new Date('20' + resourceDateParts[2], resourceDateParts[1] - 1, resourceDateParts[0]);
        const searchDateObj = new Date(searchDate);

        return resource.dimensione >= searchSize && resourceDate >= searchDateObj;
    });

    results.sort((a, b) => {
        const dateA = new Date('20' + a.disponibile.split('/')[2], a.disponibile.split('/')[1] - 1, a.disponibile.split('/')[0]);
        const dateB = new Date('20' + b.disponibile.split('/')[2], b.disponibile.split('/')[1] - 1, b.disponibile.split('/')[0]);
        if (dateA - dateB !== 0) return dateA - dateB;
        if (a.dimensione - b.dimensione !== 0) return a.dimensione - b.dimensione;
        return a.risorsa.localeCompare(b.risorsa);
    });

    renderTable(results);
}

function renderTable(data) {
    let html = '<table><thead><tr><th>Risorsa</th><th>Dimensione</th><th>Disponibile</th></tr></thead><tbody>';
    data.forEach(resource => {
        html += `<tr>
            <td>${resource.risorsa}</td>
            <td>${resource.dimensione.toFixed(2)}</td>
            <td>${resource.disponibile}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('searchResults').innerHTML = html;
}

function formatTodayDate() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}
