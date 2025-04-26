
let databaserisorse = [];

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
      disponibile: new Date().toLocaleDateString('it-IT')
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
    
    const updates = rows.slice(1); // Salta intestazione

    updates.forEach(row => {
      const risorsa = String(row[0] || '').trim();
      const disponibile = String(row[1] || '').trim();

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
      disponibile: new Date().toLocaleDateString('it-IT')
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
    const resDateObj = new Date(`20${resDateParts[2]}`, resDateParts[1] - 1, resDateParts[0]);
    const searchDateObj = new Date(searchDate);

    return r.dimensione >= searchSize && resDateObj >= searchDateObj;
  });

  filtered.sort((a, b) => {
    const dateA = new Date(a.disponibile.split("/").reverse().join("-"));
    const dateB = new Date(b.disponibile.split("/").reverse().join("-"));
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
