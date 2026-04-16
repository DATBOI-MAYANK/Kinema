/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import { getActiveModel } from "../services/modelUtils";

const initialState = {
  text: "",
  equation: "",
  inputMode: "pairs",
  filename: "",
  previewRows: [],
  error: null,
  analyzedData: null,
  regressionResults: null,
  isAnalyzing: false,
  showAdvanced: false,
  polynomialDegree: 3,
  showConfidenceInterval: false,
  showResiduals: false,
  selectedModel: "AUTO",
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_MANY":
      return { ...state, ...action.payload };
    case "RESET_ALL":
      return initialState;
    default:
      return state;
  }
}

const KinemaContext = createContext(null);

export function KinemaProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setField = useCallback((field, value) => {
    dispatch({ type: "SET_FIELD", field, value });
  }, []);

  const setMany = useCallback((payload) => {
    dispatch({ type: "SET_MANY", payload });
  }, []);

  const resetAll = useCallback(() => {
    dispatch({ type: "RESET_ALL" });
  }, []);

  const activeModel = useMemo(
    () => getActiveModel(state.regressionResults, state.selectedModel),
    [state.regressionResults, state.selectedModel],
  );

  const value = useMemo(
    () => ({
      ...state,
      activeModel,
      setField,
      setMany,
      resetAll,
    }),
    [activeModel, resetAll, setField, setMany, state],
  );

  return <KinemaContext.Provider value={value}>{children}</KinemaContext.Provider>;
}

export function useKinemaContext() {
  const context = useContext(KinemaContext);
  if (!context) {
    throw new Error("useKinemaContext must be used within a KinemaProvider");
  }
  return context;
}
