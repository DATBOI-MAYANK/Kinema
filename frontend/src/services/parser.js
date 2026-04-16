import Papa from "papaparse";

export function parseTextInputWithValidation(textInput, mode = "pairs") {
  const result = Papa.parse(textInput, {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const validPairs = [];
  const badLines = [];

  result.data.forEach((row, index) => {
    // If Papa parsed with header:true, rows may be objects; convert to values
    const values = Array.isArray(row) ? row : Object.values(row);
    const x = values[0];
    const y = values[1];

    if (mode === "pairs") {
      if (Number.isFinite(x) && Number.isFinite(y)) {
        validPairs.push([x, y]);
      } else {
        badLines.push({
          rowNumber: index + 1,
          rowData: row,
          reason: "Invalid x,y pairs",
        });
      }
    } else if (mode === "x-only") {
      if (Number.isFinite(x)) {
        validPairs.push([x, null]); // Y will be predicted later
      } else {
        badLines.push({
          rowNumber: index + 1,
          rowData: row,
          reason: "Invalid x value",
        });
      }
    }
  });

  return {
    totalRows: result.data.length,
    validRows: validPairs.length,
    rejectedRows: badLines.length,
    validPairs,
    badLines,
    parseErrors: result.errors,
  };
}
