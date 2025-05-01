// Inizializza il database delle risorse
let databaserisorse = [];

// Gestione degli accordion
document.addEventListener("DOMContentLoaded", function () {
  const accordionButtons = document.querySelectorAll(".accordion-button");

  accordionButtons.forEach(button => {
    button.addEventListener("click", function () {
      const accordionContent = this.nextElementSibling;

      if (accordionContent.style.maxHeight) {
        accordionContent.style.maxHeight = null; // Chiude il contenuto
      } else {
        document.querySelectorAll(".accordion-content").forEach(content => {
          content.style.maxHeight = null; // Chiude gli altri
        });
        accordionContent.style.maxHeight = accordionContent.scrollHeight + "px"; // Apre il contenuto
      }
    });
  });

  // Carica le risorse all'avvio
  loadResourcesOnStartup();
});

// Funzione per salvare il database in localStorage
function saveToLocalStorage() {
  try {
    localStorage.setItem("databaserisorse", JSON.stringify(databaserisorse));
  } catch (error) {
    console.error("Errore nel salvataggio su localStorage:", error);
  }
}

// Funzione per caricare il database da localStorage
function loadFromLocalStorage() {
  try {
    const savedData = localStorage.getItem("databaserisorse");
    return savedData ? JSON.parse(savedData) : null;
  } catch (error) {
    console.error("Errore nel caricamento da localStorage:", error);
    return null;
  }
}

// Caricamento iniziale delle risorse
function loadResourcesOnStartup() {
  const uploadResourcesMessage = document.getElementById('uploadResourcesMessage');
  databaserisorse = loadFromLocalStorage();

  if (databaserisorse && databaserisorse.length > 0) {
    uploadResourcesMessage.textContent = "Database risorse caricato correttamente dal salvataggio locale!";
    uploadResourcesMessage.classList.add("success");
  } else {
    uploadResourcesMessage.textContent = "Nessun database trovato. Carica un file per iniziare.";
    uploadResourcesMessage.classList.add("error");
  }
}

// Funzione per caricare risorse da file CSV
function uploadResources() {
  const fileInput = document.getElementById('resourcesFile');
  const file = fileInput.files[0];
  const uploadResourcesMessage = document.getElementById('uploadResourcesMessage');

  if (!file) {
    uploadResourcesMessage.textContent = "Nessun file selezionato.";
    uploadResourcesMessage.classList.add("error");
    return;
  }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      try {
        databaserisorse = results.data.map(row => ({
          risorsa: row['risorsa'] || '',
          dimensione: parseFloat(row['dimensione']) || 0,
          disponibile: row['disponibile'] || new Date().toISOString().split('T')[0]
        }));

        saveToLocalStorage();
        uploadResourcesMessage.textContent = "Database risorse caricato correttamente!";
        uploadResourcesMessage.classList.remove("error");
        uploadResourcesMessage.classList.add("success");
      } catch (error) {
        uploadResourcesMessage.textContent = "Errore durante l'elaborazione del file.";
        uploadResourcesMessage.classList.add("error");
      }
    },
    error: function () {
      uploadResourcesMessage.textContent = "Errore nel caricamento del file.";
      uploadResourcesMessage.classList.add("error");
    }
  });
}

// Funzione per caricare disponibilità
function uploadAvailability() {
  const fileInput = document.getElementById('availabilityFile');
  const file = fileInput.files[0];
  const uploadMessage = document.getElementById('uploadMessage');

  if (!file) {
    uploadMessage.textContent = "Nessun file selezionato.";
    uploadMessage.classList.add("error");
    return;
  }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      try {
        let updates = 0;
        results.data.forEach(row => {
          const resource = databaserisorse.find(r => r.risorsa === row['risorsa']);
          if (resource) {
            resource.disponibile = row['disponibile'];
            updates++;
          }
        });

        saveToLocalStorage();
        uploadMessage.textContent = `${updates} disponibilità aggiornate correttamente.`;
        uploadMessage.classList.remove("error");
        uploadMessage.classList.add("success");
      } catch (error) {
        uploadMessage.textContent = "Errore durante l'elaborazione del file.";
        uploadMessage.classList.add("error");
      }
    },
    error: function () {
      uploadMessage.textContent = "Errore nel caricamento del file.";
      uploadMessage.classList.add("error");
    }
  });
}

// Funzione per aggiornare disponibilità singola risorsa
function updateAvailability() {
  const codeInput = document.getElementById('updateCode');
  const message = document.getElementById('updateMessage');

  const code = codeInput.value.trim().toUpperCase();

  if (!code || code.length !== 4) {
    message.innerText = '⚠️ Inserisci un codice valido di 4 caratteri.';
    message.classList.add("error");
    return;
  }

  if (!databaserisorse || databaserisorse.length === 0) {
    message.innerText = '⚠️ Devi prima caricare il file delle risorse!';
    message.classList.add("error");
    return;
  }

  const resource = databaserisorse.find(r => (r.risorsa || '').trim().toUpperCase() === code);

  if (resource) {
    resource.disponibile = new Date().toISOString().split('T')[0]; // Inserisce la data odierna
    saveToLocalStorage();
    message.innerText = `✅ La risorsa ${code} è stata aggiornata con la data odierna (${resource.disponibile}).`;
    message.classList.remove("error");
    message.classList.add("success");
    codeInput.value = '';
  } else {
    message.innerText = '❌ Risorsa non trovata.';
    message.classList.add("error");
  }
}

// Funzione per cercare risorse
function searchResources() {
  const searchDate = document.getElementById('searchDate').value;
  const searchSize = parseFloat(document.getElementById('searchSize').value);
  const resultsTable = document.getElementById('tabella-risultati').querySelector('tbody');

  if (!searchDate || isNaN(searchSize)) {
    alert("Compila entrambi i campi di ricerca!");
    return;
  }

  const filteredResults = databaserisorse.filter(item => {
    const itemDate = new Date(item.disponibile);
    const searchDateObj = new Date(searchDate);
    return item.dimensione >= searchSize && itemDate >= searchDateObj;
  });

  resultsTable.innerHTML = "";

  if (filteredResults.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 3;
    cell.textContent = "Nessun risultato trovato";
    row.appendChild(cell);
    resultsTable.appendChild(row);
  } else {
    filteredResults.forEach(result => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${result.risorsa}</td>
        <td>${result.dimensione}</td>
        <td>${new Date(result.disponibile).toLocaleDateString('it-IT')}</td>
      `;
      resultsTable.appendChild(row);
    });
  }
}
