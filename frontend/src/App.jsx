import React, { useState } from "react";

/**
 * DataInputForm
 * Props:
 * - onDataSubmit(parsedData: number[][], meta?: object) => void
 * - allowHeader (boolean) : whether CSV can have header row (default true)
 *
 * Behavior:
 * - Accepts manual input in textarea (one x,y per line OR two columns separated by whitespace/tab/comma)
 * - Accepts CSV file upload (.csv)
 * - Basic validation: numeric x and y for each row
 * - Returns parsed array of pairs via onDataSubmit or shows errors
 *
 * Note: For very large CSVs or complex CSV edge cases, consider using PapaParse on the frontend.
 */

export default function DataInputForm({ onDataSubmit, allowHeader = true }) {
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [filename, setFilename] = useState("");

  // Utility: parse a single line into [x, y] or returns null
  function parseLineToPair(line) {
    if (!line) return null;
    // allow comma, tab, semicolon, or whitespace separators
    const parts = line
      .trim()
      .split(/[\s,;]+/)
      .filter(Boolean);
    if (parts.length < 2) return null;
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (Number.isFinite(x) && Number.isFinite(y)) return [x, y];
    return null;
  }

  // Parse manual textarea input
  function parseTextInput(rawText) {
    setError(null);
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // optionally detect header row (non-numeric first token)
    let startIndex = 0;
    if (allowHeader && lines.length > 0) {
      const firstTokens = lines[0].split(/[\s,;]+/).filter(Boolean);
      const maybeX = Number(firstTokens[0]);
      const maybeY = Number(firstTokens[1]);
      if (!Number.isFinite(maybeX) || !Number.isFinite(maybeY)) {
        startIndex = 1; // skip header
      }
    }

    const parsed = [];
    const badLines = [];
    lines.forEach((line, idx) => {
      if (idx < startIndex) return;
      const pair = parseLineToPair(line);
      if (pair) parsed.push(pair);
      else badLines.push({ idx: idx + 1, text: line });
    });

    return { parsed, badLines };
  }

  // Handle Analyze button (manual)
  function handleAnalyze(e) {
    e.preventDefault();
    setError(null);
    const { parsed, badLines } = parseTextInput(text);
    if (parsed.length === 0) {
      setError(
        "No valid numeric (x,y) pairs found. Please check the input format.",
      );
      setPreviewRows([]);
      return;
    }
    if (badLines.length > 0) {
      setError(
        `Some lines couldn't be parsed as numeric pairs. Example: line ${badLines[0].idx} -> "${badLines[0].text}".`,
      );
      setPreviewRows(parsed.slice(0, 10));
      return;
    }
    setPreviewRows(parsed.slice(0, 10));
    onDataSubmit(parsed, { source: "manual", rows: parsed.length });
  }

  // Handle CSV file input
  function handleFileChange(ev) {
    setError(null);
    setPreviewRows([]);
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    setFilename(file.name);

    // Read file as text
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      // Simple CSV parsing (handles common separators). For complex CSVs use PapaParse.
      const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      // detect header
      let startIndex = 0;
      if (allowHeader && lines.length > 0) {
        const firstTokens = lines[0].split(/[\s,;]+/).filter(Boolean);
        const maybeX = Number(firstTokens[0]);
        const maybeY = Number(firstTokens[1]);
        if (!Number.isFinite(maybeX) || !Number.isFinite(maybeY))
          startIndex = 1;
      }

      const parsed = [];
      const badLines = [];
      lines.forEach((line, idx) => {
        if (idx < startIndex) return;
        const pair = parseLineToPair(line.replace(/"/g, ""));
        if (pair) parsed.push(pair);
        else badLines.push({ idx: idx + 1, text: line });
      });

      if (parsed.length === 0) {
        setError(
          "CSV parsed no numeric rows. Ensure it has two numeric columns.",
        );
        return;
      }
      if (badLines.length > 0) {
        setError(
          `CSV parsed ${parsed.length} rows but ${badLines.length} rows failed. First bad line: ${badLines[0].idx}.`,
        );
        setPreviewRows(parsed.slice(0, 10));
        // still allow submission if you want; here we stop until user fixes file
        return;
      }

      setPreviewRows(parsed.slice(0, 10));
      onDataSubmit(parsed, {
        source: "csv",
        filename: file.name,
        rows: parsed.length,
      });
    };

    reader.onerror = () => {
      setError("Unable to read the file. Please try again.");
      setFilename("");
    };

    reader.readAsText(file);
  }

  // convenience: load sample dataset
  function loadSample(type = "linear") {
    if (type === "linear") {
      const sample = "0,0\n1,2\n2,4\n3,6\n4,8";
      setText(sample);
    } else if (type === "quadratic") {
      const sample = "0,0\n1,4.9\n2,19.6\n3,44.1";
      setText(sample);
    } else if (type === "exponential") {
      const sample = "0,2\n1,3\n2,4.5\n3,6.75\n4,10.125";
      setText(sample);
    }
    setError(null);
    setPreviewRows([]);
  }

  function handleClear() {
    setText("");
    setError(null);
    setPreviewRows([]);
    setFilename("");
  }

  return (
    <section className="max-w-3xl mx-auto p-4 backdrop-blur-sm ">
      <h3 className="text-lg font-semibold mb-2">Enter experimental data</h3>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        {/* Left: Manual input */}
        <div className="backdrop-blur-sm p-4 rounded shadow">
          <label className="block text-sm font-medium mb-2">
            Paste data (one x,y per line)
          </label>
          <textarea
            aria-label="data-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Example:\n0,0\n1,2\n2,4\n3,6"}
            rows={10}
            className="w-full border rounded p-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleAnalyze}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Analyze
            </button>

            <button
              type="button"
              onClick={() => loadSample("linear")}
              className="bg-gray-100 px-3 py-2 rounded border"
            >
              Load Linear Sample
            </button>

            <button
              type="button"
              onClick={() => loadSample("quadratic")}
              className="bg-gray-100 px-3 py-2 rounded border"
            >
              Load Quadratic Sample
            </button>

            <button
              type="button"
              onClick={() => loadSample("exponential")}
              className="bg-gray-100 px-3 py-2 rounded border"
            >
              Load Exponential Sample
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="ml-auto bg-red-100 px-3 py-2 rounded border text-red-700"
            >
              Clear
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            You may paste CSV rows, or upload a CSV file on the right. Headers
            are allowed and will be ignored.
          </p>
        </div>

        {/* Right: CSV upload & preview */}
        <div className="bg-white p-4 rounded shadow">
          <label className="block text-sm font-medium mb-2">
            Or upload CSV file
          </label>
          <input
            aria-label="csv-upload"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 file:border file:rounded file:px-3 file:py-2 file:bg-gray-100 file:text-gray-700"
          />
          {filename && (
            <p className="mt-2 text-sm text-gray-600">Selected: {filename}</p>
          )}

          <div className="mt-4">
            <h4 className="font-medium mb-2">Preview (first 10 rows)</h4>
            {previewRows.length === 0 ? (
              <p className="text-sm text-gray-500">No preview available yet.</p>
            ) : (
              <div className="overflow-auto max-h-48 border rounded">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1">#</th>
                      <th className="px-2 py-1">x</th>
                      <th className="px-2 py-1">y</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="odd:bg-white even:bg-gray-50">
                        <td className="px-2 py-1 align-top">{i + 1}</td>
                        <td className="px-2 py-1">{row[0]}</td>
                        <td className="px-2 py-1">{row[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-600">Error: {error}</p>}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <strong>Notes:</strong> The parser accepts comma, whitespace or
        semicolon separators. For complex CSVs (quoted fields, different
        separators, very large files) consider using a CSV library on the
        frontend (e.g., PapaParse) for robust parsing.
      </div>
    </section>
  );
}
