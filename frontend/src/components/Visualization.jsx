import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

/**
 * Visualization
 *
 * Lightweight wrapper around a <canvas> used for Chart.js (or any canvas-based)
 * rendering. The component exposes a `canvasRef` internally and calls the
 * provided `createChart` callback whenever `data` or `model` changes.
 *
 * Props:
 * - data: array of [x,y] pairs (passed through to createChart)
 * - model: model object (passed through to createChart)
 * - createChart: function used to build the chart. Signature supported:
 *     - createChart(canvas, data, model, options)
 *     - createChart(data, model, options)
 *   The component will attempt to call the first form, and fall back to the second
 *   if the function's declared arity suggests it expects fewer args.
 * - destroyChart: optional cleanup function called on unmount.
 *     - destroyChart(canvas) OR destroyChart() are both supported.
 * - height: visual height in px (default 420). The canvas will fill the container.
 * - id: optional id for the canvas element (defaults to 'regressionChart')
 * - options: any extra options forwarded to createChart
 *
 * The component intentionally leaves details of chart construction to the caller
 * (createChart/destroyChart). That keeps this component UI-only and easy to unit-test.
 */
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
    // No-op if no createChart provided
    if (typeof createChart !== "function") {
      if (onReady) onReady(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      if (onReady) onReady(null);
      return;
    }

    // Prefer calling createChart(canvas, data, model, options) if function
    // appears to accept the canvas. Fall back to createChart(data, model, options).
    try {
      if (createChart.length >= 3) {
        // createChart expects (canvas, data, model, ...) or similar
        createChart(canvas, data, model, options);
      } else {
        // fallback — caller expects (data, model, options)
        createChart(data, model, { ...options, canvas });
      }
    } catch (err) {
      // If the function threw synchronously, forward the error to the console
      // but allow the app to continue. The app-level caller should handle errors.
      // eslint-disable-next-line no-console
      console.error("Visualization: createChart threw:", err);
    }

    if (onReady) {
      try {
        onReady(canvas);
      } catch (e) {
        // ignore errors from onReady
      }
    }

    // Cleanup function: call destroyChart if provided.
    return () => {
      try {
        if (typeof destroyChart === "function") {
          // prefer passing canvas if destroyChart expects an argument
          if (destroyChart.length >= 1) destroyChart(canvas);
          else destroyChart();
        } else if (typeof createChart === "function" && createChart.destroy) {
          // some createChart implementations may attach a .destroy method
          try {
            createChart.destroy();
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("Visualization: error during cleanup", err);
      }
    };
    // We intentionally include createChart/destroyChart in deps because callers
    // might recreate these functions (e.g., when moved into hooks). data/model
    // are included so the chart updates when inputs change.
  }, [createChart, destroyChart, data, model, options, onReady]);

  return (
    <div
      className="bg-slate-950/50 p-2 sm:p-4 rounded-xl relative"
      style={{ height }}
    >
      <canvas
        id={id}
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
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
