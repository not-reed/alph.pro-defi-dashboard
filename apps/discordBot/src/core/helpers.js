//This will be used to display big number in metric Term
var ranges = [
  { divider: 1e18, suffix: "E" },
  { divider: 1e15, suffix: "P" },
  { divider: 1e12, suffix: "T" },
  { divider: 1e9, suffix: "G" },
  { divider: 1e6, suffix: "M" },
  { divider: 1e3, suffix: "K" },
];

//Function to return big number in metric prefix
async function formatNumber(n) {
  n = Number(n);
  let hasDecimals;
  if (n < 0) {
    return "-" + formatNumber(-n);
  }
  for (var i = 0; i < ranges.length; i++) {
    if (n >= ranges[i].divider) {
      //Don't do to fixed if no decimals
      hasDecimals = n - parseInt(n);
      if (hasDecimals < 0.001) {
        return (n / ranges[i].divider).toFixed(2) + ranges[i].suffix;
      } else return (n / ranges[i].divider).toFixed(2) + ranges[i].suffix;
    }
  }
  return n.toFixed(2);
}

//Format the number in comma (US standard), and do some other formatting, just for display purpose
async function commaFormat(rawNumber) {
  //If raw is 0 then just return it
  if (rawNumber == 0 || rawNumber == null) {
    return rawNumber;
  }
  //Convert the rawNumber to string
  rawNumber = rawNumber.toString();
  //Check if number is Exponential number
  if (rawNumber.indexOf("e") > 0) {
    //This is exponential number, convert it to string value
    rawNumber = ("" + +rawNumber).replace(
      /(-?)(\d*)\.?(\d*)e([+-]\d+)/,
      function (a, b, c, d, e) {
        return e < 0
          ? b + "0." + Array(1 - e - c.length).join(0) + c + d
          : b + c + d + Array(e - d.length + 1).join(0);
      }
    );
  }

  //Just get the fix (whole) number
  let justInt = parseInt(rawNumber);
  let justDecimals;
  if (justInt < 1) {
    //If no integer then need to check just decimals
    //This one just displays the 3 digits after the number
    //If 0.0000049328239232 >> just shows, 0.00000493
    return (justDecimals = (rawNumber - justInt)
      .toFixed(20)
      .match(/^-?\d*\.?0*\d{0,3}/)[0]);
  } else {
    //If Integer is more than 1000, we show in numeric
    if (justInt > 999) {
      rawNumber = await formatNumber(rawNumber);

      return rawNumber;
    } else {
      //If more than 1 then, just show 2 decimals
      justDecimals = (rawNumber - justInt).toFixed(2);
      //If the decimals is 0.99 then it rounds to 1, so we need figure that out and add that one to just int
      if (parseInt(justDecimals) >= 1) {
        justInt = justInt + 1;
        justDecimals = 0;
      }
    }
    //Check if there are even any decimals, if rawNumber was whole number
  }
  //format with comma (it will be string)
  justInt = justInt.toLocaleString();
  if (justDecimals > 0.001) {
    //We will be using only two digits on decimal if there is int value, if too small decimal, no need to add to int
    //Check if there are even any decimals, if rawNumber was whole number
    justDecimals = justDecimals.replace(/\.?0+$/, "");
    justDecimals = justDecimals.split(".");
    rawNumber = justInt + "." + justDecimals[1];
  } else {
    rawNumber = justInt;
  }
  //See if the value is more than 1K, 100K, 1
  return rawNumber;
}

async function eighteenDigits(numberWith18Digits){
  return numberWith18Digits/10**18
}

//Returns all the functions
module.exports = {
  commaFormat: commaFormat,
  eighteenDigits:eighteenDigits
};
