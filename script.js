// Le tue funzioni esistenti dovrebbero essere qui

function updateAvailability() {
  const code = document.getElementById('updateCode').value.trim().toUpperCase();
  const updateMessage = document.getElementById('updateMessage');
  
  if (code.length !== 4) {
    updateMessage.textContent = "Inserisci un codice valido di 4 caratteri.";
    return;
  }
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString('it-IT');

  let found = false;

  if (Array.isArray(resources)) {
    for (let i = 0; i < resources.length; i++) {
      if (resources[i].risorsa && resources[i].risorsa.toUpperCase() === code) {
        resources[i].disponibile = formattedDate;
        found = true;
        break;
      }
    }
  }

  if (found) {
    updateMessage.textContent = `Disponibilità aggiornata per il codice ${code}.`;
  } else {
    updateMessage.textContent = `Codice ${code} non trovato.`;
  }
}
