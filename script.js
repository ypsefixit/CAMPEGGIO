
let databaseRisorse = [];

async function caricaRisorseIniziali() {
  const file = await fetch('risorse.xlsx');
  const blob = await file.blob();
  const data = await blob.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet, {header: ["risorsa", "dimensione", "disponibile"], range: 1});

  const today = new Date();
  const todayFormatted = today.toLocaleDateString('it-IT');

  databaseRisorse = json.map(r => ({
    risorsa: r.risorsa,
    dimensione: parseFloat(r.dimensione).toFixed(2),
    disponibile: todayFormatted
  }));
}

function popolaDimensioni() {
  const select = document.getElementById('dimensioneRicerca');
  for (let i = 5; i <= 9; i += 0.5) {
    const option = document.createElement('option');
    option.value = i.toFixed(1);
    option.textContent = i.toFixed(1);
    select.appendChild(option);
  }
}

document.getElementById('fileDisponibilita').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, {type: 'array'});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const disponibilita = XLSX.utils.sheet_to_json(sheet, {header: ["risorsa", "disponibile"], range: 1});

    disponibilita.forEach(d => {
      const risorsaDaAggiornare = databaseRisorse.find(r => r.risorsa === d.risorsa);
      if (risorsaDaAggiornare) {
        risorsaDaAggiornare.disponibile = d.disponibile;
      }
    });
  };
  reader.readAsArrayBuffer(file);
});

document.getElementById('cercaBtn').addEventListener('click', function() {
  const dataSelezionata = new Date(document.getElementById('dataRicerca').value);
  const dimensioneSelezionata = parseFloat(document.getElementById('dimensioneRicerca').value);

  const risultati = databaseRisorse.filter(r => {
    const dataRisorsa = new Date(r.disponibile.split('/').reverse().join('-'));
    return dataRisorsa >= dataSelezionata && parseFloat(r.dimensione) >= dimensioneSelezionata;
  });

  risultati.sort((a, b) => {
    const dataA = new Date(a.disponibile.split('/').reverse().join('-'));
    const dataB = new Date(b.disponibile.split('/').reverse().join('-'));
    if (dataA - dataB !== 0) return dataA - dataB;
    if (parseFloat(a.dimensione) - parseFloat(b.dimensione) !== 0) return parseFloat(a.dimensione) - parseFloat(b.dimensione);
    return a.risorsa.localeCompare(b.risorsa);
  });

  mostraRisultati(risultati);
});

function mostraRisultati(risultati) {
  const container = document.getElementById('risultatiContainer');
  container.innerHTML = "";

  const table = document.createElement('table');
  table.className = 'table table-bordered';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Risorsa</th>
        <th>Dimensione</th>
        <th>Disponibile</th>
      </tr>
    </thead>
    <tbody>
      ${risultati.map(r => `
        <tr>
          <td>${r.risorsa}</td>
          <td>${r.dimensione}</td>
          <td>${r.disponibile}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  container.appendChild(table);
}

window.onload = async () => {
  await caricaRisorseIniziali();
  popolaDimensioni();
  document.getElementById('dataRicerca').valueAsDate = new Date();
};

document.getElementById('fileRisorse').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, {type: 'array'});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, {header: ["risorsa", "dimensione", "disponibile"], range: 1});
    const today = new Date();
    const todayFormatted = today.toLocaleDateString('it-IT');

    databaseRisorse = json.map(r => ({
      risorsa: r.risorsa,
      dimensione: parseFloat(r.dimensione).toFixed(2),
      disponibile: todayFormatted
    }));

    alert('Risorse aggiornate con successo!');
  };
  reader.readAsArrayBuffer(file);
});
