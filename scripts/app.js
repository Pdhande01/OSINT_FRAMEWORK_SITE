/**
 * OSINT Field Guide & Intelligence Framework - Core Web App Logic
 * 1,085 catalogued intelligence tools across 33 categories
 */

(function () {
  'use strict';

  // 1. Data Store
  let tools = window.OSINT_TOOLS_DATA || [];
  let starredToolIds = new Set(JSON.parse(localStorage.getItem('osint_starred_tools') || '[]'));
  let currentCategory = 'ALL';
  let currentView = 'grid'; // 'grid' | 'tree' | 'table'
  let activeFilters = {
    search: '',
    type: 'ALL',
    indiaCompat: 'ALL',
    verifStatus: 'ALL'
  };

  // Category Icon Registry
  const CATEGORY_ICONS = {
    'Username': '👤',
    'Email Address': '✉️',
    'Domain Name': '🌐',
    'Cloud Infrastructure': '☁️',
    'IP and MAC address': '📡',
    'Image,Videos,Webcam,Documents,F': '🖼️',
    'Socials Network': '👥',
    'Instant Messaging': '💬',
    'People Search Engines': '🔍',
    'Dating': '❤️',
    'Telephone Numbers': '📞',
    'Public Records': '🏛️',
    'Compliance & Risk Compliance': '⚖️',
    'Buisness records': '🏢',
    'Transportation': '✈️',
    'Geolocation tools': '🗺️',
    'Search Engines': '🔎',
    'Online communities': '🌐',
    'Archives': '🏛️',
    'Language Translation': '🗣️',
    'Mobile OSINt': '📱',
    'Dark web': '🧅',
    'Disinformation & Media Verifica': '📰',
    'Blockchain&Cryptocurrency': '⛓️',
    'Classifieds': '🏷️',
    'Encoding & Decoding': '🔐',
    'Tools': '🛠️',
    'AI Tools': '🤖',
    'Malicious File Analysis': '🦠',
    'Cyber Threat Intelligence': '🛡️',
    'OpSec': '🕶️',
    'Documentation &Evidence Captur': '📸',
    'Training': '🎓'
  };

  // DOM Elements
  const headerToolCount = document.getElementById('headerToolCount');
  const statUsefulCount = document.getElementById('statUsefulCount');
  const statCliCount = document.getElementById('statCliCount');
  const statWebCount = document.getElementById('statWebCount');
  const dossierCountBadge = document.getElementById('dossierCountBadge');

  const categorySidebarList = document.getElementById('categorySidebarList');
  const btnSelectAllCategories = document.getElementById('btnSelectAllCategories');

  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const filterType = document.getElementById('filterType');
  const filterIndiaCompat = document.getElementById('filterIndiaCompat');
  const filterVerifStatus = document.getElementById('filterVerifStatus');
  const btnResetFilters = document.getElementById('btnResetFilters');
  const resultsCountDisplay = document.getElementById('resultsCountDisplay');

  const viewGridContainer = document.getElementById('viewGridContainer');
  const viewTreeContainer = document.getElementById('viewTreeContainer');
  const viewTableContainer = document.getElementById('viewTableContainer');
  const treeNodeMount = document.getElementById('treeNodeMount');
  const tableBodyMount = document.getElementById('tableBodyMount');
  const btnExpandAllTree = document.getElementById('btnExpandAllTree');

  const tabViewGrid = document.getElementById('tabViewGrid');
  const tabViewTree = document.getElementById('tabViewTree');
  const tabViewTable = document.getElementById('tabViewTable');

  const pivotTargetType = document.getElementById('pivotTargetType');
  const pivotTargetInput = document.getElementById('pivotTargetInput');
  const btnFilterTargetCategory = document.getElementById('btnFilterTargetCategory');
  const quickLaunchChipsContainer = document.getElementById('quickLaunchChipsContainer');

  const btnOpenDossier = document.getElementById('btnOpenDossier');
  const caseDossierDrawer = document.getElementById('caseDossierDrawer');
  const closeDossierBtn = document.getElementById('closeDossierBtn');
  const dossierItemsList = document.getElementById('dossierItemsList');
  const btnClearDossier = document.getElementById('btnClearDossier');
  const btnExportDossier = document.getElementById('btnExportDossier');

  const toolDetailModal = document.getElementById('toolDetailModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalBodyMount = document.getElementById('modalBodyMount');
  const toastContainer = document.getElementById('toastContainer');

  // 2. Initialize App
  function init() {
    updateHeaderStats();
    buildCategorySidebar();
    setupTargetPivotEngine();
    renderAllViews();
    attachEventListeners();
  }

  // 3. Stats Summary
  function updateHeaderStats() {
    const total = tools.length;
    const useful = tools.filter(t => t.indiaCompatibility.toLowerCase() === 'useful').length;
    const cli = tools.filter(t => t.type.toLowerCase().includes('cli') || t.type.toLowerCase().includes('python')).length;
    const web = tools.filter(t => t.type.toLowerCase().includes('web')).length;

    headerToolCount.textContent = total.toLocaleString();
    statUsefulCount.textContent = useful.toLocaleString();
    statCliCount.textContent = cli.toLocaleString();
    statWebCount.textContent = web.toLocaleString();
    dossierCountBadge.textContent = starredToolIds.size;
  }

  // 4. Sidebar Categories
  function buildCategorySidebar() {
    const counts = {};
    tools.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });

    const categories = Object.keys(counts).sort((a, b) => a.localeCompare(b));
    let html = '';

    categories.forEach(cat => {
      const icon = CATEGORY_ICONS[cat] || '📁';
      const isActive = currentCategory === cat ? 'active' : '';
      html += `
        <div class="category-item ${isActive}" data-category="${escapeHtml(cat)}">
          <div class="category-item-left">
            <span class="cat-icon">${icon}</span>
            <span class="cat-name">${escapeHtml(cat)}</span>
          </div>
          <span class="cat-count">${counts[cat]}</span>
        </div>
      `;
    });

    categorySidebarList.innerHTML = html;

    // Attach click handlers
    categorySidebarList.querySelectorAll('.category-item').forEach(el => {
      el.addEventListener('click', () => {
        const selectedCat = el.getAttribute('data-category');
        setCategory(selectedCat);
      });
    });
  }

  function setCategory(cat) {
    currentCategory = cat;
    categorySidebarList.querySelectorAll('.category-item').forEach(el => {
      if (el.getAttribute('data-category') === cat) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
    renderAllViews();
  }

  // 5. Target Pivot & Direct Launcher
  function setupTargetPivotEngine() {
    const pivotTemplates = {
      username: [
        { label: 'WhatsMyName', url: 'https://whatsmyname.io/' },
        { label: 'That\'s Them', url: 'https://thatsthem.com/' },
        { label: 'Namechk', url: 'https://namechk.com/' },
        { label: 'Lullar', url: 'https://com.lullar.com/' }
      ],
      domain: [
        { label: 'Who.is', url: 'https://who.is/whois/{target}' },
        { label: 'ViewDNS', url: 'https://viewdns.info/dnsrecord/?domain={target}' },
        { label: 'Shodan Domain', url: 'https://www.shodan.io/search?query=hostname:{target}' },
        { label: 'Crt.sh (SSL)', url: 'https://crt.sh/?q={target}' },
        { label: 'urlscan.io', url: 'https://urlscan.io/search/#{target}' }
      ],
      ip: [
        { label: 'Shodan IP', url: 'https://www.shodan.io/host/{target}' },
        { label: 'Censys IP', url: 'https://search.censys.io/hosts/{target}' },
        { label: 'IP2Location', url: 'https://www.ip2location.com/demo/{target}' },
        { label: 'GreyNoise', url: 'https://viz.greynoise.io/ip/{target}' },
        { label: 'IPVoid', url: 'https://www.ipvoid.com/ip-blacklist-check/' }
      ],
      email: [
        { label: 'HaveIBeenPwned', url: 'https://haveibeenpwned.com/' },
        { label: 'Hunter.io', url: 'https://hunter.io/search/{target}' },
        { label: 'EmailRep.io', url: 'https://emailrep.io/{target}' },
        { label: 'DeHashed', url: 'https://dehashed.com/search?query={target}' }
      ],
      phone: [
        { label: 'Truecaller', url: 'https://www.truecaller.com/search/in/{target}' },
        { label: 'Phone Validator', url: 'https://www.phonevalidator.com/' },
        { label: 'Spy Dialer', url: 'https://www.spydialer.com/' }
      ],
      crypto: [
        { label: 'Blockchair Search', url: 'https://blockchair.com/search?q={target}' },
        { label: 'Etherscan', url: 'https://etherscan.io/address/{target}' },
        { label: 'BitcoinAbuse', url: 'https://www.bitcoinabuse.com/reports/{target}' },
        { label: 'Breadcrumbs', url: 'https://www.breadcrumbs.app/' }
      ]
    };

    function updateChips() {
      const type = pivotTargetType.value;
      const targetVal = pivotTargetInput.value.trim();
      const list = pivotTemplates[type] || [];

      let html = `<span class="quick-launch-label">Direct 1-Click Launch:</span>`;
      list.forEach(item => {
        let finalUrl = item.url;
        if (targetVal) {
          finalUrl = finalUrl.replace('{target}', encodeURIComponent(targetVal));
        } else {
          finalUrl = finalUrl.replace('{target}', '');
        }
        html += `<button class="chip-btn" data-url="${escapeHtml(finalUrl)}">${escapeHtml(item.label)}</button>`;
      });

      quickLaunchChipsContainer.innerHTML = html;

      // Chip click listener
      quickLaunchChipsContainer.querySelectorAll('.chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const url = btn.getAttribute('data-url');
          if (url && url !== '#') {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        });
      });
    }

    pivotTargetType.addEventListener('change', () => {
      // Auto-filter category to match selected pivot
      const typeToCat = {
        username: 'Username',
        domain: 'Domain Name',
        ip: 'IP and MAC address',
        email: 'Email Address',
        phone: 'Telephone Numbers',
        crypto: 'Blockchain&Cryptocurrency'
      };
      const cat = typeToCat[pivotTargetType.value];
      if (cat) {
        setCategory(cat);
      }
      updateChips();
    });

    pivotTargetInput.addEventListener('input', updateChips);

    btnFilterTargetCategory.addEventListener('click', () => {
      const typeToCat = {
        username: 'Username',
        domain: 'Domain Name',
        ip: 'IP and MAC address',
        email: 'Email Address',
        phone: 'Telephone Numbers',
        crypto: 'Blockchain&Cryptocurrency'
      };
      const cat = typeToCat[pivotTargetType.value];
      if (cat) {
        setCategory(cat);
      }
    });

    updateChips();
  }

  // 6. Filtering Logic
  function getFilteredTools() {
    const q = activeFilters.search.toLowerCase().trim();
    const typeFilter = activeFilters.type.toLowerCase();
    const indiaFilter = activeFilters.indiaCompat.toLowerCase();
    const verifFilter = activeFilters.verifStatus.toLowerCase();

    return tools.filter(t => {
      // Category filter
      if (currentCategory !== 'ALL' && t.category !== currentCategory) {
        return false;
      }

      // Keyword search
      if (q) {
        const inName = t.name.toLowerCase().includes(q);
        const inCategory = t.category.toLowerCase().includes(q);
        const inSubCat = t.subCategory.toLowerCase().includes(q);
        const inType = t.type.toLowerCase().includes(q);
        const inUrl = t.url.toLowerCase().includes(q);
        const inInst = t.instructions.toLowerCase().includes(q);
        if (!inName && !inCategory && !inSubCat && !inType && !inUrl && !inInst) {
          return false;
        }
      }

      // Tool Type filter
      if (typeFilter !== 'all') {
        const toolTypeLower = t.type.toLowerCase();
        if (typeFilter === 'cli') {
          if (!toolTypeLower.includes('cli') && !toolTypeLower.includes('python') && !toolTypeLower.includes('script')) return false;
        } else if (typeFilter === 'dataset') {
          if (!toolTypeLower.includes('dataset') && !toolTypeLower.includes('wordlist') && !toolTypeLower.includes('list')) return false;
        } else if (!toolTypeLower.includes(typeFilter)) {
          return false;
        }
      }

      // India Compatibility filter
      if (indiaFilter !== 'all') {
        if (!t.indiaCompatibility.toLowerCase().includes(indiaFilter)) {
          return false;
        }
      }

      // Verification Status filter
      if (verifFilter !== 'all') {
        if (!t.verificationStatus.toLowerCase().includes(verifFilter)) {
          return false;
        }
      }

      return true;
    });
  }

  // 7. Render Views
  function renderAllViews() {
    const filtered = getFilteredTools();

    // Update Result count display
    const catLabel = currentCategory === 'ALL' ? 'all categories' : `<strong>${escapeHtml(currentCategory)}</strong>`;
    resultsCountDisplay.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${tools.length}</strong> tools in ${catLabel}`;

    if (currentView === 'grid') {
      renderGridView(filtered);
    } else if (currentView === 'tree') {
      renderTreeView(filtered);
    } else if (currentView === 'table') {
      renderTableView(filtered);
    }
  }

  // View 1: Card Grid
  function renderGridView(list) {
    if (list.length === 0) {
      viewGridContainer.innerHTML = `
        <div class="no-results-box" style="grid-column: 1 / -1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          <h3 style="margin-bottom: 6px; color: var(--text-main);">No OSINT tools match your filter criteria</h3>
          <p style="font-size: 0.88rem;">Try clearing the search query or selecting "All Types" / "Show All".</p>
        </div>
      `;
      return;
    }

    // Limit rendering for super-smooth DOM (render first 150 items with load more if list is large)
    const MAX_ITEMS = 120;
    const itemsToRender = list.slice(0, MAX_ITEMS);

    let html = '';
    itemsToRender.forEach(tool => {
      const isStarred = starredToolIds.has(tool.id);
      const starClass = isStarred ? 'starred' : '';
      const starIcon = isStarred ? '★' : '☆';

      // Type Badge
      const typeBadgeClass = getTypeBadgeClass(tool.type);

      // India Compat Badge
      const compatBadgeClass = getCompatBadgeClass(tool.indiaCompatibility);

      // CLI or Web URL
      const isCli = tool.type.toLowerCase().includes('cli') || tool.type.toLowerCase().includes('python');
      const hasUrl = tool.url && tool.url.startsWith('http');

      html += `
        <div class="tool-card" data-id="${tool.id}">
          <div>
            <div class="tool-card-top">
              <div>
                <div class="tool-breadcrumbs">
                  <span>${escapeHtml(tool.category)}</span>
                  <span class="sep">›</span>
                  <span>${escapeHtml(tool.subCategory)}</span>
                </div>
                <h4 class="tool-name">${escapeHtml(tool.name)}</h4>
              </div>
              <button class="tool-star-btn ${starClass}" data-id="${tool.id}" title="${isStarred ? 'Remove from Case Dossier' : 'Bookmark to Case Dossier'}">
                ${starIcon}
              </button>
            </div>

            <div class="tool-badges-row" style="margin-top: 10px;">
              <span class="badge ${typeBadgeClass}">${escapeHtml(tool.type)}</span>
              <span class="badge ${compatBadgeClass}">🇮🇳 ${escapeHtml(tool.indiaCompatibility)}</span>
              <span class="badge badge-verif">${escapeHtml(tool.verificationStatus)}</span>
            </div>

            <p class="tool-instructions" style="margin-top: 12px;">
              ${escapeHtml(tool.instructions || 'Review linked repository and framework notes for instructions.')}
            </p>
          </div>

          <div class="tool-card-footer">
            <span class="tool-page-indicator">PDF Pg ${tool.page}</span>
            <div class="tool-actions-group">
              ${hasUrl ? `
                <a href="${escapeHtml(tool.url)}" target="_blank" rel="noopener noreferrer" class="btn-icon-action primary" title="Open resource">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  <span>Launch</span>
                </a>
              ` : `
                <button class="btn-icon-action" style="opacity: 0.6; cursor: default;">
                  <span>${escapeHtml(tool.url || 'N/A')}</span>
                </button>
              `}
              <button class="btn-icon-action btn-copy-url" data-url="${escapeHtml(tool.url)}" title="Copy link or instructions">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>Copy</span>
              </button>
              <button class="btn-icon-action btn-inspect" data-id="${tool.id}" title="View full specifications">
                <span>Details</span>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    if (list.length > MAX_ITEMS) {
      html += `
        <div style="grid-column: 1 / -1; text-align: center; padding: 20px;">
          <p style="color: var(--text-dim); margin-bottom: 10px; font-family: var(--font-mono);">
            Showing first ${MAX_ITEMS} of ${list.length} results. Use the search bar or filters to pinpoint specific tools.
          </p>
        </div>
      `;
    }

    viewGridContainer.innerHTML = html;

    // Attach card event listeners
    viewGridContainer.querySelectorAll('.tool-star-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStarTool(parseInt(btn.getAttribute('data-id'), 10));
      });
    });

    viewGridContainer.querySelectorAll('.btn-copy-url').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = btn.getAttribute('data-url');
        copyToClipboard(text, 'Copied tool URL to clipboard!');
      });
    });

    viewGridContainer.querySelectorAll('.btn-inspect').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openToolModal(parseInt(btn.getAttribute('data-id'), 10));
      });
    });
  }

  // View 2: Tree Explorer (Interactive Branches)
  function renderTreeView(list) {
    // Group tools by Category -> SubCategory
    const tree = {};
    list.forEach(t => {
      if (!tree[t.category]) tree[t.category] = {};
      if (!tree[t.category][t.subCategory]) tree[t.category][t.subCategory] = [];
      tree[t.category][t.subCategory].push(t);
    });

    let html = `<ul class="tree-node-list">`;

    Object.keys(tree).sort().forEach(cat => {
      const subCats = tree[cat];
      const catCount = Object.values(subCats).reduce((acc, curr) => acc + curr.length, 0);
      const icon = CATEGORY_ICONS[cat] || '📁';

      html += `
        <li class="tree-node-item">
          <button class="tree-node-toggle" data-target="cat-${sanitizeId(cat)}">
            <span class="arrow">▶</span>
            <span>${icon} <strong>${escapeHtml(cat)}</strong> (${catCount})</span>
          </button>
          <div class="tree-children-container" id="cat-${sanitizeId(cat)}">
            <ul class="tree-node-list">
      `;

      Object.keys(subCats).sort().forEach(sub => {
        const toolList = subCats[sub];
        html += `
          <li class="tree-node-item">
            <button class="tree-node-toggle" data-target="sub-${sanitizeId(cat)}-${sanitizeId(sub)}">
              <span class="arrow">▶</span>
              <span>📂 ${escapeHtml(sub)} (${toolList.length})</span>
            </button>
            <div class="tree-children-container" id="sub-${sanitizeId(cat)}-${sanitizeId(sub)}">
              <ul style="list-style: none; padding-left: 12px; margin-top: 6px;">
        `;

        toolList.forEach(tool => {
          const hasUrl = tool.url && tool.url.startsWith('http');
          html += `
            <li class="tree-tool-leaf">
              <span>▫</span>
              <strong style="color: #fff;">${escapeHtml(tool.name)}</strong>
              <span class="badge ${getTypeBadgeClass(tool.type)}" style="font-size: 0.65rem;">${escapeHtml(tool.type)}</span>
              ${hasUrl ? `<a href="${escapeHtml(tool.url)}" target="_blank" rel="noopener noreferrer">↗ Open</a>` : ''}
              <span style="font-size: 0.72rem; color: var(--text-dim); margin-left: auto;">${escapeHtml(tool.indiaCompatibility)}</span>
            </li>
          `;
        });

        html += `
              </ul>
            </div>
          </li>
        `;
      });

      html += `
            </ul>
          </div>
        </li>
      `;
    });

    html += `</ul>`;
    treeNodeMount.innerHTML = html;

    // Toggle expand/collapse
    treeNodeMount.querySelectorAll('.tree-node-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const container = document.getElementById(targetId);
        if (container) {
          const isOpen = container.classList.toggle('open');
          btn.classList.toggle('expanded', isOpen);
        }
      });
    });
  }

  // View 3: Table View
  function renderTableView(list) {
    if (list.length === 0) {
      tableBodyMount.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-dim);">No tools matched</td></tr>`;
      return;
    }

    const MAX_TABLE_ITEMS = 200;
    let html = '';

    list.slice(0, MAX_TABLE_ITEMS).forEach((tool, idx) => {
      const hasUrl = tool.url && tool.url.startsWith('http');
      html += `
        <tr style="border-bottom: 1px solid var(--border-subtle); transition: background 0.15s;" onmouseover="this.style.background='rgba(56,189,248,0.05)'" onmouseout="this.style.background='transparent'">
          <td style="padding: 10px; font-family: var(--font-mono); color: var(--text-dim);">${idx + 1}</td>
          <td style="padding: 10px; font-weight: 600; color: #fff;">
            ${escapeHtml(tool.name)}
            ${starredToolIds.has(tool.id) ? '<span style="color: var(--accent-amber);">★</span>' : ''}
          </td>
          <td style="padding: 10px; color: var(--accent-cyan);">${escapeHtml(tool.category)}</td>
          <td style="padding: 10px; color: var(--text-muted);">${escapeHtml(tool.subCategory)}</td>
          <td style="padding: 10px;"><span class="badge ${getTypeBadgeClass(tool.type)}">${escapeHtml(tool.type)}</span></td>
          <td style="padding: 10px;"><span class="badge ${getCompatBadgeClass(tool.indiaCompatibility)}">${escapeHtml(tool.indiaCompatibility)}</span></td>
          <td style="padding: 10px;">
            <div style="display: flex; gap: 6px;">
              ${hasUrl ? `<a href="${escapeHtml(tool.url)}" target="_blank" rel="noopener noreferrer" class="btn-icon-action primary" style="padding: 4px 8px; font-size: 0.75rem;">Open</a>` : ''}
              <button class="btn-icon-action" onclick="window.inspectTool(${tool.id})" style="padding: 4px 8px; font-size: 0.75rem;">View</button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBodyMount.innerHTML = html;
  }

  // 8. Tool Modal
  function openToolModal(id) {
    const tool = tools.find(t => t.id === id);
    if (!tool) return;

    const isStarred = starredToolIds.has(tool.id);
    const hasUrl = tool.url && tool.url.startsWith('http');
    const isCli = tool.type.toLowerCase().includes('cli') || tool.type.toLowerCase().includes('python');

    modalBodyMount.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-cyan);">
        <span>${escapeHtml(tool.category)}</span>
        <span>›</span>
        <span>${escapeHtml(tool.subCategory)}</span>
      </div>
      <h2 style="font-size: 1.5rem; color: #fff; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
        <span>${escapeHtml(tool.name)}</span>
        <button id="modalStarBtn" class="tool-star-btn ${isStarred ? 'starred' : ''}" style="font-size: 1.4rem;">
          ${isStarred ? '★' : '☆'}
        </button>
      </h2>

      <div class="tool-badges-row" style="margin-bottom: 20px;">
        <span class="badge ${getTypeBadgeClass(tool.type)}">${escapeHtml(tool.type)}</span>
        <span class="badge ${getCompatBadgeClass(tool.indiaCompatibility)}">🇮🇳 India: ${escapeHtml(tool.indiaCompatibility)}</span>
        <span class="badge badge-verif">Verification: ${escapeHtml(tool.verificationStatus)}</span>
        <span class="badge badge-verif">PDF Source: Page ${tool.page}</span>
      </div>

      <div style="background: var(--bg-primary); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 18px;">
        <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-dim); font-family: var(--font-mono); margin-bottom: 6px;">
          Resource Destination / Repository:
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; word-break: break-all;">
          <a href="${escapeHtml(tool.url)}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-cyan); font-family: var(--font-mono); font-size: 0.9rem; text-decoration: underline;">
            ${escapeHtml(tool.url)}
          </a>
          <button class="btn-icon-action" id="modalCopyUrlBtn">Copy</button>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 0.9rem; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px; font-family: var(--font-mono);">
          Operational Instructions & Usage Notes:
        </h4>
        <p style="font-size: 0.95rem; color: var(--text-main); line-height: 1.6; background: rgba(255,255,255,0.02); padding: 14px; border-radius: var(--radius-sm); border-left: 3px solid var(--accent-cyan);">
          ${escapeHtml(tool.instructions || 'Follow the original framework node and review linked repository documentation.')}
        </p>
      </div>

      ${isCli && hasUrl && tool.url.includes('github.com') ? `
        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 0.82rem; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px; font-family: var(--font-mono);">
            Quick Terminal Clone Command:
          </h4>
          <div style="background: #000; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
            <code style="color: var(--accent-emerald); font-family: var(--font-mono); font-size: 0.85rem;">git clone ${escapeHtml(tool.url)}.git</code>
            <button class="btn-icon-action" id="modalCopyCloneBtn">Copy Command</button>
          </div>
        </div>
      ` : ''}

      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; border-top: 1px solid var(--border-subtle); padding-top: 16px;">
        <button class="btn-action" id="modalCloseActionBtn">Close</button>
        ${hasUrl ? `
          <a href="${escapeHtml(tool.url)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-excel">
            <span>Launch Resource</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>
        ` : ''}
      </div>
    `;

    toolDetailModal.classList.add('open');

    // Modal action listeners
    document.getElementById('modalStarBtn').addEventListener('click', () => {
      toggleStarTool(tool.id);
      openToolModal(tool.id); // refresh modal view
    });

    document.getElementById('modalCopyUrlBtn').addEventListener('click', () => {
      copyToClipboard(tool.url, 'Copied URL to clipboard!');
    });

    const cloneBtn = document.getElementById('modalCopyCloneBtn');
    if (cloneBtn) {
      cloneBtn.addEventListener('click', () => {
        copyToClipboard(`git clone ${tool.url}.git`, 'Copied git clone command!');
      });
    }

    document.getElementById('modalCloseActionBtn').addEventListener('click', () => {
      toolDetailModal.classList.remove('open');
    });
  }

  window.inspectTool = openToolModal;

  // 9. Case Dossier (Bookmarks)
  function toggleStarTool(id) {
    if (starredToolIds.has(id)) {
      starredToolIds.delete(id);
      showToast('Removed tool from Case Dossier');
    } else {
      starredToolIds.add(id);
      showToast('Added tool to Case Dossier ★');
    }
    localStorage.setItem('osint_starred_tools', JSON.stringify(Array.from(starredToolIds)));
    dossierCountBadge.textContent = starredToolIds.size;
    renderAllViews();
    renderDossierDrawer();
  }

  function renderDossierDrawer() {
    const starredList = tools.filter(t => starredToolIds.has(t.id));
    if (starredList.length === 0) {
      dossierItemsList.innerHTML = `
        <div style="text-align: center; padding: 40px 10px; color: var(--text-dim);">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 10px;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          <p>No tools saved in active case dossier.</p>
          <p style="font-size: 0.78rem; margin-top: 4px;">Click the star icon (☆) on any tool card to bookmark it here for your investigation.</p>
        </div>
      `;
      return;
    }

    let html = '';
    starredList.forEach(tool => {
      const hasUrl = tool.url && tool.url.startsWith('http');
      html += `
        <div class="dossier-item">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <div>
              <div style="font-size: 0.72rem; color: var(--accent-cyan); font-family: var(--font-mono);">${escapeHtml(tool.category)}</div>
              <strong style="color: #fff; font-size: 0.95rem;">${escapeHtml(tool.name)}</strong>
            </div>
            <button class="tool-star-btn starred" onclick="window.unstar(${tool.id})" title="Remove">✕</button>
          </div>
          <div style="display: flex; gap: 6px; margin: 8px 0;">
            <span class="badge ${getTypeBadgeClass(tool.type)}" style="font-size: 0.65rem;">${escapeHtml(tool.type)}</span>
            <span class="badge ${getCompatBadgeClass(tool.indiaCompatibility)}" style="font-size: 0.65rem;">${escapeHtml(tool.indiaCompatibility)}</span>
          </div>
          ${hasUrl ? `
            <a href="${escapeHtml(tool.url)}" target="_blank" rel="noopener noreferrer" style="font-size: 0.78rem; color: var(--accent-cyan); text-decoration: underline; word-break: break-all;">
              ${escapeHtml(tool.url)}
            </a>
          ` : ''}
        </div>
      `;
    });

    dossierItemsList.innerHTML = html;
  }

  window.unstar = (id) => toggleStarTool(id);

  // 10. Event Listeners & Shortcuts
  function attachEventListeners() {
    // Search input debounced
    searchInput.addEventListener('input', (e) => {
      activeFilters.search = e.target.value;
      searchClearBtn.style.display = activeFilters.search ? 'block' : 'none';
      renderAllViews();
    });

    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      activeFilters.search = '';
      searchClearBtn.style.display = 'none';
      renderAllViews();
      searchInput.focus();
    });

    // Filters
    filterType.addEventListener('change', (e) => {
      activeFilters.type = e.target.value;
      renderAllViews();
    });

    filterIndiaCompat.addEventListener('change', (e) => {
      activeFilters.indiaCompat = e.target.value;
      renderAllViews();
    });

    filterVerifStatus.addEventListener('change', (e) => {
      activeFilters.verifStatus = e.target.value;
      renderAllViews();
    });

    btnResetFilters.addEventListener('click', () => {
      searchInput.value = '';
      searchClearBtn.style.display = 'none';
      filterType.value = 'ALL';
      filterIndiaCompat.value = 'ALL';
      filterVerifStatus.value = 'ALL';
      activeFilters = { search: '', type: 'ALL', indiaCompat: 'ALL', verifStatus: 'ALL' };
      setCategory('ALL');
    });

    btnSelectAllCategories.addEventListener('click', () => {
      setCategory('ALL');
    });

    // View Tabs
    const tabs = [tabViewGrid, tabViewTree, tabViewTable];
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentView = tab.getAttribute('data-view');

        viewGridContainer.style.display = currentView === 'grid' ? 'grid' : 'none';
        viewTreeContainer.style.display = currentView === 'tree' ? 'block' : 'none';
        viewTableContainer.style.display = currentView === 'table' ? 'block' : 'none';

        renderAllViews();
      });
    });

    // Tree Expand All
    btnExpandAllTree.addEventListener('click', () => {
      const allContainers = treeNodeMount.querySelectorAll('.tree-children-container');
      const allToggles = treeNodeMount.querySelectorAll('.tree-node-toggle');
      const isAnyClosed = Array.from(allContainers).some(c => !c.classList.contains('open'));

      allContainers.forEach(c => {
        if (isAnyClosed) c.classList.add('open');
        else c.classList.remove('open');
      });
      allToggles.forEach(t => {
        if (isAnyClosed) t.classList.add('expanded');
        else t.classList.remove('expanded');
      });
      btnExpandAllTree.textContent = isAnyClosed ? 'Collapse All' : 'Expand All';
    });

    // Dossier Drawer Toggle
    btnOpenDossier.addEventListener('click', () => {
      renderDossierDrawer();
      caseDossierDrawer.classList.add('open');
    });

    closeDossierBtn.addEventListener('click', () => {
      caseDossierDrawer.classList.remove('open');
    });

    btnClearDossier.addEventListener('click', () => {
      if (confirm('Clear all tools from your active case dossier?')) {
        starredToolIds.clear();
        localStorage.removeItem('osint_starred_tools');
        dossierCountBadge.textContent = '0';
        renderDossierDrawer();
        renderAllViews();
        showToast('Cleared dossier');
      }
    });

    btnExportDossier.addEventListener('click', () => {
      const starredList = tools.filter(t => starredToolIds.has(t.id));
      const report = {
        investigationDate: new Date().toISOString(),
        totalSavedTools: starredList.length,
        tools: starredList
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `osint_case_dossier_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported Case Dossier report!');
    });

    // Modal Close
    modalCloseBtn.addEventListener('click', () => {
      toolDetailModal.classList.remove('open');
    });

    toolDetailModal.addEventListener('click', (e) => {
      if (e.target === toolDetailModal) {
        toolDetailModal.classList.remove('open');
      }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      } else if (e.key === '/' && document.activeElement !== searchInput && document.activeElement !== pivotTargetInput) {
        e.preventDefault();
        searchInput.focus();
      } else if (e.key === 'Escape') {
        toolDetailModal.classList.remove('open');
        caseDossierDrawer.classList.remove('open');
      }
    });
  }

  // Helper Badge Classes
  function getTypeBadgeClass(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('cli') || t.includes('python') || t.includes('script') || t.includes('powershell')) return 'badge-type-cli';
    if (t.includes('api')) return 'badge-type-api';
    if (t.includes('dataset') || t.includes('wordlist') || t.includes('range')) return 'badge-type-dataset';
    if (t.includes('desktop') || t.includes('gui')) return 'badge-type-gui';
    return 'badge-type-web';
  }

  function getCompatBadgeClass(compat) {
    const c = (compat || '').toLowerCase();
    if (c === 'useful') return 'badge-compat-useful';
    if (c.includes('review')) return 'badge-compat-review';
    return 'badge-compat-notuseful';
  }

  // Toast System
  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>${escapeHtml(msg)}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2500);
  }

  function copyToClipboard(text, successMsg) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg);
      }).catch(() => {
        fallbackCopy(text, successMsg);
      });
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(successMsg);
    } catch (err) {
      alert('Copy failed: ' + text);
    }
    ta.remove();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function sanitizeId(str) {
    return (str || '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  }

  // Start app
  init();
})();
