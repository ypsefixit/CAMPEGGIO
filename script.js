// Inizializza il database delle risorse
let databaserisorse = [];

// Gestione degli accordion
document.addEventListener("DOMContentLoaded", function () {
  const accordionButtons = document.querySelectorAll(".accordion-button");

  accordionButtons.forEach(button => {
    button.addEventListener("click", function () {
      const accordionContent = this.nextElementSibling;

      // Chiude tutti gli altri accordion
      document.querySelectorAll(".accordion-content").forEach(content => {
        if (content !== accordionContent) {
          content.style.maxHeight = null;
        }
      });

      // Aggiorna lo stato di espansione
      document.querySelectorAll(".accordion-button").forEach(btn => {
        if (btn !== this) {
          btn.setAttribute("aria-expanded", "false");
        }
      });

      // Alterna apertura/chiusura del contenuto
      if (accordionContent.style.maxHeight) {
        accordionContent.style.maxHeight = null;
        this.setAttribute("aria-expanded", "false");
      } else {
        accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
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