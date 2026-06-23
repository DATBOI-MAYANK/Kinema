import express from "express";
import { runRegressionAnalysis } from "../services/regression.service.js";

const router = express.Router();

router.post("/", (req, res) => {
  let payload = req.body;

  // If the body was sent as a raw string, attempt to parse it
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch (e) {
      console.error("Failed to parse request body as JSON:", e.message);
      return res.status(400).json({ error: "Request body is not valid JSON" });
    }
  }

  const { data, polynomialDegree, preferredModel } = payload || {};

  // Basic validation
  if (!Array.isArray(data) || data.length < 2) {
    console.warn("Invalid data received for analysis:", data);
    return res
      .status(400)
      .json({ error: "At least two data points are required" });
  }

  try {
    const result = runRegressionAnalysis(data, {
      polynomialDegree,
      preferredModel,
    });
    // Ensure result is JSON-serializable
    return res.json(result);
  } catch (err) {
    console.error(
      "Regression analysis failed",
      err?.stack || err?.message || err,
    );
    return res.status(500).json({ error: "Regression analysis failed" });
  }
});

export default router;
