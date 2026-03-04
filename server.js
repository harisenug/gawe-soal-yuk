const express = require("express");
const { generateFile } = require("./engine");

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.post("/generate", async (req, res) => {

  const { seed, jumlah, paket } = req.body;

  const paketList = paket === 3 ? ["A","B","C"]
                   : paket === 2 ? ["A","B"]
                   : ["A"];

  let files = [];

  for (let p of paketList) {
    files.push(await generateFile(p, "siswa", seed, jumlah));
    files.push(await generateFile(p, "guru", seed, jumlah));
  }

  res.json({ success: true, files });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
