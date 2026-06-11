const express = require("express");
const cors = require("cors");
require("dotenv").config();

const analyzeRoutes = require("./routes/analyzeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/analyze", analyzeRoutes);

const PORT = process.env.PORT || 5011;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
