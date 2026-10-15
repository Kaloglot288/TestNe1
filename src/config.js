const path = require("node:path");
require("dotenv").config();

function getConfig() {
  const inputFile = process.env.INPUT_FILE;
  const outputFile = process.env.OUTPUT_FILE;
  const filterColumn = process.env.FILTER_COLUMN;
  const filterValue = process.env.FILTER_VALUE;
  const delimiter = process.env.CSV_DELIMITER || ",";

  if (!inputFile || !outputFile || !filterColumn || filterValue === undefined) {
    throw new Error(
      "Укажите INPUT_FILE, OUTPUT_FILE, FILTER_COLUMN и FILTER_VALUE в .env"
    );
  }

  if (delimiter.length !== 1) {
    throw new Error("CSV_DELIMITER должен быть одним символом");
  }

  return {
    inputFile: path.resolve(inputFile),
    outputFile: path.resolve(outputFile),
    filterColumn,
    filterValue,
    delimiter,
  };
}

module.exports = { getConfig };
