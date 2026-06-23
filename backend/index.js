import express from "express";
import cors from "cors";
import analysisRoutes from "./routes/analysis.routes.js";

const app = express();

const allowedOrigin = process.env.CORS_ORIGIN;

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use("/api/analyze", analysisRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
