const fs = require('fs');
const PDFParser = require("pdf2json");
let pdfParser = new PDFParser(this, 1);
pdfParser.on("pdfParser_dataReady", pdfData => {
    console.log(pdfParser.getRawTextContent());
});
pdfParser.loadPDF("/Users/parthpatel/Downloads/MANALI KASOL APRIL 2026 TO JULY 2026 - 27 SEP MKA.pdf");
