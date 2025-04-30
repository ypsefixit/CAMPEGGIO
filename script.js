document.addEventListener("DOMContentLoaded", function () {
  // Gestione accordion
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

// Funzione per caricare le risorse da un file selezionato
function uploadResources() {
  const fileInput = document.getElementById('resourcesFile');
  const file = fileInput.files[0];
  const uploadResourcesMessage = document.getElementById('uploadResourcesMessage');

  if (!file) {
    uploadResourcesMessage.textContent = "Nessun file selezionato.";
    uploadResourcesMessage.style.color = "red";
    return;
  }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      console.log("File caricato con successo:", results.data);

      // Popola databaserisorse con i dati dal file caricato
      databaserisorse = results.data.map(row => ({
        risorsa: String(row['risorsa'] || '').trim(),
        dimensione: parseFloat(row['dimensione']) || 0,
        disponibile: row['disponibile'] || getFormattedDate()
      }));

      // Feedback visivo
      if (databaserisorse.length > 0) {
        uploadResourcesMessage.textContent = "Database risorse caricato correttamente!";
        uploadResourcesMessage.style.color = "green";
        console.log("Database risorse:", databaserisorse);
      } else {
        uploadResourcesMessage.textContent = "Il file caricato è vuoto o non valido.";
        uploadResourcesMessage.style.color = "red";
      }
    },
    error: function () {
      uploadResourcesMessage.textContent = "Errore caricamento file.";
      uploadResourcesMessage.style.color = "red";
    }
  });
}

// Funzione per caricare le risorse automaticamente all'avvio
function loadResourcesOnStartup() {
  const uploadResourcesMessage = document.getElementById('uploadResourcesMessage');

  fetch('risorse.csv')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Errore nel caricamento del file risorse.csv: ${response.statusText}`);
      }
      return response.text();
    })
    .then(csvText => {
      Papa.parse(csvText, {
        header: true, // Usa la prima riga come intestazione
        skipEmptyLines: true,
        complete: function (results) {
          // Popola databaserisorse con i dati del file
          databaserisorse = results.data.map(row => ({
            risorsa: String(row['risorsa'] || '').trim(),
            dimensione: parseFloat(row['dimensione']) || 0,
            disponibile: row['disponibile'] || getFormattedDate()
          }));

          // Feedback visivo
          if (databaserisorse.length > 0) {
            console.log("Database risorse caricato correttamente all'avvio:", databaserisorse);
            if (uploadResourcesMessage) {
              uploadResourcesMessage.textContent = "Database risorse caricato correttamente all'avvio!";
              uploadResourcesMessage.style.color = "green";
            }
          } else {
            console.error("Il file risorse.csv è vuoto o non valido.");
            if (uploadResourcesMessage) {
              uploadResourcesMessage.textContent = "Il file risorse.csv è vuoto o non valido.";
              uploadResourcesMessage.style.color = "red";
            }
          }
        },
        error: function () {
          console.error("Errore nella lettura del file risorse.csv.");
          if (uploadResourcesMessage) {
            uploadResourcesMessage.textContent = "Errore nella lettura del file risorse.csv.";
            uploadResourcesMessage.style.color = "red";
          }
        }
      });
    })
    .catch(error => {
      console.error(error.message);
      if (uploadResourcesMessage) {
        uploadResourcesMessage.textContent = error.message;
        uploadResourcesMessage.style.color = "red";
      }
    });
}
// Funzione per ottenere la data corrente formattata (YYYY-MM-DD)
function getFormattedDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}



// Funzione per caricare la disponibilità
function uploadAvailability() {
  const fileInput = document.getElementById('availabilityFile');
  const file = fileInput.files[0];
  const uploadMessage = document.getElementById('uploadMessage');

  if (!file) {
    uploadMessage.textContent = "Nessun file selezionato.";
    uploadMessage.style.color = "red";
    return;
  }

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      const updatedResources = results.data;
      let updateCount = 0;

      updatedResources.forEach(row => {
        const risorsa = String(row['risorsa'] || '').trim();
        const disponibile = row['disponibile'] || '';

        // Cerca la risorsa nel databaserisorse e aggiorna il campo "disponibile"
        const resource = databaserisorse.find(item => item.risorsa === risorsa);
        if (resource) {
          resource.disponibile = disponibile;
          updateCount++;
        }
      });

      if (updateCount > 0) {
        uploadMessage.textContent = `${updateCount} risorse aggiornate correttamente.`;
        uploadMessage.style.color = "green";
        console.log("Risorse aggiornate:", databaserisorse);
      } else {
        uploadMessage.textContent = "Nessuna risorsa trovata per l'aggiornamento.";
        uploadMessage.style.color = "orange";
      }
    },
    error: function () {
      uploadMessage.textContent = "Errore caricamento file.";
      uploadMessage.style.color = "red";
    }
  });
}

// Funzione per aggiornare una risorsa
function updateAvailability() {
  const codeInput = document.getElementById('updateCode');
  const dateInput = document.getElementById('updateDate');
  const message = document.getElementById('updateMessage');

  const code = codeInput.value.trim().toUpperCase();
  const selectedDate = dateInput.value;

  if (!code || code.length !== 4) {
    message.innerText = '⚠️ Inserisci un codice valido di 4 caratteri.';
    message.style.color = "red";
    return;
  }

  // Cerca la risorsa nel databaserisorse
  const resource = databaserisorse.find(item => item.risorsa === code);

  if (resource) {
    // Aggiorna la data di disponibilità
    resource.disponibile = selectedDate || resource.disponibile;

    message.innerText = `✅ La risorsa ${code} è stata aggiornata con data (${selectedDate || "nessuna modifica alla data"}).`;
    message.style.color = "green";
    console.log(`Risorsa aggiornata:`, resource);
  } else {
    message.innerText = `⚠️ La risorsa ${code} non esiste nel database.`;
    message.style.color = "red";
  }

  codeInput.value = '';
  dateInput.value = '';
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

  // Simulazione di un database di risorse
  const database = [
    { risorsa: "C001", dimensione: 5, disponibile: "2025-05-01" },
    { risorsa: "C002", dimensione: 6.5, disponibile: "2025-04-30" },
    { risorsa: "C003", dimensione: 7, disponibile: "2025-05-05" }
  ];

  const filteredResults = database.filter(item => {
    const itemDate = new Date(item.disponibile);
    const searchDateObj = new Date(searchDate);
    return item.dimensione >= searchSize && itemDate >= searchDateObj;
  });

  // Pulisci la tabella dei risultati
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
      
      // Formattazione della data
      const dateObj = new Date(result.disponibile);
      const options = { weekday: 'short' }; // Giorno della settimana (3 lettere)
      const day = dateObj.getDate();
      const formattedDate = `${dateObj.toLocaleDateString('it-IT', options)} ${day}`;

      row.innerHTML = `
        <td>${result.risorsa}</td>
        <td>${result.dimensione}</td>
        <td>${formattedDate}</td>
      `;
      resultsTable.appendChild(row);
    });
  }
}
