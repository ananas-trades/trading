let allData = [];
let currentFilter = 'all';

document.addEventListener("DOMContentLoaded", () => {
  Papa.parse("list.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      allData = results.data;
      renderCards();
    },
    error: function(err) {
      document.getElementById('stats').innerText = "Upload your 'list.csv' file to display your collection!";
    }
  });

  document.getElementById("search-input").addEventListener("input", renderCards);

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.getAttribute("data-filter");
      renderCards();
    });
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

  const filtered = allData.filter(item => {
    const format = (item["Format"] || item["Type"] || "").trim();
    if (currentFilter !== 'all' && !format.toLowerCase().includes(currentFilter.toLowerCase())) {
      return false;
    }
    const searchableText = Object.values(item).join(" ").toLowerCase();
    return searchableText.includes(query);
  });

  document.getElementById('stats').innerText = `SHOWING ${filtered.length} OF ${allData.length} ITEMS`;

  filtered.forEach(item => {
    const card = document.createElement("div");

    // Encora Headers
    const show = item["Show"] || "Unknown Show";
    const date = item["Date"] || "";
    const showTime = item["Show time"] ? ` (${item["Show time"]})` : "";
    const format = item["Format"] || "Video";
    const tour = item["Tour"] || "";
    const venue = item["Venue"] || "";
    const master = item["Master"] || "";
    const cast = item["Cast"] || "";
    const masterNotes = item["Master Notes"] || "";
    const tradingNotes = item["Trading Notes"] || "";
    const myNotes = item["My Notes"] || "";
    
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

    const formatClass = format.toLowerCase().includes("audio") ? "badge-audio" : "badge-video";
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

      // DIRECT HOVER LISTENERS - Overrides CSS priority issues
      card.addEventListener("mouseenter", () => {
        card.style.animation = "rainbow-hover-glow 2s linear infinite";
        card.style.transform = "translateY(-4px)";
      });
      
      card.addEventListener("mouseleave", () => {
        card.style.animation = "ultra-standard-pulse 2.8s ease-in-out infinite alternate";
        card.style.transform = "translateY(0)";
      });
    }

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${show}</div>
        <span class="badge ${formatClass}">${format}</span>
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
    `;

    container.appendChild(card);
  });
}
