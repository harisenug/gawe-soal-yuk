const tingkatData = {

"TK":{
kelas:["TK A","TK B"],
fase:{ "TK A":"A","TK B":"A" }
},

"SD / MI":{
kelas:["1","2","3","4","5","6"],
fase:{
"1":"A","2":"A",
"3":"B","4":"B",
"5":"C","6":"C"
}
},

"SMP / MTs":{
kelas:["7","8","9"],
fase:{
"7":"D","8":"D","9":"D"
}
},

"SMA / MA / SMK":{
kelas:["10","11","12"],
fase:{
"10":"E",
"11":"F",
"12":"F"
}
}

};

const tipeSoalList=[
"Pilihan Ganda Biasa",
"Pilihan Ganda Kompleks",
"Sebab Akibat",
"Menjodohkan",
"Benar Salah",
"Uraian"
];

/* ================= INIT TINGKAT ================= */

function initTingkat(){

let t=document.getElementById("tingkat");

Object.keys(tingkatData).forEach(v=>{

let o=document.createElement("option");
o.text=v;
t.add(o);

});

}

/* ================= ISI KELAS ================= */

document.getElementById("tingkat").onchange=()=>{

let t=document.getElementById("tingkat").value;
let kelas=document.getElementById("kelas");

kelas.innerHTML="";

tingkatData[t].kelas.forEach(k=>{

let o=document.createElement("option");
o.text=k;
kelas.add(o);

});

updateFase();

};

/* ================= UPDATE FASE ================= */

document.getElementById("kelas").onchange=updateFase;

function updateFase(){

let t=document.getElementById("tingkat").value;
let k=document.getElementById("kelas").value;

if(!t||!k) return;

let fase=tingkatData[t].fase[k];

document.getElementById("fase").value=fase;

}

/* ================= TAMBAH TIPE ================= */

function addTipe(){

let row=document.createElement("div");
row.className="soalRow";

row.innerHTML=`

<select class="tipe">
${tipeSoalList.map(t=>`<option>${t}</option>`).join("")}
</select>

<select class="level">
<option>C1</option>
<option>C2</option>
<option>C3</option>
<option>C4</option>
<option>C5</option>
<option>C6</option>
</select>

<select class="kesulitan">
<option>Mudah</option>
<option>Sedang</option>
<option>Sulit</option>
</select>

<input type="number" class="jumlah" value="5">

<div class="check">
<input type="checkbox" class="gambar">
</div>

<div class="check">
<input type="checkbox" class="tabel">
</div>

<button class="hapusBtn">Hapus</button>

`;

row.querySelector(".hapusBtn").onclick=()=>row.remove();

document.getElementById("tipeContainer").appendChild(row);

}

document.getElementById("addType").onclick=addTipe;

/* ================= PREVIEW ================= */

document.getElementById("previewBtn").onclick=async()=>{

let jumlah=10;

let res=await fetch("/preview",{
method:"POST",
headers:{'Content-Type':'application/json'},
body:JSON.stringify({jumlah})
});

let data=await res.json();

alert("Preview "+data.length+" soal");

};

/* ================= GENERATE ================= */

document.getElementById("generateBtn").onclick=async()=>{

let rows=document.querySelectorAll(".soalRow");

let config=[];

rows.forEach(r=>{

config.push({

tipe:r.querySelector(".tipe").value,
level:r.querySelector(".level").value,
kesulitan:r.querySelector(".kesulitan").value,
jumlah:r.querySelector(".jumlah").value,
gambar:r.querySelector(".gambar").checked,
tabel:r.querySelector(".tabel").checked

});

});

let body={
seed:Date.now(),
paket:1,
mapel:document.getElementById("mapel").value,
config
};

let res=await fetch("/generate",{
method:"POST",
headers:{'Content-Type':'application/json'},
body:JSON.stringify(body)
});

let data=await res.json();

if(data.success){

data.files.forEach(f=>{
window.open("/download/"+f);
});

}

};

initTingkat();
addTipe();