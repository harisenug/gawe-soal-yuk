const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const { generateFile } = require("./engine");

const app = express();

app.use(express.json());
app.use(express.static("public"));

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/* ===== GENERATE ===== */
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

/* ===== DOWNLOAD ===== */
app.get("/download/:filename", (req, res) => {
  const filePath = path.join(__dirname, req.params.filename);
  res.download(filePath);
});

/* ===== IMPORT ===== */
const upload = multer({ dest: "uploads/" });

app.post("/import", upload.single("file"), (req, res) => {

  if (!req.file) {
    return res.status(400).send("File tidak ditemukan");
  }

  const workbook = XLSX.readFile(req.file.path);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);

  fs.unlinkSync(req.file.path);

  res.send("Upload berhasil. Total baris: " + data.length);
});

const PORT = process.env.PORT || 3000;

const multer = require("multer");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });

app.post("/import", upload.single("file"), (req, res) => {

  if (!req.file) {
    return res.status(400).send("File tidak ditemukan");
  }

  const workbook = XLSX.readFile(req.file.path);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = XLSX.utils.sheet_to_json(sheet);

  fs.unlinkSync(req.file.path); // hapus file sementara

  res.send("Upload berhasil. Total baris: " + data.length);
});

app.get("/download/:filename", (req, res) => {
  const filePath = path.join(__dirname, req.params.filename);
  res.download(filePath);
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
<<<<<<< HEAD
});
=======
});
>>>>>>> f9d138852dfa5bdd91efd467495d9c1e5a4a7d18
