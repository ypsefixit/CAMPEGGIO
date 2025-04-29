<!-- Assicurati di avere PapaParse incluso -->
<script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>

<script>
let databaserisorse = [];

function getFormattedDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = String(today.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDate(inputDate) {
  const parts = inputDate.split(/[\/\-]/);
  if (parts.length === 3) {
    let [d, m, y] = parts;
    if (y.length === 4) y = y.slice(-2);
    if (d.length === 4) [y, m, d] = [d.slice(-2), m, d];
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return getFormattedDate();
}

function parseDate(dateStr) {
  const [d, m, y] = dateStr.split('/');
  return new Date(2000 + parseInt(y), parseInt(m) - 1, parseInt(d));
}

function showMessage(element, message, color = 'black') {
  if (element) {
    element.textContent = message;
    element.style.color = color;
  }
}

function saveToLocalStorage() {
  localStorage.setItem('databaserisorse', JSON.stringify(databaserisorse));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem('databaserisorse');
  if (data) {
    databaserisorse = JSON.parse(data);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const accordionButtons = document.querySelectorAll(".accordion-button");

  accordionButtons.forEach(button => {
    button.addEventListener("click", function () {
      const accordionContent = this.nextElementSibling;
      if (accordionContent.style.maxHeight) {
        accordionContent.style.maxHeight = null;
      } else {
        document.querySelectorAll(".accordion-content").forEach(content => {
          content.style.maxHeight = null;
        });
        accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
      }
    });
  });

  loadFromLocalStorage();
  loadResourcesOnStartup();
});

window.onload = function () {
  const updateDateInput = document.getElementById('updateDate');
  if (updateDateInput) {
    updateDateInput.value = getTodayDate();
  }
};

function loadResourcesOnStartup() {
  const uploadResourcesMessage = document.getElementById('uploadResourcesMessage');

  fetch('risorse.csv')
    .then(response => {
      if (!response.ok) throw new Error(`Errore nel caricamento del file risorse.csv: ${response.statusText}`);
      return response.text();
    })
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          databaserisorse = results.data.map(row => ({
            risorsa: String(row['Risorsa'] || '').trim(),
            dimensione: parseFloat(row['Dimensione']) || 0,
            disponibile: normalizeDate(row['Disponibile'] || '')
          }));
          saveToLocalStorage();
          if (databaserisorse.length > 0) {
            showMessage(uploadResourcesMessage, "Database risorse caricato correttamente all'avvio!", "green");
          } else {
            showMessage(uploadResourcesMessage, "Il file risorse.csv è vuoto o non valido.", "red");
          }
        },
        error: function () {
          showMessage(uploadResourcesMessage, "Errore nella lettura del file risorse.csv.", "red");
        }
      });
    })
    .catch(error => showMessage(uploadResourcesMessage, error.message, "red"));
}

function uploadResources() {
  const fileInput = document.getElementById('resourcesFile');
  const file = fileInput.files[0];
  const msg = document.getElementById('uploadResourcesMessage');

  if (!file) {
    showMessage(msg, "Nessun file selezionato.", "red");
    return;
  }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      databaserisorse = results.data.map(row => ({
        risorsa: String(row['Risorsa'] || '').trim(),
        dimensione: parseFloat(row['Dimensione']) || 0,
        disponibile: normalizeDate(row['Disponibile'] || '')
      }));
      saveToLocalStorage();
      showMessage(msg, "File risorse caricato correttamente!", "green");
    },
    error: function () {
      showMessage(msg, "Errore caricamento file.", "red");
    }
  });
}

function uploadAvailability() {
  const fileInput = document.getElementById('availabilityFile');
  const file = fileInput.files[0];
  const msg = document.getElementById('uploadMessage');

  if (!file) {
    showMessage(msg, "Nessun file selezionato.", "red");
    return;
  }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      results.data.forEach(row => {
        const risorsa = String(row['Risorsa'] || '').trim();
        const disponibile = normalizeDate(row['Disponibile'] || '');
        const item = databaserisorse.find(r => r.risorsa === risorsa);
        if (item) item.disponibile = disponibile;
      });
      saveToLocalStorage();
      showMessage(msg, "File disponibilità caricato correttamente!", "green");
    },
    error: function () {
      showMessage(msg, "Errore caricamento file.", "red");
    }
  });
}

function searchResources() {
  const searchDate = document.getElementById('searchDate').value;
  const searchSize = parseFloat(document.getElementById('searchSize').value);
  const searchResults = document.getElementById('searchResults');

  if (!searchDate || isNaN(searchSize)) {
    searchResults.innerHTML = "<p style='color:red;'>Compila entrambi i campi di ricerca.</p>";
    return;
  }

  const formattedSearchDate = normalizeDate(searchDate);
  const searchDateObj = parseDate(formattedSearchDate);

  const filtered = databaserisorse.filter(r => {
    const resDateObj = parseDate(r.disponibile);
    return r.dimensione >= searchSize && resDateObj >= searchDateObj;
  });

  filtered.sort((a, b) => {
    const dateA = parseDate(a.disponibile);
    const dateB = parseDate(b.disponibile);
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
  const dateInput = document.getElementById('updateDate');
  const message = document.getElementById('updateMessage');

  const code = codeInput.value.trim().toUpperCase();
  const selectedDate = dateInput.value;

  if (!code || code.length !== 4) {
    showMessage(message, '⚠️ Inserisci un codice valido di 4 caratteri.', 'orange');
    return;
  }

  if (!databaserisorse || databaserisorse.length === 0) {
    showMessage(message, '⚠️ Devi prima caricare il file delle risorse!', 'orange');
    return;
  }

  const resource = databaserisorse.find(r => r.risorsa.toUpperCase() === code);

  if (resource) {
    resource.disponibile = selectedDate ? normalizeDate(selectedDate) : getFormattedDate();
    saveToLocalStorage();
    showMessage(message, `✅ La risorsa ${code} è stata occupata con data (${resource.disponibile}).`, 'green');
    codeInput.value = '';
    dateInput.value = '';
  } else {
    showMessage(message, '❌ Risorsa non trovata.', 'red');
  }
}

function exportToCSV() {
  const csvContent = "data:text/csv;charset=utf-8," +
    "Risorsa,Dimensione,Disponibile\n" +
    databaserisorse.map(r => `${r.risorsa},${r.dimensione},${r.disponibile}`).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "risorse_aggiornate.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>