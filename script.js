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
        this.setAttribute("aria-expanded", "false");
      } else {
        document.querySelectorAll(".accordion-content").forEach(content => {
          content.style.maxHeight = null; // Chiude gli altri
        });
        document.querySelectorAll(".accordion-button").forEach(btn => {
          btn.setAttribute("aria-expanded", "false");
        });
        accordionContent.style.maxHeight = accordionContent.scrollHeight + "px"; // Apre il contenuto
        this.setAttribute("aria-expanded", "true");
      }
    });
  });

  // Carica le risorse all'avvio
  loadResourcesOnStartup();
});

// Funzione per salvare il database in localStorage
function saveToLocalStorage() {
  localStorage.setItem("databaserisorse", JSON.stringify(databaserisorse));
}

// Funzione per caricare il database da localStorage
function loadFromLocalStorage() {
  const savedData = localStorage.getItem("databaserisorse");
  return savedData ? JSON.parse(savedData) : null;
}

// Caricamento iniziale delle risorse
function loadResourcesOnStartup() {
  const uploadResourcesMessage = document.getElementById('uploadResourcesMessage');
  databaserisorse = loadFromLocalStorage();

  if (databaserisorse) {
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
      databaserisorse = results.data.map(row => ({
        risorsa: row['risorsa'] || '',
        dimensione: parseFloat(row['dimensione']) || 0,
        disponibile: row['disponibile'] || new Date().toISOString().split('T')[0]
      }));

      saveToLocalStorage();
      uploadResourcesMessage.textContent = "Database risorse caricato correttamente!";
      uploadResourcesMessage.classList.add("success");
    },
    error: function () {
      uploadResourcesMessage.textContent = "Errore nel caricamento del file.";
      uploadResourcesMessage.classList.add("error");
    }
  });
}

// Funzione per aggiornare disponibilità
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
      uploadMessage.classList.add("success");
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
    return;
  }

  if (!databaserisorse || databaserisorse.length === 0) {
    message.innerText = '⚠️ Devi prima caricare il file delle risorse!';
    return;
  }

  const resource = databaserisorse.find(r => {
    const resCode = (r.risorsa || '').trim().toUpperCase();
    return resCode === code;
  });

  if (resource) {
    resource.disponibile = new Date().toISOString().split('T')[0]; // Data odierna
    message.innerText = `✅ La risorsa ${code} è stata aggiornata oggi (${resource.disponibile}).`;
    saveToLocalStorage();
    codeInput.value = '';
  } else {
    message.innerText = '❌ Risorsa non trovata.';
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