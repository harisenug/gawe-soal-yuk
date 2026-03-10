const {
Document,
Packer,
Paragraph,
TextRun,
TabStopType,
AlignmentType
} = require("docx");

const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("database.db");

const CM075 = 425;
const CM15 = 850;
const LINE = 240;
const MAX_SOAL = 50;

/* ================= RANDOM ================= */

function seededRandom(seed){
let x = Math.sin(seed++) * 10000;
return x - Math.floor(x);
}

function shuffleWithSeed(array, seed){

let arr = [...array];

for(let i = arr.length - 1; i > 0; i--){

const j = Math.floor(seededRandom(seed + i) * (i + 1));

[arr[i],arr[j]]=[arr[j],arr[i]];

}

return arr;

}

/*=== GENERATOR BLUEPRINT === */
function shuffle(arr, seed){

let random = require("seedrandom")(seed);

for(let i=arr.length-1;i>0;i--){

let j=Math.floor(random()* (i+1));

[arr[i],arr[j]]=[arr[j],arr[i]];

}

return arr;

}

/* ===== AMBIL SOAL ====*/
function ambilSoal(bank, rule){

return bank.filter(s=>{

if(rule.tipe && s.tipe!==rule.tipe) return false;

if(rule.level && s.level!==rule.level) return false;

if(rule.kesulitan && s.level_kesulitan!==rule.kesulitan) return false;

if(rule.gambar && !s.gambar) return false;

if(rule.tabel && !s.tabel) return false;

return true;

});

}

/*=== GENERATOR PAKET SOAL ANTI DUPLIKASI ====*/
function generatePaket(bank, blueprint, paketTotal, seed){

let usedSoal = new Set();

let hasil=[];

for(let p=0;p<paketTotal;p++){

let paket=[];

blueprint.forEach(rule=>{

let kandidat = ambilSoal(bank, rule);

kandidat = kandidat.filter(s=>!usedSoal.has(s.id));

kandidat = shuffle(kandidat, seed+p);

let ambil = kandidat.slice(0,rule.jumlah);

ambil.forEach(s=>usedSoal.add(s.id));

paket.push(...ambil);

});

paket = shuffle(paket, seed+p);

hasil.push(paket);

}

return hasil;

}

/* ================= LOAD BANK ================= */

function loadBankSoal(){

return new Promise((resolve,reject)=>{

db.all("SELECT * FROM soal",[],(err,rows)=>{

if(err) return reject(err);

const data = rows.map(r=>{

let parsed={};

try{
parsed = r.data ? JSON.parse(r.data) : {};
}catch{
parsed={};
}

return {...r,...parsed};

});

resolve(data);

});

});

}

/* ================= GENERATE FILE ================= */

async function generateFile(paket,mode,seed,jumlah,mapel,level){

jumlah = Math.min(jumlah || 20,MAX_SOAL);

let bank = await loadBankSoal();

if(!bank.length){
throw new Error("Bank soal kosong");
}

/* FILTER */

if(mapel){
bank = bank.filter(s=>!s.mapel || s.mapel===mapel);
}

if(level){
bank = bank.filter(s=>!s.level || s.level===level);
}

if(!bank.length){
throw new Error("Tidak ada soal sesuai filter");
}

const seedFinal = seed + paket.charCodeAt(0);

const soalTerpilih =
shuffleWithSeed(bank,seedFinal).slice(0,jumlah);

const children=[];
const daftarKunci=[];

children.push(
new Paragraph({
alignment:AlignmentType.CENTER,
children:[
new TextRun({
text:`PAKET ${paket}`,
bold:true,
size:32
})
]
})
);

children.push(new Paragraph(""));

let nomor=1;

for(let item of soalTerpilih){

if(item.tipe==="pg"){

children.push(
new Paragraph({
tabStops:[{type:TabStopType.LEFT,position:CM075}],
indent:{left:CM075,hanging:CM075},
children:[
new TextRun(`${nomor}.`),
new TextRun("\t"),
new TextRun(item.soal)
],
spacing:{line:LINE}
})
);

const opsiAcak =
shuffleWithSeed(item.opsi||[],seedFinal+nomor);

const huruf=["A","B","C","D","E"];
let kunci="";

opsiAcak.forEach((o,i)=>{

if(o.benar) kunci=huruf[i];

children.push(
new Paragraph({
tabStops:[{type:TabStopType.LEFT,position:CM15}],
indent:{left:CM15,hanging:CM075},
children:[
new TextRun(`${huruf[i]}.`),
new TextRun("\t"),
new TextRun(o.text)
],
spacing:{line:LINE}
})
);

});

daftarKunci.push({nomor,kunci,pembahasan:item.pembahasan});

}

children.push(new Paragraph(""));
nomor++;

}

/* ===== MODE GURU ===== */

if(mode==="guru"){

children.push(new Paragraph(""));
children.push(new Paragraph("KUNCI JAWABAN"));

daftarKunci.forEach(k=>{

children.push(
new Paragraph(`Nomor ${k.nomor} : ${k.kunci}`)
);

if(k.pembahasan){

children.push(
new Paragraph(`Pembahasan: ${k.pembahasan}`)
);

}

});

}

const doc = new Document({
sections:[{children}]
});

const buffer = await Packer.toBuffer(doc);

if(!fs.existsSync("./public")){
fs.mkdirSync("./public");
}

const fileName=`PAKET-${paket}-${mode}.docx`;

fs.writeFileSync(`./public/${fileName}`,buffer);

return fileName;

}

module.exports = { generateFile };