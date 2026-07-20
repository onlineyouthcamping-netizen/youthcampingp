const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const files = [
  "/Users/parthpatel/Downloads/Manali Kasol Amritsar 2026-2027 Backpacking Trip.pdf",
  "/Users/parthpatel/Downloads/Kerala Trip 2026 (1).pdf",
  "/Users/parthpatel/Downloads/Kerala Trip 2026.pdf",
  "/Users/parthpatel/Downloads/Spiti Valley Road Trip from Ahmedabad.pdf",
  "/Users/parthpatel/Downloads/A Winter Spiti Road  Trip.pdf"
];

async function run() {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      let dataBuffer = fs.readFileSync(file);
      const data = await pdf(dataBuffer);
      const outPath = path.join(__dirname, `pdf_text_${i+1}.txt`);
      fs.writeFileSync(outPath, `File: ${file}\nPages: ${data.numpages}\n\n${data.text}`);
      console.log(`Extracted ${file} -> pdf_text_${i+1}.txt (${data.numpages} pages)`);
    } catch (e) {
      console.error(`Error on ${file}:`, e);
    }
  }
}
run();
