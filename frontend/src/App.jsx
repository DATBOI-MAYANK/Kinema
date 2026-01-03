import React, { useState } from "react";
import Papa from "papaparse";

export default function DataInputForm({ onDataSubmit, allowHeader = true }) {
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [filename, setFilename] = useState("");
  const [analyzedData, setAnalyzedData] = useState(null);

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

  function parseTextInputWithValidation(text) {
    const result = Papa.parse(text, {
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    const validPairs = [];
    const badLines = [];

    result.data.forEach((row, index) => {
      if (index === 0 && typeof row[0] === "string") return;

      const x = row[0];
      const y = row[1];

      if (Number.isFinite(x) && Number.isFinite(y)) {
        validPairs.push([x, y]);
      } else {
        badLines.push({
          rowNumber: index + 1,
          rowData: row,
          reason: "Non-numeric or missing value",
        });
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

  function handleAnalyze(e) {
    e.preventDefault();
    setError(null);
    const { result } = parseTextInputWithValidation(text);

    if (result.parseErrors && result.parseErrors.length > 0) {
      setError("Input format error. Please check the data format.");
      return;
    }

    if (!result.validPairs || result.validPairs.length < 2) {
      setError("At least two valid data points are required for analysis.");
      return;
    }

    setAnalyzedData({
      data: result.validPairs,
      stats: {
        total: result.totalRows,
        valid: result.validRows,
        rejected: result.rejectedRows,
      },
      badLines: result.badLines,
    });
  }

  function handleFileChange(event) {
    setError(null);

    const file = event.target.files?.[0];
    if (!file) return;

    // Basic file check
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a valid CSV file.");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,

      complete: function (results) {
        const validPairs = [];
        const badLines = [];

        results.data.forEach((row, index) => {
          // Automatically takes first two columns
          const values = Object.values(row);
          const x = values[0];
          const y = values[1];

          if (Number.isFinite(x) && Number.isFinite(y)) {
            validPairs.push([x, y]);
          } else {
            badLines.push({
              rowNumber: index + 2, // +2 because header + 1-based index
              rowData: row,
              reason: "Invalid or non-numeric value",
            });
          }
        });

        // Handle CSV format errors
        if (results.errors && results.errors.length > 0) {
          setError("CSV format error. Please check the file structure.");
          return;
        }

        // Scientific minimum requirement
        if (validPairs.length < 2) {
          setError("At least two valid data points are required for analysis.");
          return;
        }

        // Store analysis-ready data
        setAnalyzedData({
          data: validPairs,
          stats: {
            total: results.data.length,
            valid: validPairs.length,
            rejected: badLines.length,
          },
          badLines,
          source: "csv",
          fileName: file.name,
        });
      },
    });
  }

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
    <section className="Hero max-w-3xl mx-auto mt-4 p-4 backdrop-blur-sm ">
      <h3 className="text-2xl font-semibold mb-2">Enter experimental data</h3>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        {/* Left: Manual input */}
        <div className="backdrop-blur-sm p-4 rounded shadow">
          <label className="block text-lg font-medium mb-2 text-white">
            Paste data (one x,y per line)
          </label>
          <textarea
            aria-label="data-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Example:\n0,0\n1,2\n2,4\n3,6"}
            rows={10}
            className="bg-slate-900 text-slate-300 w-full border rounded p-2 resize-y  focus:outline-none focus:ring-2 focus:ring-blue-400"
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
        <div className="bg-slate-950 p-4 rounded shadow">
          <label className="block text-sm text-slate-300 font-medium mb-2">
            Or upload CSV file
          </label>
          <input
            aria-label="csv-upload"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-400  file:border file:rounded file:px-3 file:py-2 file:bg-gray-100 file:text-gray-700"
          />
          {filename && (
            <p className="mt-2 text-sm text-slate-300">Selected: {filename}</p>
          )}

          <div className="mt-4">
            <h4 className="font-medium text-slate-300 mb-2">
              Preview (first 10 rows)
            </h4>
            {previewRows.length === 0 ? (
              <p className="text-sm text-slate-300">
                No preview available yet.
              </p>
            ) : (
              <div className="overflow-auto max-h-48 border rounded">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-600 sticky top-0">
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

      {/* <div className="mt-4 text-xs text-gray-500">
        <strong>Notes:</strong> The parser accepts comma, whitespace or
        semicolon separators. For complex CSVs (quoted fields, different
        separators, very large files) consider using a CSV library on the
        frontend (e.g., PapaParse) for robust parsing.
      </div>*/}
    </section>
  );
}
