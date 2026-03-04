const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  TabStopType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle
} = require("docx");

const fs = require("fs");
const path = require("path");

const CM075 = 425;
const CM15 = 850;
const LINE = 240;

const MAX_SOAL = 50;

function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function shuffleWithSeed(array, seed) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function loadBankSoal() {
  const raw = fs.readFileSync("./data/bankSoal.json");
  return JSON.parse(raw);
}

async function generateFile(paket, mode, seed, jumlahSoal) {

  jumlahSoal = Math.min(jumlahSoal, MAX_SOAL);

  const bank = loadBankSoal();
  const seedFinal = seed + paket.charCodeAt(0);

  const soalTerpilih = shuffleWithSeed(bank, seedFinal)
    .slice(0, jumlahSoal);

  const children = [];
  const daftarKunci = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [ new TextRun({ text: `PAKET ${paket}`, bold: true, size: 24 }) ]
    })
  );

  children.push(new Paragraph({}));

  let nomor = 1;

  for (let item of soalTerpilih) {

    // ================= PG =================
    if (item.tipe === "pg") {

      children.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: CM075 }],
          indent: { left: CM075, hanging: CM075 },
          children: [
            new TextRun(`${nomor}.`),
            new TextRun("\t"),
            new TextRun(item.soal)
          ],
          spacing: { line: LINE }
        })
      );

      const opsiAcak = shuffleWithSeed(item.opsi, seedFinal + nomor);
      const huruf = ["A","B","C","D","E"];
      let kunci = "";

      opsiAcak.forEach((o, i) => {
        if (o.benar) kunci = huruf[i];

        children.push(
          new Paragraph({
            tabStops: [{ type: TabStopType.LEFT, position: CM15 }],
            indent: { left: CM15, hanging: CM075 },
            children: [
              new TextRun(`${huruf[i]}.`),
              new TextRun("\t"),
              new TextRun(o.text)
            ],
            spacing: { line: LINE }
          })
        );
      });

      daftarKunci.push({ nomor, kunci, pembahasan: item.pembahasan });
    }

    // ================= MENJODOHKAN =================
    if (item.tipe === "menjodohkan") {

      children.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.LEFT, position: CM075 }],
          indent: { left: CM075, hanging: CM075 },
          children: [
            new TextRun(`${nomor}.`),
            new TextRun("\t"),
            new TextRun(item.soal)
          ],
          spacing: { line: LINE }
        })
      );

      children.push(new Paragraph({}));

      const rows = [];

      rows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph("Kolom A")] }),
            new TableCell({ children: [new Paragraph("Kolom B")] })
          ]
        })
      );

      const max = Math.max(item.kolomA.length, item.kolomB.length);

      for (let i = 0; i < max; i++) {
        rows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [ new Paragraph(item.kolomA[i] || "") ]
              }),
              new TableCell({
                children: [ new Paragraph(item.kolomB[i] || "") ]
              })
            ]
          })
        );
      }

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows
        })
      );

      daftarKunci.push({
        nomor,
        kunciMenjodohkan: item.kunci,
        pembahasan: item.pembahasan
      });
    }

    children.push(new Paragraph({}));
    nomor++;
  }

  // ================= MODE GURU =================
  if (mode === "guru") {

    children.push(
      new Paragraph({
        children: [ new TextRun({ text: "KUNCI DAN PEMBAHASAN", bold: true }) ]
      })
    );

    children.push(new Paragraph({}));

    daftarKunci.forEach(k => {

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Nomor ${k.nomor}`, bold: true })
          ]
        })
      );

      if (k.kunci) {
        children.push(new Paragraph(`Kunci: ${k.kunci}`));
      }

      if (k.kunciMenjodohkan) {

        const rows = [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph("Nomor")] }),
              new TableCell({ children: [new Paragraph("Jawaban")] })
            ]
          })
        ];

        Object.entries(k.kunciMenjodohkan).forEach(([no, jw]) => {
          rows.push(
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(no)] }),
                new TableCell({ children: [new Paragraph(jw)] })
              ]
            })
          );
        });

        children.push(
          new Table({
            width: { size: 50, type: WidthType.PERCENTAGE },
            rows
          })
        );
      }

      children.push(new Paragraph(`Pembahasan: ${k.pembahasan}`));
      children.push(new Paragraph({}));
    });
  }

  const doc = new Document({
    sections: [{ children }]
  });

  const buffer = await Packer.toBuffer(doc);

  const fileName = `PAKET-${paket}-${mode}.docx`;
  fs.writeFileSync(`./public/${fileName}`, buffer);

  return fileName;
}

module.exports = { generateFile };