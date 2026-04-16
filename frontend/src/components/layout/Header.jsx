import { Database } from "lucide-react";

export function Header() {
  return (
    <div className="mb-8 text-center">
      <div className="flex flex-col items-center justify-center gap-3 mb-3">
        <h1 className="text-5xl block font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
          Kinema
        </h1>
        <div className="flex gap-1">
          <Database className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            An Advanced Regression Analysis Portal
          </h2>
        </div>
      </div>
      <p className="text-slate-400 text-sm">
        Upload or paste your experimental data for comprehensive regression
        analysis
      </p>
    </div>
  );
}
