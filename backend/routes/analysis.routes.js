import express from "express";
import { runRegressionAnalysis } from "../services/regression.service.js";

const router = express.Router();

router.post("/", (req, res) => {
  const { data } = req.body;
  console.log(data);
  if (!Array.isArray(data) || data.length < 2) {
    return res.status(400).json({
      error: "At least two data points are required",
    });
  }

  try {
    const result = runRegressionAnalysis(data);
    res.json(result);
    console.log("backend", result);
  } catch (err) {
    res.status(500).json({
      error: "Regression analysis failed",
    });
  }
});

export default router;
