const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const categoryMap = [
  { name: "Username", expected: 19, pages: [3] },
  { name: "Email Address", expected: 30, pages: [4, 5] },
  { name: "Domain Name", expected: 144, pages: [6, 7, 8, 9, 10, 11] },
  { name: "Cloud Infrastructure", expected: 23, pages: [12] },
  { name: "IP and MAC address", expected: 56, pages: [13, 14, 15] },
  { name: "Image,Videos,Webcam,Documents,F", expected: 89, pages: [16, 17, 18, 19] },
  { name: "Socials Network", expected: 45, pages: [20, 21] },
  { name: "Instant Messaging", expected: 21, pages: [22] },
  { name: "People Search Engines", expected: 21, pages: [23] },
  { name: "Dating", expected: 13, pages: [24] },
  { name: "Telephone Numbers", expected: 21, pages: [25] },
  { name: "Public Records", expected: 47, pages: [26, 27] },
  { name: "Compliance & Risk Compliance", expected: 19, pages: [28] },
  { name: "Buisness records", expected: 32, pages: [29, 30] },
  { name: "Transportation", expected: 23, pages: [31] },
  { name: "Geolocation tools", expected: 48, pages: [32, 33] },
  { name: "Search Engines", expected: 78, pages: [34, 35, 36] },
  { name: "Online communities", expected: 17, pages: [37] },
  { name: "Archives", expected: 23, pages: [38] },
  { name: "Language Translation", expected: 17, pages: [39] },
  { name: "Mobile OSINt", expected: 11, pages: [40] },
  { name: "Dark web", expected: 18, pages: [41] },
  { name: "Disinformation & Media Verifica", expected: 19, pages: [42] },
  { name: "Blockchain&Cryptocurrency", expected: 32, pages: [43, 44] },
  { name: "Classifieds", expected: 11, pages: [45] },
  { name: "Encoding & Decoding", expected: 13, pages: [46] },
  { name: "Tools", expected: 36, pages: [47, 48] },
  { name: "AI Tools", expected: 19, pages: [49] },
  { name: "Malicious File Analysis", expected: 31, pages: [50, 51] },
  { name: "Cyber Threat Intelligence", expected: 56, pages: [52, 53, 54] },
  { name: "OpSec", expected: 31, pages: [55, 56] },
  { name: "Documentation &Evidence Captur", expected: 15, pages: [57] },
  { name: "Training", expected: 7, pages: [58] }
];

async function checkDiscrepancies() {
  const data = fs.readFileSync('osint_field_guide.pdf');
  const parser = new PDFParse({ data });
  await parser.load();
  const res = await parser.getText();

  categoryMap.forEach(cat => {
    let found = 0;
    cat.pages.forEach(pgNum => {
      const pageText = res.pages[pgNum - 1].text;
      const lines = pageText.split('\n').map(l => l.trim()).filter(Boolean);
      lines.forEach(l => {
        if (l.match(/(Useful|Not Useful|Needs review|Not working)\s+(Not checked|Needs verification|Not Checked|Needs Review)$/i)) {
          found++;
        }
      });
    });
    if (found !== cat.expected) {
      console.log(`Cat: ${cat.name} -> expected ${cat.expected}, found ${found} on pages ${cat.pages.join(',')}`);
    }
  });
}

checkDiscrepancies().catch(console.error);
