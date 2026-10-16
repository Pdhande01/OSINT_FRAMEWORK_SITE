const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function checkDomainPages() {
  const data = fs.readFileSync('osint_field_guide.pdf');
  const parser = new PDFParse({ data });
  await parser.load();
  const res = await parser.getText();

  [6, 7, 8, 9, 10, 11].forEach(pgNum => {
    const pageText = res.pages[pgNum - 1].text;
    const lines = pageText.split('\n').map(l => l.trim()).filter(Boolean);
    console.log(`--- Page ${pgNum} (total lines: ${lines.length}) ---`);
    lines.forEach((l, idx) => {
      // Check lines that have Netlas, Spyse, or might be missing the status suffix
      if (l.includes('Netlas') || l.includes('Spyse') || l.includes('Needs verification') || l.includes('Not checked') || l.includes('Needs review')) {
        console.log(`[Line ${idx}]: ${l}`);
      }
    });
  });
}

checkDomainPages().catch(console.error);
