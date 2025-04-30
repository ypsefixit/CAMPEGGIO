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

// Funzione per salvare il database in localStorage
function saveToLocalStorage() {
  localStorage.setItem("databaserisorse", JSON.stringify(databaserisorse));
}

// Funzione per caricare il database da localStorage
function loadFromLocalStorage() {
  const savedData = localStorage.getItem("databaserisorse");
  return savedData ? JSON.parse(savedData) : null;
}

// Funzione per caricare le risorse automaticamente all'avvio
function loadResourcesOnStartup() {
  const uploadResourcesMessage = document.getElementById('uploadResourcesMessage');
  databaserisorse = loadFromLocalStorage();

  if (databaserisorse) {
    uploadResourcesMessage.textContent = "Database risorse caricato correttamente dal salvataggio locale!";
    uploadResourcesMessage.style.color = "green";
    console.log("Database risorse caricato da localStorage:", databaserisorse);
  } else {
    fetch('risorse.csv')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Errore nel caricamento del file risorse.csv: ${response.statusText}`);
        }
        return response.text();
      })
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: function (results) {
            databaserisorse = results.data.map(row => ({
              risorsa: extractNumericPart(row['risorsa']),
              dimensione: parseFloat(row['dimensione']) || 0,
              disponibile: row['disponibile'] || getFormattedDate()
            }));

            if (databaserisorse.length > 0) {
              saveToLocalStorage();
              uploadResourcesMessage.textContent = "Database risorse caricato correttamente all'avvio!";
              uploadResourcesMessage.style.color = "green";
              console.log("Database risorse caricato correttamente all'avvio:", databaserisorse);
            } else {
              throw new Error("Il file risorse.csv è vuoto o non valido.");
            }
          },
          error: function () {
            throw new Error("Errore nella lettura del file risorse.csv.");
          }
        });
      })
      .catch(error => {
        console.error(error.message);
        uploadResourcesMessage.textContent = error.message;
        uploadResourcesMessage.style.color = "red";
      });
  }
}

// Funzione per estrarre la parte numerica di una risorsa e convertirla in 3 caratteri
function extractNumericPart(risorsa) {
  const numericPart = risorsa.replace(/\D/g, ''); // Rimuove tutti i caratteri non numerici
  return numericPart.padStart(3, '0'); // Assicura che sia di 3 caratteri, aggiungendo zeri iniziali se necessario
}

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
      databaserisorse = results.data.map(row => ({
        risorsa: extractNumericPart(row['risorsa']),
        dimensione: parseFloat(row['dimensione']) || 0,
        disponibile: row['disponibile'] || getFormattedDate()
      }));

      if (databaserisorse.length > 0) {
        saveToLocalStorage();
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

// Funzione per ottenere la data corrente formattata (YYYY-MM-DD)
function getFormattedDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
