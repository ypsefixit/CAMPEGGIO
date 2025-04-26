
let databaseRisorse = [];

document.addEventListener("DOMContentLoaded", () => {
  const oggi = new Date().toISOString().split("T")[0];
  document.getElementById("dataRicerca").value = oggi;

  const dimensioneSelect = document.getElementById("dimensioneRicerca");
  for (let i = 5; i <= 9; i += 0.5) {
    const opt = document.createElement("option");
    opt.value = i.toFixed(1);
    opt.text = i.toFixed(1);
    dimensioneSelect.appendChild(opt);
  }

  fetch("risorse.xlsx")
    .then(res => res.arrayBuffer())
    .then(buffer => processExcelRisorse(buffer));

  document.getElementById("caricaDisponibilitaBtn").addEventListener("click", () => {
    const fileInput = document.getElementById("fileDisponibilita");
    const file = fileInput.files[0];
    const msg = document.getElementById("messaggioDisponibilita");
    if (!file) return msg.textContent = "Nessun file selezionato.";

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const disponibilita = XLSX.utils.sheet_to_json(sheet);
        disponibilita.forEach(item => {
          const riga = databaseRisorse.find(r => r.risorsa === item.risorsa);
          if (riga) riga.disponibile = item.disponibile;
        });
        msg.textContent = "File caricato correttamente.";
      } catch {
        msg.textContent = "Errore durante il caricamento.";
      }
    };
    reader.readAsArrayBuffer(file);
  });

  document.getElementById("caricaRisorseBtn").addEventListener("click", () => {
    const fileInput = document.getElementById("fileRisorse");
    const file = fileInput.files[0];
    const msg = document.getElementById("messaggioRisorse");
    if (!file) return msg.textContent = "Nessun file selezionato.";

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        processExcelRisorse(data);
        msg.textContent = "File caricato correttamente.";
      } catch {
        msg.textContent = "Errore durante il caricamento.";
      }
    };
    reader.readAsArrayBuffer(file);
  });

  document.getElementById("cercaBtn").addEventListener("click", () => {
    const dataInput = document.getElementById("dataRicerca").value;
    const dimInput = parseFloat(document.getElementById("dimensioneRicerca").value);
    const risultati = databaseRisorse.filter(r => {
      const d = r.disponibile.split("/").reverse().join("-");
      return parseFloat(r.dimensione) >= dimInput && d >= dataInput;
    }).sort((a, b) => {
      const da = a.disponibile.split("/").reverse().join("-");
      const db = b.disponibile.split("/").reverse().join("-");
      return da.localeCompare(db) || parseFloat(a.dimensione) - parseFloat(b.dimensione) || a.risorsa.localeCompare(b.risorsa);
    });

    const container = document.getElementById("risultatiContainer");
    if (!risultati.length) return container.innerHTML = "<p>Nessun risultato trovato.</p>";
    let html = "<table><tr><th>Risorsa</th><th>Dimensione</th><th>Disponibile</th></tr>";
    risultati.forEach(r => {
      html += `<tr><td>${r.risorsa}</td><td>${r.dimensione}</td><td>${r.disponibile}</td></tr>`;
    });
    html += "</table>";
    container.innerHTML = html;
  });
});

function processExcelRisorse(data) {
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const righe = XLSX.utils.sheet_to_json(sheet);
  const oggi = new Date().toLocaleDateString("it-IT");
  databaseRisorse = righe.map(r => ({
    risorsa: r.risorsa,
    dimensione: parseFloat(r.dimensione).toFixed(2),
    disponibile: r.disponibile ? r.disponibile : oggi
  }));
}
