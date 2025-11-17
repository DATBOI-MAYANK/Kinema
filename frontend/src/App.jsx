import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [filename, setFilename] = useState("");

  function passLineToPair(line) {
    if (!line) return null;
    const parts = line
      .trim()
      .split(/[\s,;]+/)
      .filter(Boolean);
    if (parts.length < 2) return null;
    const x = Number.parts[0];
    const y = Number.parts[1];
    if (Number.isFinite(x) && Number.isFinite(y)) return [x, y];
    return null;
  }

  function parseInputText(rawText) {
    setError(null);
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }
  return (
    <form className="p-4 ml-96 mt-10  bg-red-500 rounded shadow-md w-1/2">
      <h2 className="font-semibold mb-2">Enter Data (x,y per line)</h2>
      <textarea
        rows="8"
        placeholder={`0,0\n1,2\n2,4\n3,6`}
        className="border w-full p-2 rounded resize-none"
      />
      <div className="flex gap-2 mt-3">
        <input type="file" accept=".csv" className="border rounded p-1" />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Analyze
        </button>
      </div>
    </form>
  );
}

export default App;
