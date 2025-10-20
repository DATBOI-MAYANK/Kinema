import "./App.css";

function App() {
  return (
    <div className="p-4 ml-96 mt-10  bg-gray-100 rounded shadow-md w-1/2">
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
    </div>
  );
}

export default App;
