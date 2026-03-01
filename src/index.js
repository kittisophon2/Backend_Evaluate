import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("Pameun Evaluation API Running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});