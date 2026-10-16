const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function inspect() {
  const data = fs.readFileSync('osint_field_guide.pdf');
  const parser = new PDFParse({ data });
  await parser.load();
  const res = await parser.getText();
  console.log('Total pages:', res.pages.length);
  res.pages.forEach((p, idx) => {
    const lines = p.text.split('\n').map(l => l.trim()).filter(Boolean);
    console.log(`Page ${idx + 1}: ${lines.slice(0, 3).join(' || ')} [Lines: ${lines.length}]`);
  });
}

inspect().catch(console.error);
