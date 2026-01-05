import express from "express";
import cors from "cors";
import analysisRoutes from "./routes/analysis.routes.js";

const app = express();

const port = 3000;

app.use(cors());
app.use(express.json());

app.use("/api/analyze", analysisRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
