const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function testParse() {
  const data = fs.readFileSync('osint_field_guide.pdf');
  const parser = new PDFParse({ data });
  await parser.load();
  const res = await parser.getText();

  // Pattern for ending of an entry:
  // e.g., (Useful|Not Useful|Needs review) (Not checked|Needs verification|...)
  // Or check how entries end across all pages
  const statusEndings = [];
  
  for (let i = 2; i < res.pages.length; i++) {
    const lines = res.pages[i].text.split('\n').map(l => l.trim()).filter(Boolean);
    for (const l of lines) {
      const match = l.match(/(Useful|Not Useful|Needs review|Not working)\s+(Not checked|Needs verification|Not Checked|Needs Review)$/i);
      if (match) {
        statusEndings.push({ page: i + 1, ending: match[0], line: l });
      }
    }
  }

  console.log('Total matches found with standard regex:', statusEndings.length);
}

testParse().catch(console.error);
