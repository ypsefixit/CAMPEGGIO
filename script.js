
function formattaDataExcel(dataExcel) {
    if (!dataExcel) return '';
    const data = new Date(dataExcel);
    if (isNaN(data.getTime())) return ''; // Non è una data valida
    const giorno = String(data.getDate()).padStart(2, '0');
    const mese = String(data.getMonth() + 1).padStart(2, '0');
    const anno = String(data.getFullYear()).slice(2);
    return `${giorno}/${mese}/${anno}`;
}

function uploadDisponibilita() {
    const fileInput = document.getElementById('fileInput');
    const output = document.getElementById('output');

    if (!fileInput.files.length) {
        alert('Seleziona un file Excel prima di procedere.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const dati = XLSX.utils.sheet_to_json(sheet, { raw: false });

        const datiFormattati = dati.map(riga => {
            if (riga.dataDisponibile) {
                riga.dataDisponibile = formattaDataExcel(riga.dataDisponibile);
            } else {
                console.warn('Attenzione: Riga senza dataDisponibile:', riga);
            }
            return riga;
        });

        output.textContent = JSON.stringify(datiFormattati, null, 2);
    };
    reader.readAsBinaryString(fileInput.files[0]);
}
