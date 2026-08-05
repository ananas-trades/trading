let allData = [];
let currentFilter = 'all';
let currentCategory = 'all';

document.addEventListener("DOMContentLoaded", () => {
  Papa.parse("list.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    // Fix #1: Strip hidden UTF-8 BOM (\ufeff) and whitespace from header names
    transformHeader: function(header) {
      return header.replace(/^\ufeff/, '').trim();
    },
    complete: function(results) {
      allData = results.data;
      
      // Fix #2: Console log the exact headers parsed from your CSV
      if (allData.length > 0) {
        console.log("🔍 DETECTED CSV HEADERS:", Object.keys(allData[0]));
      }

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

// Helper to clean and compare header keys flexibly
function cleanKey(str) {
  return (str || "").replace(/^\ufeff/, '').trim().toLowerCase();
}

// Case-insensitive & BOM-safe header lookup
function getVal(item, ...headers) {
  if (!item) return "";
  const keys = Object.keys(item);
  for (const h of headers) {
    const target = cleanKey(h);
    const matchedKey = keys.find(k => cleanKey(k) === target);
    if (matchedKey && item[matchedKey] !== undefined && item[matchedKey] !== null) {
      const val = item[matchedKey].toString().trim();
      if (val) return val;
    }
  }
  return "";
}

// STRICT FILE SIZE EXTRACTOR (Ignores "Release Format")
function getFileSize(item) {
  if (!item) return "";
  
  // 1. Direct header matches first
  const exact = getVal(item, "File Size", "File size", "Size", "Filesize", "Size (GB)", "Size (MB)");
  if (exact) return exact;

  // 2. Fallback: Search for any column name containing "size" but NOT "format"
  for (const k in item) {
    const kClean = cleanKey(k);
    if (kClean.includes("size") && !kClean.includes("format")) {
      const val = (item[k] || "").toString().trim();
      if (val) return val;
    }
  }

  return "";
}

// STRICT FORMAT EXTRACTOR
function getFormat(item) {
  return getVal(item, "Trader Format", "Format", "Release Format", "Media Format");
}

// SMART MEDIA TYPE CHECKER
function getMediaType(item) {
  const typeRaw = getVal(item, "Type", "Media Type").toLowerCase();
  const formatRaw = getFormat(item).toLowerCase();
  
  if (
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
      const tour = getVal(item, "Tour").toLowerCase();
      const venue = getVal(item, "Venue").toLowerCase();
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

    // Encora & File Headers
    const show = getVal(item, "Show", "Show Name", "Title") || "Unknown Show";
    const date = getVal(item, "Date");
    const rawTime = getVal(item, "Show time", "Show Time", "Time");
    const showTime = rawTime ? ` (${rawTime})` : "";
    
    // Explicit format and size isolation
    const format = getFormat(item);
    const sizeVal = getFileSize(item);
    const fileSize = sizeVal ? ` [${sizeVal}]` : "";

    const tour = getVal(item, "Tour");
    const venue = getVal(item, "Venue");
    const master = getVal(item, "Master");
    const cast = getVal(item, "Cast");
    const masterNotes = getVal(item, "Master Notes");
    const tradingNotes = getVal(item, "Trading Notes");
    const myNotes = getVal(item, "My Notes", "Notes");

    // Determine Audio vs Video
    const displayType = getMediaType(item);

    // Badge HTML Construction
    const formatBadgeHTML = format ? `<span class="badge badge-format">${format}${fileSize}</span>` : '';
    const typeBadgeHTML = `<span class="badge badge-${displayType.toLowerCase()}">${displayType}</span>`;
    
    // Check all item values for NFT Flags
    let nftDateStr = getVal(item, "NFT Date", "NFT Date/Master", "NFT");
    let nftForever = false;

    for (const key in item) {
      const kClean = cleanKey(key);
      const val = (item[key] || "").toString().trim().toLowerCase();

      if (
        val === "nftf" || 
        val === "nft forever" || 
        val.includes("nft forever") ||
        (kClean.includes("nft") && (val === "true" || val === "yes" || val === "1"))
      ) {
        nftForever = true;
      }
    }

    if (nftDateStr.toLowerCase().includes("forever") || nftDateStr.toLowerCase() === "nftf") {
      nftForever = true;
    }

    const locationParts = [tour, venue].filter(Boolean).join(" - ");

    // --- NFT LOGIC & BADGE BUILDING ---
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

    // Attach click event for this specific card's copy button
    const copyBtn = card.querySelector(".copy-card-btn");
    copyBtn.addEventListener("click", () => copySingleItemSummary(item, copyBtn));

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

// Function to copy a single item's summary
function copySingleItemSummary(item, buttonElement) {
  const show = getVal(item, "Show", "Show Name", "Title") || "Unknown Show";
  const date = getVal(item, "Date") || "Unknown Date";
  const tour = getVal(item, "Tour");
  const venue = getVal(item, "Venue");
  const master = getVal(item, "Master") || "Unknown Master";
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
