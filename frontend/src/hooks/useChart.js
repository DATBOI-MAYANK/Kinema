// ```Physics Project/Kinema/frontend/src/hooks/useChart.js#L1-200
import { useRef, useEffect } from "react";
import Chart from "chart.js/auto";

// /**
//  * useChart - a small hook that encapsulates Chart.js lifecycle and exposes helper methods.
//  *
//  * Responsibilities:
//  * - Provide a `canvasRef` to attach to a <canvas/> element
//  * - Provide `createChart(data, model, options)` to create/update the chart instance
//  * - Provide `destroyChart()` to clean up the instance
//  * - Provide `getChart()` to access the current Chart instance (read-only)
//  *
//  * Notes:
//  * - Keep the hook minimal: it does not hold or mutate application state other than the Chart instance.
//  * - Callers are responsible for producing data in the form expected by Chart.js (datasets, labels, etc.)
//  */
export function useChart() {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  //   // Ensure we clean up Chart instance when the component using the hook unmounts
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.destroy();
        } catch {
          // ignore destroy errors during unmount cleanup
        }
        chartRef.current = null;
      }
    };
  }, []);

  //   /**
  //    * createChart
  //    * - If a chart already exists it will be destroyed before creating a new one.
  //    * - `config` is a standard Chart.js config object: { type, data, options, plugins }
  //    *
  //    * @param {Object} config Chart.js configuration object
  //    * @returns {Chart|null} the created Chart instance or null on failure
  //    */
  function createChart(config) {
    if (!canvasRef.current) {
      console.warn("useChart: canvasRef is not attached yet");
      return null;
    }

    // Destroy existing chart if present
    if (chartRef.current) {
      try {
        chartRef.current.destroy();
      } catch {
        // Ignore errors from Chart.js destroy
        console.warn("useChart: error destroying existing chart");
      }
      chartRef.current = null;
    }

    try {
      const ctx = canvasRef.current.getContext("2d");
      const chart = new Chart(ctx, config);
      chartRef.current = chart;
      return chart;
    } catch {
      console.error("useChart: failed to create chart");
      return null;
    }
  }

  // /**
  //  * updateChart
  //  * - If a chart exists, update its data and options then call update()
  //  * - This is a convenience helper; callers can also call getChart() and manipulate directly.
  //  *
  //  * @param {Object} updater - { data?, options?, animate? }
  //  */
  function updateChart({ data, options, animate = true } = {}) {
    const chart = chartRef.current;
    if (!chart) {
      console.warn("useChart: no chart to update");
      return;
    }

    if (data) {
      // Replace data object safely
      chart.data = data;
    }

    if (options) {
      chart.options = options;
    }

    // Request Chart.js to update the rendering
    try {
      chart.update(animate ? undefined : 0);
    } catch {
      console.warn("useChart: chart.update() failed");
    }
  }

  /**
   * destroyChart - destroys the current chart instance (if any)
   */
  function destroyChart() {
    if (chartRef.current) {
      try {
        chartRef.current.destroy();
      } catch {
        console.warn("useChart: error destroying chart");
      }
      chartRef.current = null;
    }
  }

  /**
   * getChart - returns the current Chart.js instance
   */
  function getChart() {
    return chartRef.current;
  }

  return {
    canvasRef,
    createChart,
    updateChart,
    destroyChart,
    getChart,
  };
}

export default useChart;
