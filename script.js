let databaserisorse = [];

function getFormattedDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = String(today.getFullYear()).slice(-2); // Anno a 2 cifre
  return `${day}/${month}/${year}`;
}

window.onload = async function() {
  try {
    const response = await fetch('risorse.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    databaserisorse = data.slice(1).map(row => ({
      risorsa: String(row[0] || '').trim(),
      dimensione: parseFloat(row[1]) || 0,
      disponibile: getFormattedDate()
    }));

  } catch (error) {
    console.error('Errore caricamento risorse:', error);
  }
};

function uploadAvailability() {
  const fileInput = document.getElementById('availabilityFile');
  const file = fileInput.files[0];
  const uploadMessage = document.getElementById('uploadMessage');

  if (!file) {
    uploadMessage.textContent = "Nessun file selezionato.";
    uploadMessage.style.color = "red";
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    const updates = rows.slice(1);

    updates.forEach(row => {
      const risorsa = String(row[0] || '').trim();
      let disponibile = String(row[1] || '').trim();

      // Normalizza la data a gg/mm/aa
      let parts = disponibile.split("/");
      if (parts.length === 3 && parts[2].length === 4) {
        parts[2] = parts[2].slice(-2); // Taglia anno a 2 cifre
        disponibile = parts.join("/");
      }

      const item = databaserisorse.find(r => r.risorsa === risorsa);
      if (item && disponibile) {
        item.disponibile = disponibile;
      }
    });

    uploadMessage.textContent = "File disponibilità caricato correttamente!";
    uploadMessage.style.color = "green";
  };

  reader.onerror = function () {
    uploadMessage.textContent = "Errore caricamento file.";
    uploadMessage.style.color = "red";
  };

  reader.readAsArrayBuffer(file);
}

function uploadResources() {
  const fileInput = document.getElementById('resourcesFile');
  const file = fileInput.files[0];
  const uploadResourcesMessage = document.getElementById('uploadResourcesMessage');

  if (!file) {
    uploadResourcesMessage.textContent = "Nessun file selezionato.";
    uploadResourcesMessage.style.color = "red";
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    databaserisorse = rows.slice(1).map(row => ({
      risorsa: String(row[0] || '').trim(),
      dimensione: parseFloat(row[1]) || 0,
      disponibile: getFormattedDate()
    }));

    uploadResourcesMessage.textContent = "File risorse caricato correttamente!";
    uploadResourcesMessage.style.color = "green";
  };

  reader.onerror = function () {
    uploadResourcesMessage.textContent = "Errore caricamento file.";
    uploadResourcesMessage.style.color = "red";
  };

  reader.readAsArrayBuffer(file);
}

function searchResources() {
  const searchDate = document.getElementById('searchDate').value;
  const searchSize = parseFloat(document.getElementById('searchSize').value);
  const searchResults = document.getElementById('searchResults');

  if (!searchDate || isNaN(searchSize)) {
    searchResults.innerHTML = "<p style='color:red;'>Compila entrambi i campi di ricerca.</p>";
    return;
  }

  const searchDateParts = searchDate.split("-");
  const formattedSearchDate = `${searchDateParts[2]}/${searchDateParts[1]}/${searchDateParts[0]}`;

  const filtered = databaserisorse.filter(r => {
    const resDateParts = r.disponibile.split("/");
    const year = parseInt(resDateParts[2], 10);
    const fullYear = 2000 + year; // Anno completo a partire da 2000
    const resDateObj = new Date(fullYear, resDateParts[1] - 1, resDateParts[0]);
    const searchDateObj = new Date(searchDate);

    return r.dimensione >= searchSize && resDateObj >= searchDateObj;
  });

  filtered.sort((a, b) => {
    const dateAparts = a.disponibile.split("/");
    const dateBparts = b.disponibile.split("/");
    const dateA = new Date(2000 + parseInt(dateAparts[2], 10), dateAparts[1] - 1, dateAparts[0]);
    const dateB = new Date(2000 + parseInt(dateBparts[2], 10), dateBparts[1] - 1, dateBparts[0]);
    
    if (dateA - dateB !== 0) return dateA - dateB;
    if (a.dimensione - b.dimensione !== 0) return a.dimensione - b.dimensione;
    return a.risorsa.localeCompare(b.risorsa);
  });

  if (filtered.length === 0) {
    searchResults.innerHTML = "<p>Nessun risultato trovato.</p>";
    return;
  }

  let table = "<table><thead><tr><th>Risorsa</th><th>Dimensione</th><th>Disponibile</th></tr></thead><tbody>";
  filtered.forEach(r => {
    table += `<tr><td>${r.risorsa}</td><td>${r.dimensione.toFixed(2)}</td><td>${r.disponibile}</td></tr>`;
  });
  table += "</tbody></table>";
  searchResults.innerHTML = table;
}

function updateAvailability() {
    const codeInput = document.getElementById('updateCode');
    const message = document.getElementById('updateMessage');

    const code = codeInput.value.trim().toUpperCase();

    // 1. Controllo che ci sia il codice e sia lungo 4 caratteri
    if (!code || code.length !== 4) {
        message.innerText = '⚠️ Inserisci un codice valido di 4 caratteri.';
        return;
    }

    // 2. Controllo che resources sia caricato
    if (!resources || resources.length === 0) {
        message.innerText = '⚠️ Devi prima caricare il file delle risorse!';
        return;
    }

    // 3. Cerca la risorsa
    const resource = resources.find(r => r.Codice === code);

    if (resource) {
        resource.Disponibile = 'NO';
        message.innerText = `✅ La risorsa ${code} è stata aggiornata come occupata.`;

        // 4. Aggiorna la lista visibile (se presente)
        renderResources(resources);

        // 5. (Opzionale) Resetta il campo input
        codeInput.value = '';
    } else {
        message.innerText = '❌ Risorsa non trovata.';
    }
}
