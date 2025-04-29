let databaserisorse = [];

function getFormattedDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = String(today.getFullYear()).slice(-2); // Anno a 2 cifre
  return `${day}/${month}/${year}`;
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // Formato YYYY-MM-DD
}

document.addEventListener("DOMContentLoaded", function () {
  const accordionButtons = document.querySelectorAll(".accordion-button");

  accordionButtons.forEach(button => {
    button.addEventListener("click", function () {
      const accordionContent = this.nextElementSibling;

      if (accordionContent.style.maxHeight) {
        accordionContent.style.maxHeight = null; // Chiudi
      } else {
        document.querySelectorAll(".accordion-content").forEach(content => {
          content.style.maxHeight = null;
        });

        accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
      }
    });
  });
});

window.onload = function () {
  const updateDateInput = document.getElementById('updateDate');
  if (updateDateInput) {
    updateDateInput.value = getTodayDate();
  }
};

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
    header: true, // Utilizza la prima riga come intestazione
    skipEmptyLines: true,
    complete: function (results) {
      databaserisorse = results.data.map(row => ({
        risorsa: String(row['Risorsa'] || '').trim(),
        dimensione: parseFloat(row['Dimensione']) || 0,
        disponibile: row['Disponibile'] || getFormattedDate()
      }));
      uploadResourcesMessage.textContent = "File risorse caricato correttamente!";
      uploadResourcesMessage.style.color = "green";
    },
    error: function () {
      uploadResourcesMessage.textContent = "Errore caricamento file.";
      uploadResourcesMessage.style.color = "red";
    }
  });
}

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
      const updates = results.data;

      updates.forEach(row => {
        const risorsa = String(row['Risorsa'] || '').trim();
        const disponibile = String(row['Disponibile'] || '').trim();
        const item = databaserisorse.find(r => r.risorsa === risorsa);

        if (item && disponibile) {
          item.disponibile = disponibile;
        }
      });

      uploadMessage.textContent = "File disponibilità caricato correttamente!";
      uploadMessage.style.color = "green";
    },
    error: function () {
      uploadMessage.textContent = "Errore caricamento file.";
      uploadMessage.style.color = "red";
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
  const dateInput = document.getElementById('updateDate');
  const message = document.getElementById('updateMessage');

  const code = codeInput.value.trim().toUpperCase();
  const selectedDate = dateInput.value;

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
    if (selectedDate) {
      const dateParts = selectedDate.split("-");
      resource.disponibile = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`; // Data in formato gg/mm/aaaa
    } else {
      resource.disponibile = getFormattedDate();
    }
    message.innerText = `✅ La risorsa ${code} è stata occupata con data (${resource.disponibile}).`;
    renderResources(databaserisorse);
    codeInput.value = '';
    dateInput.value = '';
  } else {
    message.innerText = '❌ Risorsa non trovata.';
  }
}