import React from "react";
import { Header } from "./layout/Header";
import ManualInput from "./input/ManualInput";
import { FileUpload } from "./input/FileUpload";
import AdvancedSettings from "./settings/AdvancedSettings";
import ModelCards from "./results/ModelCards";
import StatusBanner from "./results/StatusBanner";
import { CreateChart } from "./chart/Chart";
import { useRegressionData } from "../hooks/useRegressionData";

export default function DataAnalysisApp() {
  const { regressionResults, inputMode } = useRegressionData();

  // If user is in equation-only mode, show only the manual input and chart for a focused layout
  if (inputMode === "equation") {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <Header />
          <div className="mb-6">
            <ManualInput />
          </div>
          <CreateChart />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <Header />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ManualInput />
          <FileUpload />
        </div>

        {regressionResults && <AdvancedSettings />}

        <StatusBanner />

        {regressionResults && <ModelCards />}

        {(regressionResults || inputMode === "equation") && <CreateChart />}
      </div>
    </div>
  );
}
