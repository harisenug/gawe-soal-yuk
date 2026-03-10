const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { generateFile } = require("./engine");

const app = express();
const db = new sqlite3.Database("database.db");

/* ===== DATABASE ===== */

db.run(`
CREATE TABLE IF NOT EXISTS soal (
id INTEGER PRIMARY KEY AUTOINCREMENT,
tipe TEXT,
soal TEXT,
data TEXT,
mapel TEXT,
kelas TEXT,
fase TEXT,
materi TEXT,
level TEXT,
pembahasan TEXT
)
`);

app.use(express.json());
app.use(express.static("public"));

/* ===== UPLOAD ===== */

if(!fs.existsSync("uploads")){
fs.mkdirSync("uploads");
}

const upload = multer({dest:"uploads/"});

/* ================= GENERATE ================= */

app.post("/generate", async (req,res)=>{

try{

const {seed,jumlah,paket,mapel,level} = req.body;

const paketList =
paket==3 ? ["A","B","C"]
: paket==2 ? ["A","B"]
: ["A"];

let files=[];

for(let p of paketList){

files.push(await generateFile(p,"siswa",seed,jumlah,mapel,level));
files.push(await generateFile(p,"guru",seed,jumlah,mapel,level));

}

res.json({success:true,files});

}catch(err){

console.error(err);
res.status(500).json({success:false,error:err.message});

}

});

/* ================= DOWNLOAD ================= */

app.get("/download/:file",(req,res)=>{

const filePath = path.join(__dirname,"public",req.params.file);

if(fs.existsSync(filePath)){
res.download(filePath);
}else{
res.status(404).send("File tidak ditemukan");
}

});

/* ================= LIST SOAL ================= */

app.get("/soal",(req,res)=>{

db.all("SELECT * FROM soal",[],(err,rows)=>{

if(err) return res.send(err.message);

res.json(rows);

});

});

/* ================= IMPORT EXCEL ================= */

app.post("/import-excel",upload.single("file"),(req,res)=>{

if(!req.file){
return res.send("File tidak ditemukan");
}

const workbook=XLSX.readFile(req.file.path);
const sheet=workbook.Sheets[workbook.SheetNames[0]];
const rows=XLSX.utils.sheet_to_json(sheet);

let count=0;

const stmt=db.prepare(
"INSERT INTO soal (tipe,soal,data,mapel,level,pembahasan) VALUES (?,?,?,?,?,?)"
);

rows.forEach(r=>{

const opsi=[
{text:r.A,benar:r.kunci==="A"},
{text:r.B,benar:r.kunci==="B"},
{text:r.C,benar:r.kunci==="C"},
{text:r.D,benar:r.kunci==="D"},
{text:r.E,benar:r.kunci==="E"}
].filter(o=>o.text);

stmt.run(
r.tipe||"pg",
r.soal,
JSON.stringify({opsi}),
r.mapel||"",
r.kelas||"",
r.fase||"",
r.materi||"",
r.level||"",
r.pembahasan||""
);

count++;

});

stmt.finalize(()=>{

fs.unlinkSync(req.file.path);
res.send("Import berhasil: "+count+" soal");

});

});

/* ==== ROUTE GENERATE ====*/
app.post("/generate", async(req,res)=>{

try{

let {mapel,kelas,fase,materi,paket,config,seed} = req.body;

let bank = await getBankSoal();

bank = bank.filter(s=>
(!mapel || s.mapel===mapel) &&
(!kelas || s.kelas===kelas) &&
(!fase || s.fase===fase) &&
(!materi || s.materi===materi)
);

let paketSoal = generatePaket(bank,config,paket,seed);

let files=[];

for(let i=0;i<paketSoal.length;i++){

let nama = "PAKET-"+String.fromCharCode(65+i);

let file = await exportWord(nama,paketSoal[i]);

files.push(file);

}

res.json({
success:true,
files
});

}catch(e){

console.error(e);

res.json({success:false,error:e.message});

}

});

/*===== ROUTE PREVIEW ====*/
app.post("/preview", async(req,res)=>{

let {config} = req.body;

let bank = await getBankSoal();

let preview=[];

config.forEach(rule=>{

let kandidat = ambilSoal(bank,rule);

preview.push(...kandidat.slice(0,rule.jumlah));

});

res.json(preview);

});

/* ================= PREVIEW ================= */

app.post("/preview",(req,res)=>{

const {jumlah,mapel,level}=req.body;

let query="SELECT * FROM soal WHERE 1=1";
let params=[];

if(mapel){
query+=" AND mapel=?";
params.push(mapel);
}

if(level){
query+=" AND level=?";
params.push(level);
}

db.all(query,params,(err,rows)=>{

if(err){
return res.status(500).json({error:err.message});
}

const shuffled=rows.sort(()=>Math.random()-0.5);

res.json(shuffled.slice(0,jumlah));

});

/* == GENERATOr SOAL  === */

app.get("/generator",(req,res)=>{
res.sendFile(__dirname + "/public/generator.html");
});

/* ================= START ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log("Server running on port " + PORT);
});

/*
app.get("/generator",(req,res)=>{
res.sendFile(path.join(__dirname,"public","generator.html"));
});

/*
const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
console.log("Server running on port "+PORT);
}); */