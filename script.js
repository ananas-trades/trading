let allData = [];
let currentFilter = 'all';
let currentCategory = 'all';

document.addEventListener("DOMContentLoaded", () => {
  Papa.parse("list.csv", {
    download: true,
    header: true,
    skipEmptyLines: "greedy",
    delimiter: "", // Auto-detect tab vs comma
    transformHeader: function(header) {
      return header.replace(/[\ufeff\u200b\r\n]/g, '').trim();
    },
    complete: function(results) {
      allData = results.data;
      renderCards();
    },
    error: function(err) {
      document.getElementById('stats').innerText = "Upload your 'list.csv' file to display your collection!";
    }
  });

  // Search Input Event
  document.getElementById("search-input").addEventListener("input", renderCards);

  // Format Filter Listeners
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.getAttribute("data-filter");
      renderCards();
    });
  });

  // Category Filter Listeners
  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentCategory = e.target.getAttribute("data-category");
      renderCards();
    });
  });

  // Scroll To Top Visibility & Action
  const scrollTopBtn = document.getElementById("scroll-top-btn");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add("visible");
    } else {
      scrollTopBtn.classList.remove("visible");
    }
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

// ROBUST VALUE GETTER (Tries Header Names First, then Index Position)
function getVal(item, index, ...possibleHeaders) {
  if (!item) return "";
  const values = Object.values(item);
  const keys = Object.keys(item);

  // 1. Try finding by exact or partial key name
  for (const header of possibleHeaders) {
    const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const key of keys) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanKey === cleanHeader && item[key] !== undefined && item[key] !== null) {
        const val = item[key].toString().trim();
        if (val) return val;
      }
    }
  }

  // 2. Fallback to column index position if key matching failed
  if (index !== null && index !== undefined && values[index] !== undefined && values[index] !== null) {
    return values[index].toString().trim();
  }

  return "";
}

// STRICT FILE SIZE RETRIEVAL (Index 21 / 2nd to last column)
function getFileSize(item) {
  return getVal(item, 21, "File Size", "Size", "Filesize");
}

// FORMAT RETRIEVAL (Index 22 / Last column, with fallbacks to Trader Format / Format)
function getFormat(item) {
  const traderFmt = getVal(item, 16, "Trader Format");
  if (traderFmt) return traderFmt;

  const rawFmt = getVal(item, 22, "Format");
  if (rawFmt) return rawFmt;

  return getVal(item, 15, "Release Format");
}

// SMART MEDIA TYPE CHECKER
function getMediaType(item) {
  const audioVideo = getVal(item, 0, "Audio / Video").toLowerCase();
  const typeRaw = getVal(item, 14, "Type").toLowerCase();
  const formatRaw = getFormat(item).toLowerCase();

  if (
    audioVideo.includes("audio") || 
    typeRaw.includes("audio") || 
    formatRaw.includes("audio") || 
    formatRaw.includes("mp3") || 
    formatRaw.includes("m4a") || 
    formatRaw.includes("wav") || 
    formatRaw.includes("flac") || 
    formatRaw.includes("tracked") ||
    formatRaw.includes("cd")
  ) {
    return "AUDIO";
  }

  return "VIDEO";
}

function parseEncoraDate(dateStr) {
  if (!dateStr) return null;
  const clean = dateStr.trim().replace(/\./g, '-');
  const parts = clean.split(/[-/]/);

  if (parts.length === 3) {
    let day, month, year;
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      year = parseInt(parts[2], 10);
      const p1 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[1], 10);
      day = p1;
      month = p2 - 1;
    }
    if (year && month !== undefined && day) {
      return new Date(year, month, day);
    }
  }

  const d = new Date(clean);
  return isNaN(d.getTime()) ? null : d;
}

function isNftStillActive(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lower = dateStr.toLowerCase();
  if (lower.includes("forever") || lower === "nftf" || lower.includes("master")) return true;

  const parsedDate = parseEncoraDate(dateStr);
  if (parsedDate) {
    return parsedDate >= today;
  }
  return false;
}

function renderCards() {
  const query = document.getElementById("search-input").value.toLowerCase();
  const container = document.getElementById("card-container");
  container.innerHTML = "";

  const fragment = document.createDocumentFragment();

  const filtered = allData.filter(item => {
    // 1. Format/Type Filter using the smart checker
    const displayType = getMediaType(item);
    if (currentFilter !== 'all' && displayType.toLowerCase() !== currentFilter.toLowerCase()) {
      return false;
    }

    // 2. Category Filter
    if (currentCategory !== 'all') {
      const tour = getVal(item, 2, "Tour").toLowerCase();
      const venue = getVal(item, 19, "Venue").toLowerCase();
      const locationText = `${tour} ${venue}`;

      if (currentCategory === 'off-broadway') {
        if (!locationText.includes("off-broadway") && !locationText.includes("off broadway")) return false;
      } else if (currentCategory === 'broadway') {
        if (locationText.includes("off-broadway") || locationText.includes("off broadway")) return false;
        if (!locationText.includes("broadway")) return false;
      } else if (currentCategory === 'west end') {
        if (!locationText.includes("west end")) return false;
      }
    }

    // 3. Search Bar Query
    const searchableText = Object.values(item).join(" ").toLowerCase();
    return searchableText.includes(query);
  });

  document.getElementById('stats').innerText = `SHOWING ${filtered.length} OF ${allData.length} ITEMS`;

  filtered.forEach((item, index) => {
    const card = document.createElement("div");

    // Retrieve values using Index + Header Name Strategy
    const show = getVal(item, 1, "Show") || "Unknown Show";
    const date = getVal(item, 3, "Date");
    const matineeEve = getVal(item, 4, "Matinée / Evening", "Matinee / Evening", "MatinÃ©e / Evening");
    const showTime = matineeEve ? ` (${matineeEve})` : "";
    
    // Format badge & File Size
    const format = getFormat(item);
    const sizeVal = getFileSize(item);
    const fileSize = sizeVal ? ` [${sizeVal}]` : "";

    const tour = getVal(item, 2, "Tour");
    const venue = getVal(item, 19, "Venue");
    const master = getVal(item, 5, "Master");
    const cast = getVal(item, 6, "Cast");
    const masterNotes = getVal(item, 7, "Master Notes");
    const tradingNotes = getVal(item, 8, "Trading Notes");
    const myNotes = getVal(item, 17, "My Notes");

    // Audio vs Video
    const displayType = getMediaType(item);

    // Badge HTML Construction
    const formatBadgeHTML = format ? `<span class="badge badge-format">${format}${fileSize}</span>` : '';
    const typeBadgeHTML = `<span class="badge badge-${displayType.toLowerCase()}">${displayType}</span>`;
    
    // NFT Logic
    const nftDateStr = getVal(item, 9, "NFT Date");
    const nftForeverVal = getVal(item, 10, "NFT Forever").toLowerCase();
    
    let nftForever = false;
    if (
      nftForeverVal === "true" || 
      nftForeverVal === "yes" || 
      nftForeverVal === "1" || 
      nftForeverVal === "nftf" || 
      nftForeverVal.includes("forever")
    ) {
      nftForever = true;
    }

    if (nftDateStr.toLowerCase().includes("forever") || nftDateStr.toLowerCase() === "nftf") {
      nftForever = true;
    }

    const locationParts = [tour, venue].filter(Boolean).join(" - ");

    // NFT Badge Building
    let nftBadgeHTML = '';
    let isNFTActive = false;

    if (nftForever) {
      isNFTActive = true;
      nftBadgeHTML = `<br><span class="nft-active">⛔ NFT FOREVER</span>`;
    } else if (nftDateStr !== "") {
      if (isNftStillActive(nftDateStr)) {
        isNFTActive = true;
        nftBadgeHTML = `<br><span class="nft-active">⛔ NFT UNTIL: ${nftDateStr}</span>`;
      } else {
        isNFTActive = false;
        nftBadgeHTML = `<br><span class="nft-passed">✅ PAST NFT (${nftDateStr})</span>`;
      }
    }

    // Set Base Classes
    card.className = "item-card";
    if (isNFTActive) {
      card.classList.add("card-nft-active");
    } else {
      card.classList.add("card-standard");
    }

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${show}</div>
        <div class="card-badges" style="display: flex; gap: 6px; align-items: center;">
          ${formatBadgeHTML}
          ${typeBadgeHTML}
        </div>
      </div>
      
      <div class="card-meta">
        ${date ? `📅 ${date}${showTime}` : ''} 
        ${locationParts ? `📍 ${locationParts}` : ''}
        ${master ? `<br>🎥 <strong>Master:</strong> ${master}` : ''}
        ${nftBadgeHTML}
      </div>

      ${cast ? `<div class="card-cast"><strong>CAST:</strong> ${cast}</div>` : ''}
      
      ${masterNotes ? `<div class="card-notes"><strong>MASTER NOTES:</strong> ${masterNotes}</div>` : ''}
      ${tradingNotes ? `<div class="card-notes"><strong>TRADING NOTES:</strong> ${tradingNotes}</div>` : ''}
      ${myNotes ? `<div class="card-notes"><strong>NOTES:</strong> ${myNotes}</div>` : ''}

      <div class="card-actions">
        <button class="copy-card-btn" data-index="${index}">📋 Copy Info</button>
      </div>
    `;

    // Attach click event for copy button
    const copyBtn = card.querySelector(".copy-card-btn");
    copyBtn.addEventListener("click", () => copySingleItemSummary(item, copyBtn));

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

// Function to copy a single item's summary
function copySingleItemSummary(item, buttonElement) {
  const show = getVal(item, 1, "Show") || "Unknown Show";
  const date = getVal(item, 3, "Date") || "Unknown Date";
  const tour = getVal(item, 2, "Tour");
  const venue = getVal(item, 19, "Venue");
  const master = getVal(item, 5, "Master") || "Unknown Master";
  const format = getFormat(item) || getMediaType(item);

  const location = [tour, venue].filter(Boolean).join(" - ");

  let text = `${show} - ${date} (${format})`;
  if (location) text += ` | ${location}`;
  if (master) text += ` | Master: ${master}`;

  navigator.clipboard.writeText(text).then(() => {
    const originalText = buttonElement.innerText;
    buttonElement.innerText = "✅ Copied!";
    buttonElement.classList.add("copied");

    setTimeout(() => {
      buttonElement.innerText = originalText;
      buttonElement.classList.remove("copied");
    }, 2000);
  }).catch(err => {
    console.error("Could not copy text: ", err);
  });
}
