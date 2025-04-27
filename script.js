
let databaserisorse = [];

function getFormattedDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = String(today.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

window.onload = async function() {
  try {
    const response = await fetch('risorse.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true }); // Aggiunto cellDates
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
    const workbook = XLSX.read(data, { type: 'array', cellDates: true }); // <-- anche qui cellDates
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const updates = rows.slice(1);

    updates.forEach(row => {
      const risorsa = String(row[0] || '').trim();
      let disponibile = row[1];

      if (disponibile instanceof Date) {
        const day = String(disponibile.getDate()).padStart(2, '0');
        const month = String(disponibile.getMonth() + 1).padStart(2, '0');
        const year = String(disponibile.getFullYear()).slice(-2);
        disponibile = `${day}/${month}/${year}`;
      } else if (typeof disponibile === 'string') {
        let parts = disponibile.split("/");
        if (parts.length === 3 && parts[2].length === 4) {
          parts[2] = parts[2].slice(-2);
          disponibile = parts.join("/");
        }
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
    const workbook = XLSX.read(data, { type: 'array', cellDates: true }); // Aggiunto anche qui per sicurezza
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    databaserisorse = rows.slice(1).map(row => {
      const risorsa = String(row[0] || '').trim();
      const dimensione = parseFloat(row[1]);
      return {
        risorsa: risorsa,
        dimensione: isNaN(dimensione) ? 0 : dimensione,
        disponibile: getFormattedDate()
      };
    });

    uploadResourcesMessage.textContent = "File risorse caricato correttamente!";
    uploadResourcesMessage.style.color = "green";
  };

  reader.onerror = function () {
    uploadResourcesMessage.textContent = "Errore caricamento file.";
    uploadResourcesMessage.style.color = "red";
  };

  reader.readAsArrayBuffer(file);
}
