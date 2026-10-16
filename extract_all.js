const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const XLSX = require('xlsx');

// 33 Categories from the Index
const categoryIndex = [
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

async function extractAll() {
  const data = fs.readFileSync('osint_field_guide.pdf');
  const parser = new PDFParse({ data });
  await parser.load();
  const res = await parser.getText();

  const allTools = [];
  let currentCategory = "";
  let currentSubCategory = "General";

  // Helper to test if a line marks an entry termination
  function isEntryEnd(line) {
    if (line.match(/(Useful|Not Useful|Needs review|Not working)\s+(Not checked|Needs verification|Not Checked|Needs Review)$/i)) {
      return true;
    }
    if (line.match(/^(Netlas\.io Same as Earlier|VURL Online Not Available|Malware Domain List Not Working)\s+Needs verification$/i)) {
      return true;
    }
    return false;
  }

  for (let catDef of categoryIndex) {
    currentCategory = catDef.name;
    const catTools = [];

    // Collect all raw lines across pages of this category
    for (let pgNum of catDef.pages) {
      const pageText = res.pages[pgNum - 1].text;
      const rawLines = pageText.split('\n').map(l => l.trim()).filter(Boolean);

      // Filter out header lines:
      // "OSINT FIELD GUIDE", "Page X", "Category Name", "Category Sub-Category Tool Name Tool Type / Notes URL Instructions India Compatibility Verification Status Last Checked"
      const contentLines = [];
      for (let l of rawLines) {
        if (l === "OSINT FIELD GUIDE" || l.match(/^Page \d+$/i)) continue;
        if (l === currentCategory) continue;
        if (l.startsWith("Category Sub-Category Tool Name") || l.startsWith("Category Tool entries")) continue;
        contentLines.push(l);
      }

      // Group content lines into tool entries
      let currentChunk = [];
      for (let l of contentLines) {
        currentChunk.push(l);
        if (isEntryEnd(l)) {
          catTools.push({
            page: pgNum,
            lines: [...currentChunk]
          });
          currentChunk = [];
        }
      }
      if (currentChunk.length > 0) {
        console.warn(`[Warning] Category ${currentCategory} Pg ${pgNum} had leftover lines:`, currentChunk);
      }
    }

    console.log(`Category "${currentCategory}": extracted ${catTools.length} entries (expected ${catDef.expected})`);

    // Parse each entry chunk into structured tool record
    for (let entry of catTools) {
      const fullText = entry.lines.join(' ');
      
      // Determine India Compatibility and Verification Status
      let indiaCompat = "Useful";
      let verifStatus = "Not checked";

      // Match endings
      let endingMatch = fullText.match(/(Useful|Not Useful|Needs review|Not working)\s+(Not checked|Needs verification|Not Checked|Needs Review)$/i);
      let textWithoutStatus = fullText;

      if (endingMatch) {
        indiaCompat = endingMatch[1];
        verifStatus = endingMatch[2];
        textWithoutStatus = fullText.substring(0, endingMatch.index).trim();
      } else if (fullText.match(/Needs verification$/i)) {
        indiaCompat = "Needs review";
        verifStatus = "Needs verification";
        textWithoutStatus = fullText.replace(/Needs verification$/i, '').trim();
      }

      // Find URL if present
      // URLs can be https://..., http://..., or "Not Available", "Not Working", "Redirecting on Dehased.com page", "Same as Earlier"
      let urlMatch = textWithoutStatus.match(/(https?:\/\/[^\s]+)/i);
      let url = "";
      let beforeUrl = "";
      let afterUrl = "";

      if (urlMatch) {
        url = urlMatch[1];
        // Clean URL if there was an accidental line break or hyphen split (e.g. check-if-\nemail-exists)
        url = url.replace(/-\s+/g, '-').replace(/\s+/g, '');
        beforeUrl = textWithoutStatus.substring(0, urlMatch.index).trim();
        afterUrl = textWithoutStatus.substring(urlMatch.index + urlMatch[0].length).trim();
      } else {
        // Fallbacks for non-http URLs
        const specialUrls = ["Not Available", "Not Working", "Redirecting on Dehased.com page", "Same as Earlier"];
        let foundSpecial = false;
        for (let sp of specialUrls) {
          const idx = textWithoutStatus.indexOf(sp);
          if (idx !== -1) {
            url = sp;
            beforeUrl = textWithoutStatus.substring(0, idx).trim();
            afterUrl = textWithoutStatus.substring(idx + sp.length).trim();
            foundSpecial = true;
            break;
          }
        }
        if (!foundSpecial) {
          beforeUrl = textWithoutStatus;
          url = "https://osintframework.com/";
        }
      }

      // Check if beforeUrl starts with Category / SubCategory
      // If beforeUrl starts with currentCategory name (e.g. "Username Username Search Engines WhatsMyNameWeb Web-based")
      let workingBefore = beforeUrl;
      if (workingBefore.startsWith(currentCategory)) {
        workingBefore = workingBefore.substring(currentCategory.length).trim();
      }

      // Detect Tool Types
      const toolTypes = [
        "CLI / Python / Needs verification",
        "CLI / Needs verification",
        "CLI / Python / Needs verification",
        "CLI / Reverse engineering",
        "CLI / Dynamic instrumentation",
        "CLI / Operating system tools",
        "CLI / JavaScript engine",
        "CLI / Machine learning",
        "CLI / IOC extraction",
        "CLI / IOC collection",
        "CLI / IOC search",
        "CLI / Network scanner",
        "CLI / Security scanner",
        "CLI / Docker / Network scanning",
        "CLI / Office document analysis",
        "CLI / Metadata removal",
        "CLI / Linux sandbox",
        "CLI / OSINT tool",
        "CLI / Script",
        "CLI / Python",
        "CLI / Go",
        "CLI / Ruby",
        "CLI / Linux",
        "CLI / PowerShell",
        "CLI / SQL",
        "CLI / Java / API",
        "CLI / Desktop / GUI",
        "CLI based",
        "CLI/Python base",
        "CLI",
        "Web-based / Search Engine",
        "Web-based / Search engine",
        "Web-based / Search operators",
        "Web-based / Search technique",
        "Web-based / Search tool",
        "Web-based / Search trends",
        "Web-based / Needs verification",
        "Web-based / Commercial / API",
        "Web-based / Commercial / AI",
        "Web-based / Commercial / AI detection",
        "Web-based / Commercial",
        "Web-based / API / Dataset",
        "Web-based / API / Vulnerability database",
        "Web-based / API / Blockchain analytics",
        "Web-based / API / AI detection",
        "Web-based / API",
        "Web-based / Threat intelligence",
        "Web-based / Threat Intelligence",
        "Web-based / Bitcoin explorer and monitoring",
        "Web-based / Bitcoin address lookup",
        "Web-based / Bitcoin explorer",
        "Web-based / Bitcoin analysis",
        "Web-based / Blockchain explorer",
        "Web-based / Blockchain analytics",
        "Web-based / Blockchain intelligence",
        "Web-based / Blockchain visualization",
        "Web-based / Blockchain analysis",
        "Web-based / Wallet clustering",
        "Web-based / Ethereum explorer",
        "Web-based / Block explorer",
        "Web-based / NFT explorer",
        "Web-based / NFT marketplace",
        "Web-based / DeFi analytics",
        "Web-based / Multi-chain explorer",
        "Web-based / Multi-engine scanning",
        "Web-based / Multi-engine scanning",
        "Web-based / Sandbox analysis",
        "Web-based / Interactive sandbox",
        "Web-based / Malware configuration analysis",
        "Web-based / File scanning",
        "Web-based / File analysis",
        "Web-based / PDF analysis",
        "Web-based / PCAP training and analysis",
        "Web-based / Document archive",
        "Web-based / Open web archive",
        "Web-based / Web archive",
        "Web-based / National archive",
        "Web-based / Regional archive",
        "Web-based / Classified ads",
        "Web-based / Classified search",
        "Web-based / Online marketplace",
        "Web-based / Official database",
        "Web-based / Official resource",
        "Web-based / Official registry",
        "Web-based / Government data",
        "Web-based / Government advisories",
        "Web-based / Open data",
        "Web-based / Research repository",
        "Web-based / Research dataset",
        "Web-based / Research platform",
        "Web-based / Research resource",
        "Web-based / Academic search",
        "Web-based / Academic publisher",
        "Web-based / Directory",
        "Web-based / Resource directory",
        "Web-based / Dating platform",
        "Web-based / Social platform",
        "Web-based / Professional network",
        "Web-based / Mobile app",
        "Web-based / Mobile browser",
        "Web-based / Browser Extension",
        "Web-based / Browser extension",
        "Web-based / Browser privacy testing",
        "Web-based / Privacy testing",
        "Web-based / Privacy guidance",
        "Web-based / Privacy guide",
        "Web-based / Privacy directory",
        "Web-based / DNS / CLI",
        "Web-based / Database",
        "Web-based / Mapping",
        "Web-based / Map",
        "Web-based / Satellite imagery",
        "Web-based / Drone imagery",
        "Web-based / Weather radar data",
        "Web-based / Transport map",
        "Web-based / Infrastructure map",
        "Web-based / Outdoor map",
        "Web-based / Open map",
        "Web-based / GIS",
        "Web-based / Conflict monitoring",
        "Web-based / Historical imagery",
        "Web-based / Historical vulnerability database",
        "Web-based / Historical threat intelligence",
        "Web-based / Historical structured-data search service",
        "Web-based / Historical malware search",
        "Web-based / Historical building database",
        "Web-based / Historical crime-mapping service",
        "Web-based / Discontinued",
        "Web-based / Legacy",
        "Web-based / OCR",
        "Web-based / Barcode reader",
        "Web-based / JavaScript formatter",
        "Web-based / JavaScript deobfuscation",
        "Web-based / PHP deobfuscation",
        "Web-based / Data transformation",
        "Web-based / Automation platform",
        "Web-based / Workflow automation",
        "Web-based / AI content detection",
        "Web-based / AI image detection",
        "Web-based / AI assistant",
        "Web-based / AI text detection",
        "Web-based / AI search",
        "Web-based / Deepfake detection",
        "Web-based / Fact-checking",
        "Web-based / Fact-checking directory",
        "Web-based / Reverse image search",
        "Web-based / Image analysis",
        "Web-based / Image forensics",
        "Web-based / Font identification",
        "Web-based / Community reference",
        "Web-based / Community forums",
        "Web-based / Onion search",
        "Web-based / Onion directory",
        "Web-based / Onion search engine",
        "Web-based / Training and research",
        "Web-based / Tutorial",
        "Web-based / Legal database",
        "Web-based / Legal archive",
        "Web-based / Legal search",
        "Web-based / US records",
        "Web-based / US government data",
        "Web-based / US dataset",
        "Web-based / US political data",
        "Web-based / US-specific opt-out",
        "Web-based / US-specific guidance",
        "Web-based / US-specific reference",
        "Web-based / Municipal data",
        "Web-based / Phone service",
        "Web-based / Caller lookup",
        "Web-based / Identity data generator",
        "Web-based / Synthetic identity generator",
        "Web-based / Account deletion directory",
        "Web-based / Timeline visualization",
        "Web-based / Website screenshot",
        "Web-based / Web capture",
        "Web-based / Web debugging proxy",
        "Web-based / Web security proxy",
        "Web-based / Web proxy",
        "Web-based / Web scanner",
        "Web-based / Knowledge base",
        "Web-based / OSINT guides",
        "Web-based / OSINT training resource",
        "Web-based / OSINT community and training",
        "Web-based / Research resource",
        "Web-based / Document AI",
        "Web-based / Metasearch",
        "Web-based / B2B directory",
        "Web-based / Business directory",
        "Web-based / Business research",
        "Web-based / Company database",
        "Web-based / Relationship database",
        "Web-based / SEO tool",
        "Web-based / Aviation reference",
        "Web-based / Aviation data",
        "Web-based / Flight tracking",
        "Web-based / Vessel tracking",
        "Web-based / AIS tracking",
        "Web-based / Shipment tracking",
        "Web-based / Astronomy",
        "Web-based / AI geolocation",
        "Web-based / Coordinate conversion",
        "Web-based / News aggregation",
        "Web-based / News archive",
        "Web-based / Newspaper directory",
        "Web-based / Blog search",
        "Web-based / IRC client",
        "Web-based / IRC directory",
        "Web-based / Reddit archive",
        "Web-based / Shadow library",
        "Web-based / Text archive",
        "Web-based / Dictionary",
        "Web-based / Slang dictionary",
        "Web-based / Input tool",
        "Web-based / Android emulator",
        "Web-based / Android apps",
        "Web-based / Phishing intelligence feed",
        "Web-based / Phishing database",
        "Web-based / Phishing intelligence",
        "Web-based / Botnet intelligence",
        "Web-based / APT research archive",
        "Web-based / Threat feed",
        "Web-based / Abuse reporting",
        "Web-based / Abuse intelligence",
        "Web-based / Scam intelligence",
        "Web-based / IOC lookup",
        "Web-based / IOC feed",
        "Web-based / Adversary behavior framework",
        "Web-based / Security guidance",
        "Web-based / Default credential reference",
        "Web-based / Exploit database",
        "Web-based / Hash reference",
        "Web-based / Lookup utility",
        "Web-based / Category",
        "Web-based",
        "Web-Based",
        "Desktop / GUI",
        "Desktop / Reverse engineering",
        "Desktop / Digital forensics",
        "Desktop / Web proxy",
        "Desktop / Web debugging proxy",
        "Desktop / Web security proxy",
        "Desktop / Virtualization",
        "Desktop / Screen recording",
        "Desktop / Screenshot and recording",
        "Desktop / Screenshot tool",
        "Desktop / Python",
        "Desktop / CLI / Local LLM",
        "Desktop / CLI",
        "Desktop Application / GUI / CLI",
        "Desktop / Mobile browser",
        "Desktop / Legacy Office binary analysis",
        "Mobile app / Web-based",
        "Mobile app / Commercial API",
        "Mobile app / Caller ID",
        "Mobile app / Needs verification",
        "Mobile application",
        "Browser extension / Verification toolkit",
        "Browser extension / Web-based",
        "Browser extension / Developer tool",
        "Browser extension / Screenshot tool",
        "Browser extension / Screenshot",
        "Browser extension / OSINT tool",
        "Browser extension / Legacy",
        "Browser extension",
        "Browser tool / Needs verification",
        "Browser / Privacy network",
        "Browser developer tool / Discontinued",
        "Browser configuration / Needs verification",
        "PowerShell / CLI",
        "Python / CLI / GUI",
        "Python / CLI",
        "Ruby / CLI",
        "Ruby / PDF analysis",
        "Go / CLI",
        "Dataset / IP ranges",
        "Dataset / Domain list",
        "Dataset / Domain rankings",
        "Dataset / IP blocklists",
        "Dataset / Research",
        "Research dataset / Benchmark",
        "Research dataset",
        "Research framework / Python",
        "Research software / Document privacy",
        "Research tool / Needs verification",
        "Research category / Academic sources",
        "Research category / Financial intelligence",
        "Wordlists / Dataset",
        "Wordlist / Needs verification",
        "Wordlist generator / Needs verification",
        "Operating system / Security distribution",
        "Virtual machines / Testing",
        "Virtual machines / Privacy OS",
        "Live OS / Legacy",
        "Live operating system",
        "Software / Decentralized network",
        "Software / Anonymous network",
        "Open-source / Web-based / Self-hosted",
        "Open-source / Python / IOC aggregation",
        "Official lists / Screening",
        "Official database",
        "Interactive bot / Training",
        "Sandbox / Needs verification",
        "Graph analysis / Needs verification",
        "Graph-based OSINT / Commercial",
        "Category / File analysis",
        "Category / APK analysis",
        "Category / Resource collection",
        "Category / Needs verification",
        "Needs verification",
        "Unverified",
        "JavaScript library"
      ];

      // Sort by length descending to match most specific type first
      toolTypes.sort((a, b) => b.length - a.length);

      let detectedType = "Web-based";
      let toolName = "";
      let remainingBefore = workingBefore;

      for (let t of toolTypes) {
        const tIdx = remainingBefore.lastIndexOf(t);
        if (tIdx !== -1 && tIdx + t.length === remainingBefore.length) {
          detectedType = t;
          remainingBefore = remainingBefore.substring(0, tIdx).trim();
          break;
        }
      }

      // If subcategory was in remainingBefore, separate subcategory and tool name
      // e.g. "Specific Sites Amazon Usernames(M)"
      // Let's check common subcategories or detect if remainingBefore has 2 parts
      let toolSubCat = currentSubCategory;
      let candidateToolName = remainingBefore;

      // Common pattern: if candidate begins with subcategory name
      // Check if candidate starts with known subcategory
      const knownSubCats = [
        "Username Search Engines", "Specific Sites",
        "Email Search", "Common Email Formats", "Email Verification", "Breach Data", "Mail Blacklists",
        "Whois Records", "Subdomains Discovery", "Discovery", "Certificate Search", "PassiveDNS", "Reputation", "Domain Blacklists", "Typosquatting", "Analytics", "URL Expanders", "Change Detection", "Social Analysis", "DNNSEC", "Vulnerabilities", "Report Malicious Sites",
        "AWS Enumeration", "Azure/GCP Discovery", "S3/Blob Storage", "Cloud Configuration Analysis", "SaaS Footprinting",
        "Geolocation", "Host / Port Discovery", "IPv4", "IPv6", "BGP", "Blacklists", "Neighbor Domains", "Protected by Cloud Services", "Wireless Network Info", "Network Analysis Tools", "IP Loggers",
        "Search", "Instagram", "Flickr", "Metadata", "Forensics", "OCR", "Tools", "Videos", "Analyze / Record", "Webcams", "Documents", "Paste Sites", "Fonts", "Font Identification",
        "Facebook", "Fediverse/Mastodon", "Twitter", "Reddit", "LinkedIn", "TikTok", "Bluesky", "Threads", "Steam OSINT", "Other Social Networks",
        "Chat Archive Analysis", "Discord", "Resources", "Signal / Phone Lookup", "Slack", "Telegram", "WeChat / LINE", "WhatsApp",
        "General People Search", "Registries",
        "Dating",
        "Voicemail", "International", "General Lookup",
        "Property Records", "Court / Criminal Records", "Government Records", "Financial / Tax Resources", "Birth Records", "Death Records", "US County Data", "US Voter Records", "Patent Records", "US Political Records",
        "Sanctions Screening", "KYC / AML Tools", "Beneficial Ownership Lookup", "Sanctions / PEP",
        "Annual Reports", "General Info & News", "Company Profiles", "Employee Profiles & Resumes", "Additional Resources",
        "Vehicle Records", "Air Traffic Records", "Marine Records", "Railway Records", "Satellite Tracking", "Track-Trace",
        "Geolocation Tools", "Coordinates", "Map Reporting Tools", "Mobile Coverage", "Maps",
        "General Search", "Meta Search", "Code Search", "FTP Search", "Academic / Publication Search", "News Search", "Other Search", "Search Tools", "Search Engine Guides",
        "Blog Search Engines", "Discord Servers", "Forum Search Engines", "IRC Search", "Reddit Communities",
        "Web", "Data Leaks", "Public Datasets", "Other Media",
        "Text", "Pictures", "Analysis",
        "Android", "App Analysis", "Device Forensics", "iOS",
        "General Info", "Clients", "TOR Search", "TOR Directories", "Web Proxy", "Investigation Support",
        "Deepfake Detection", "Fact-checking Tools", "Reverse Media Search", "Source Verification",
        "Bitcoin", "Chain Analysis Platforms", "DeFi & DEX Tracing", "Ethereum", "Mixer Tracking", "Monero", "Multi-Chain Explorers", "NFT Provenance", "Privacy Coin Analysis", "Wallet Clustering & Address Analysis",
        "Classifieds",
        "Barcodes / QR", "JavaScript", "PHP", "XOR", "General",
        "OSINT Automation", "Graph Visualization", "Pentesting Recon", "Virtual Machines", "Wordlists", "Overview",
        "AI Detection", "AI Image Detection", "AI Chatbot", "Document Analysis", "AI Assistant", "Local AI", "OSINT Analysis", "Media Verification", "AI Monitoring", "AI Search",
        "Hosted Automated Analysis", "Office Files", "PDFs", "PCAPs",
        "Advisories", "Attack Surface / Security Testing", "Default Passwords", "Exploits", "IOC Tools", "Phishing", "Terrorism & Extremism", "Threat Feeds & Platforms", "TTPs",
        "Persona Creation", "Anonymous Browsing", "Privacy / Clean Up", "Metadata / Style",
        "Web Browsing", "Screen Capture", "Map Locations",
        "Games", "General Training"
      ];

      for (let sc of knownSubCats) {
        if (candidateToolName.startsWith(sc + " ")) {
          toolSubCat = sc;
          candidateToolName = candidateToolName.substring(sc.length).trim();
          currentSubCategory = sc;
          break;
        } else if (candidateToolName === sc) {
          toolSubCat = sc;
          currentSubCategory = sc;
          break;
        }
      }

      toolName = candidateToolName || "Unnamed Tool";
      const instructions = afterUrl.trim();

      allTools.push({
        id: allTools.length + 1,
        category: currentCategory,
        subCategory: toolSubCat,
        name: toolName,
        type: detectedType,
        url: url,
        instructions: instructions,
        indiaCompatibility: indiaCompat,
        verificationStatus: verifStatus,
        page: entry.page
      });
    }
  }

  console.log(`\n🎉 Extracted a total of ${allTools.length} tools!`);

  // Write JSON dataset
  fs.writeFileSync('osint_tools.json', JSON.stringify(allTools, null, 2));
  console.log(`Saved structured database to osint_tools.json`);

  // Create Excel workbook with SheetJS
  const wb = XLSX.utils.book_new();

  // 1. "All Tools" master sheet
  const masterData = allTools.map(t => ({
    "ID": t.id,
    "Category": t.category,
    "Sub-Category": t.subCategory,
    "Tool Name": t.name,
    "Tool Type / Notes": t.type,
    "URL": t.url,
    "Instructions": t.instructions,
    "India Compatibility": t.indiaCompatibility,
    "Verification Status": t.verificationStatus,
    "PDF Page": t.page
  }));
  const wsMaster = XLSX.utils.json_to_sheet(masterData);
  XLSX.utils.book_append_sheet(wb, wsMaster, "All Tools");

  // 2. Individual sheets for each of the 33 categories
  categoryIndex.forEach(cat => {
    const catTools = allTools.filter(t => t.category === cat.name).map((t, idx) => ({
      "#": idx + 1,
      "Sub-Category": t.subCategory,
      "Tool Name": t.name,
      "Tool Type / Notes": t.type,
      "URL": t.url,
      "Instructions": t.instructions,
      "India Compatibility": t.indiaCompatibility,
      "Verification Status": t.verificationStatus,
      "PDF Page": t.page
    }));
    const wsCat = XLSX.utils.json_to_sheet(catTools);
    // Sheet name length limit in Excel is 31 chars
    const sheetName = cat.name.substring(0, 31).replace(/[\/\\?*:[\]]/g, '_');
    XLSX.utils.book_append_sheet(wb, wsCat, sheetName);
  });

  const xlsxPath = 'OSINT_Field_Guide.xlsx';
  XLSX.writeFile(wb, xlsxPath);
  console.log(`Saved Excel workbook to ${xlsxPath}`);

  // Summary counts
  const summary = {};
  allTools.forEach(t => {
    summary[t.category] = (summary[t.category] || 0) + 1;
  });
  console.log("Category summary:", summary);
}

extractAll().catch(console.error);
