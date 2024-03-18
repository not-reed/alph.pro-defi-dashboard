//This will be used to display big number in metric Term
const ranges = [
  { divider: 1e18, suffix: "E" },
  { divider: 1e15, suffix: "P" },
  { divider: 1e12, suffix: "T" },
  { divider: 1e9, suffix: "G" },
  { divider: 1e6, suffix: "M" },
  { divider: 1e3, suffix: "K" },
];

//Function to return big number in metric prefix
function formatNumber(inputNumber) {
  const number = Number(inputNumber);
  if (number < 0) {
    return `-${formatNumber(-number)}`;
  }
  for (let i = 0; i < ranges.length; i++) {
    if (number >= ranges[i].divider) {
      const hasDecimals = number - number.parseInt;
      if (hasDecimals < 0.001) {
        return `${(number / ranges[i].divider).toFixed(2)}${ranges[i].suffix}`;
      }
      return `${(number / ranges[i].divider).toFixed(2)}${ranges[i].suffix}`;
    }
  }
  return number.toFixed(2);
}

//Format the number in comma (US standard), and do some other formatting, just for display purpose
function commaFormat(rawNumber) {
  // Return the number if it's 0 or null
  if (rawNumber === 0 || rawNumber == null) {
    return rawNumber;
  }

  let processedNumber = rawNumber;

  // Convert exponential numbers to a decimal string
  if (String(processedNumber).indexOf("e") > 0) {
    processedNumber = Number(processedNumber).toFixed(20);
  }

  // Format large numbers with metric prefixes
  if (Math.abs(processedNumber) >= 1000) {
    return formatNumber(processedNumber);
  }

  // Separate the integer and decimal parts
  let [integerPart, decimalPart] = processedNumber.toString().split(".");

  // Add commas to the integer part
  integerPart = Number.parseInt(integerPart, 10).toLocaleString();

  // Handle the decimal part
  if (decimalPart) {
    // Limit the decimal part to 2 digits for non-zero integer part
    decimalPart = Number.parseFloat(`0.${decimalPart}`)
      .toFixed(2)
      .split(".")[1];
  }

  // Reconstruct the number
  return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
}

// You can keep the formatNumber function as is, and it will be called for numbers >= 1000

async function eighteenDigits(numberWith18Digits) {
  return numberWith18Digits / 10 ** 18;
}

//Returns all the functions
module.exports = {
  commaFormat: commaFormat,
  eighteenDigits: eighteenDigits,
};
