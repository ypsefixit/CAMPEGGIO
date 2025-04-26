
let databaseRisorse = [];

async function caricaRisorse() {
    const response = await fetch('risorse.xlsx');
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const oggi = new Date().toLocaleDateString('it-IT');
    databaseRisorse = json.map(riga => ({
        risorsa: riga["risorsa"],
        dimensione: parseFloat(riga["dimensione"]),
        disponibile: riga["disponibile"] ? riga["disponibile"] : oggi
    }));
}

function aggiornaDisponibilita(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        json.forEach(item => {
            const index = databaseRisorse.findIndex(r => r.risorsa === item["risorsa"]);
            if (index !== -1) {
                databaseRisorse[index].disponibile = item["disponibile"];
            }
        });
        document.getElementById('messaggioDisponibilita').textContent = "Disponibilità aggiornata con successo.";
    };
    reader.readAsArrayBuffer(file);
}

function aggiornaRisorse(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const oggi = new Date().toLocaleDateString('it-IT');
        databaseRisorse = json.map(riga => ({
            risorsa: riga["risorsa"],
            dimensione: parseFloat(riga["dimensione"]),
            disponibile: riga["disponibile"] ? riga["disponibile"] : oggi
        }));
        document.getElementById('messaggioRisorse').textContent = "Risorse aggiornate con successo.";
    };
    reader.readAsArrayBuffer(file);
}

function cercaRisorse() {
    const dataInput = document.getElementById('dataInput').value;
    const dimensioneInput = parseFloat(document.getElementById('dimensioneInput').value);

    if (!dataInput || isNaN(dimensioneInput)) {
        alert('Inserisci correttamente tutti i campi.');
        return;
    }

    const dataSelezionata = dataInput.split("-").reverse().join("/"); // da yyyy-mm-dd a dd/mm/yyyy
    const dataSelezionataDate = new Date(dataInput);

    const risultati = databaseRisorse.filter(risorsa => {
        const disponibileParts = risorsa.disponibile.split("/");
        const disponibileDate = new Date(`20${disponibileParts[2]}-${disponibileParts[1]}-${disponibileParts[0]}`);
        return (
            risorsa.dimensione >= dimensioneInput &&
            disponibileDate >= dataSelezionataDate
        );
    });

    mostraRisultati(risultati);
}

function mostraRisultati(risultati) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = "";

    if (risultati.length === 0) {
        resultsDiv.innerHTML = "<p style='text-align:center; color: #ef4444;'>Nessun risultato trovato.</p>";
        return;
    }

    risultati.sort((a, b) => {
        const da = a.disponibile.split("/");
        const db = b.disponibile.split("/");
        const dataA = new Date(`20${da[2]}-${da[1]}-${da[0]}`);
        const dataB = new Date(`20${db[2]}-${db[1]}-${db[0]}`);

        if (dataA - dataB !== 0) return dataA - dataB;
        if (a.dimensione - b.dimensione !== 0) return a.dimensione - b.dimensione;
        return a.risorsa.localeCompare(b.risorsa);
    });

    const table = document.createElement('table');
    const header = table.insertRow();
    ["Risorsa", "Dimensione", "Disponibile"].forEach(text => {
        const cell = header.insertCell();
        cell.outerHTML = `<th>${text}</th>`;
    });

    risultati.forEach(r => {
        const row = table.insertRow();
        row.insertCell().textContent = r.risorsa;
        row.insertCell().textContent = r.dimensione.toFixed(2);
        row.insertCell().textContent = r.disponibile;
    });

    resultsDiv.appendChild(table);
}

document.getElementById('uploadDisponibilita').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        aggiornaDisponibilita(e.target.files[0]);
    }
});
document.getElementById('uploadRisorse').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        aggiornaRisorse(e.target.files[0]);
    }
});

window.onload = caricaRisorse;
