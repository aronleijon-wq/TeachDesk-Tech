// Spreadsheet files for exports. Semicolons separate the columns, as Excel expects with
// Swedish settings, and a byte-order mark makes Excel read å, ä and ö correctly.

const SEPARATOR = ";";

const cell = (value: string | number) => {
  const text = String(value);
  return /[";\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/** The rows as CSV text, ready to save as a .csv file. */
export const toCsv = (rows: (string | number)[][]) =>
  "\uFEFF" + rows.map((row) => row.map(cell).join(SEPARATOR)).join("\r\n");
