/**
 * Formata uma data em DD/MM/YYYY de maneira segura.
 * @param {string | number | Date} dateValue
 * @returns {string | null} data formatada ou null se inválida
 */
function formatDateToDDMMYYYY(dateValue) {
  const date = new Date(dateValue);

  if (isNaN(date.getTime())) {
    return null;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

module.exports = {
  formatDateToDDMMYYYY,
};