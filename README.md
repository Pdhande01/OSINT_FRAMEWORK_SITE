# OSINT Field Guide & Intelligence Framework

A modern, interactive Open Source Intelligence (OSINT) framework and catalog featuring **1,085+ curated intelligence tools and resources** extracted from the comprehensive OSINT Field Guide.

## 🌟 Overview

The **OSINT Field Guide Framework** organizes investigative tools across core intelligence domains including:
- 🌐 **Domain & Network Intelligence** (DNS, WHOIS, IP Geolocation, Subdomains, BGP, Port Scanners)
- 👤 **People & Identity OSINT** (Usernames, Social Media, Public Records, People Search Engines)
- ✉️ **Email & Phone Intelligence** (Breach Databases, Verification, Number Portability, Reverse Lookup)
- 🛰️ **Geospatial & Imagery Intelligence (GEOINT/IMINT)** (Satellite, Street-level imagery, Metadata extraction)
- 🏢 **Corporate & Business Intelligence** (Company registries, Financial disclosures, Ownership networks)
- 📰 **Media, News & Threat Intelligence** (Archival tools, Dark web indices, Disinformation trackers)

## 🚀 Features

- **Interactive UI Dashboard**: Rapidly filter, search, bookmark, and explore tools by category, tag, and provider.
- **Direct Link Launching**: One-click navigation to verified investigative tools.
- **Clean JSON Data Structure**: Cataloged in structured JSON (`osint_tools.json`) and exported to Excel (`OSINT_Field_Guide.xlsx`).
- **Automated Extraction Scripts**: High-fidelity parser scripts to extract and clean tools from raw documents.

## 🛠️ Project Structure

```
├── public/                 # Static web assets & tools database
│   ├── data/osint_tools.json
│   ├── osint_field_guide.pdf
│   └── OSINT_Field_Guide.xlsx
├── scripts/
│   ├── app.js              # Interactive UI controller & search engine
│   └── data.js             # Client-side data store
├── styles/
│   └── index.css           # Modern dark-mode styling & glassmorphism theme
├── extract_clean.js        # Data extraction & cleansing script
├── server.js               # Local development server
├── index.html              # Main framework interface
└── package.json            # Node.js dependencies & scripts
```

## 💻 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone <REPO_URL>
   cd "OSINT Framework"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## 📜 Scripts

- `npm run dev` / `npm start`: Starts the local HTTP server.
- `npm run extract`: Re-runs the extraction and formatting pipeline on the field guide documents.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
