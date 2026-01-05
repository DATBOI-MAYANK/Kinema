import express from "express";
import { runRegressionAnalysis } from "../services/regression.service.js";

const router = express.Router();

router.post("/", (req, res) => {
  const { data } = req.body;

  if (!Array.isArray(data) || data.length < 2) {
    return res.status(400).json({
      error: "At least two data points are required",
    });
  }

  try {
    const result = runRegressionAnalysis(data);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: "Regression analysis failed",
    });
  }
});

export default router;
