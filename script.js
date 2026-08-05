let allData = [];
let currentFilter = 'all';
let currentCategory = 'all';

document.addEventListener("DOMContentLoaded", () => {
  Papa.parse("list.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    transformHeader: function(header) {
      return header.trim(); // 👈 Fixes trailing/leading spaces in column headers
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

  // Category Filter Listeners (Broadway, Off-Broadway, West End)
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
    // 1. Format/Type Filter (Video/Audio)
    const mediaType = (item["Type"] || item["Format"] || item["Trader Format"] || "").trim();
    if (currentFilter !== 'all' && !mediaType.toLowerCase().includes(currentFilter.toLowerCase())) {
      return false;
    }

    // 2. Category Filter (Broadway / Off-Broadway / West End)
    if (currentCategory !== 'all') {
      const tour = (item["Tour"] || "").toLowerCase();
      const venue = (item["Venue"] || "").toLowerCase();
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
    const show = item["Show"] || "Unknown Show";
    const date = item["Date"] || "";
    const showTime = item["Show time"] ? ` (${item["Show time"]})` : "";
    
    // Checks both 'Format' and 'Trader Format' automatically
    const format = (item["Format"] || item["Trader Format"] || "").trim();
    const typeRaw = (item["Type"] || "Video").trim();
    
    // Checks both 'File Size' and 'Size' automatically
    const sizeVal = item["File Size"] || item["Size"] || "";
    const fileSize = sizeVal ? ` [${sizeVal}]` : "";

    const tour = item["Tour"] || "";
    const venue = item["Venue"] || "";
    const master = item["Master"] || "";
    const cast = item["Cast"] || "";
    const masterNotes = item["Master Notes"] || "";
    const tradingNotes = item["Trading Notes"] || "";
    const myNotes = item["My Notes"] || "";

    // --- ENFORCE "AUDIO" OR "VIDEO" BADGE TEXT ---
    // If the Type or Format says "Audio", it's an Audio. Everything else defaults to Video.
    const isAudio = typeRaw.toLowerCase().includes('audio') || format.toLowerCase().includes('audio');
    const displayType = isAudio ? "AUDIO" : "VIDEO";

    // Badge HTML Construction
    const formatBadgeHTML = format ? `<span class="badge badge-format">${format}${fileSize}</span>` : '';
    const typeBadgeHTML = `<span class="badge badge-${displayType.toLowerCase()}">${displayType}</span>`;
    
    // Check all item values for NFT Flags
    let nftDateStr = "";
    let nftForever = false;

    for (const key in item) {
      const cleanKey = key.trim().toLowerCase();
      const val = (item[key] || "").toString().trim();
      const valLower = val.toLowerCase();

      if (cleanKey === "nft date") {
        nftDateStr = val;
      }

      if (
        valLower === "nftf" || 
        valLower === "nft forever" || 
        valLower.includes("nft forever") ||
        (cleanKey.includes("nft") && (valLower === "true" || valLower === "yes" || valLower === "1"))
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
  const show = item["Show"] || "Unknown Show";
  const date = item["Date"] || "Unknown Date";
  const tour = item["Tour"] || "";
  const venue = item["Venue"] || "";
  const master = item["Master"] || "Unknown Master";
  const format = item["Format"] || item["Trader Format"] || "Video";

  const location = [tour, venue].filter(Boolean).join(" - ");
  
  // Format formatted summary block for single bootleg
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
