const STATUSES = [
  "Потрібно докупити ❗️",
  "Продукту менше половини ⚠",
  "Продукт не потребує поповнення ✅",
  "Майже заповнено ✅",
];

const devicePattern = ({ name, productName, currentWeight, maxWeight }) => {
  const statusCoeff = parseInt((currentWeight / maxWeight) * 100);
  let status = STATUSES[0];

  if (statusCoeff > 25) status = STATUSES[1];
  if (statusCoeff > 50) status = STATUSES[2];
  if (statusCoeff > 80) status = STATUSES[3];

  return (
    `📁 Назва полички: ${name}\n` +
    `Назва продукту: ${productName}\n` +
    `Наявність: ${currentWeight} / ${maxWeight}\n` +
    `Статус: ${status}`
  );
};

module.exports.devicePattern = devicePattern;
