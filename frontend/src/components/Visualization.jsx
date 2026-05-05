import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

export default function Visualization({
  data,
  model,
  createChart,
  destroyChart,
  height = 420,
  id = "regressionChart",
  options = {},
  onReady,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (typeof createChart !== "function") {
      if (onReady) onReady(null);
      return undefined;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      if (onReady) onReady(null);
      return undefined;
    }

    try {
      if (createChart.length >= 3) {
        createChart(canvas, data, model, options);
      } else {
        createChart(data, model, { ...options, canvas });
      }
    } catch {
      console.error("Visualization: createChart threw");
    }

    if (onReady) {
      try {
        onReady(canvas);
      } catch {
        // ignore onReady errors
      }
    }

    return () => {
      try {
        if (typeof destroyChart === "function") {
          if (destroyChart.length >= 1) {
            destroyChart(canvas);
          } else {
            destroyChart();
          }
        } else if (typeof createChart === "function" && createChart.destroy) {
          createChart.destroy();
        }
      } catch {
        console.warn("Visualization: error during cleanup");
      }
    };
  }, [createChart, destroyChart, data, model, options, onReady]);

  return (
    <div className="bg-slate-950/50 p-2 sm:p-4 rounded-xl relative" style={{ height }}>
      <canvas id={id} ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

Visualization.propTypes = {
  data: PropTypes.array,
  model: PropTypes.object,
  createChart: PropTypes.func,
  destroyChart: PropTypes.func,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  id: PropTypes.string,
  options: PropTypes.object,
  onReady: PropTypes.func,
};

Visualization.defaultProps = {
  data: [],
  model: null,
  createChart: null,
  destroyChart: null,
  height: 420,
  id: "regressionChart",
  options: {},
  onReady: null,
};
