document.addEventListener('DOMContentLoaded', function () {
  const accordionButtons = document.querySelectorAll('.accordion-button');

  accordionButtons.forEach(button => {
    button.addEventListener('click', function () {
      const content = this.nextElementSibling;

      // Chiude gli altri accordion
      document.querySelectorAll('.accordion-content').forEach(c => {
        if (c !== content) {
          c.style.maxHeight = null;
          c.previousElementSibling.classList.remove('active');
        }
      });

      // Toggle apertura/chiusura del corrente
      if (content.style.maxHeight) {
        content.style.maxHeight = null;
        this.classList.remove('active');
      } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        this.classList.add('active');
      }
    });
  });
});