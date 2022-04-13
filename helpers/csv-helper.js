const CSV_WRITER = require("csv-writer");

/**
 * Export array of data to file with path
 * @param {array} data array of data
 * @param {array} headers header of csv file
 * @param {string} path path to file
 */
const exportDataToCsv = async (data, headers, path = "data.csv") => {
  const writer = CSV_WRITER.createObjectCsvWriter({
    path,
    header: [...headers],
  });
  await writer.writeRecords(data);
};

module.exports = {
  exportDataToCsv,
};
