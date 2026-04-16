import React from "react";
import { KinemaProvider } from "./context/KinemaContext";
import DataAnalysisApp from "./components/DataAnalysisApp";

export default function App() {
  return (
    <KinemaProvider>
      <DataAnalysisApp />
    </KinemaProvider>
  );
}
