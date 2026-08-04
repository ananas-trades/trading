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

// Smart Date Parser that handles DD-MM-YYYY (e.g., 31-05-2026)
function parseEncoraDate(dateStr) {
  if (!dateStr) return null;

  const clean = dateStr.trim().replace(/\./g, '-');
  const parts = clean.split(/[-/]/);

  if (parts.length === 3) {
    let day, month, year;

    // YYYY-MM-DD
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } 
    // DD-MM-YYYY or MM-DD-YYYY
    else if (parts[2].length === 4) {
      year = parseInt(parts[2], 10);
      const p1 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[1], 10);

      // If first number is > 12, it MUST be DD-MM-YYYY (e.g. 31-05-2026)
      if (p1 > 12) {
        day = p1;
        month = p2 - 1;
      } else {
        // Default standard European DD-MM-YYYY for Encora exports
        day = p1;
        month = p2 - 1;
      }
    }

    if (year && month !== undefined && day) {
      return new Date(year, month, day);
    }
  }

  // Fallback to standard JS Date parsing
  const d = new Date(clean);
  return isNaN(d.getTime()) ? null : d;
}

function isNftStillActive(dateStr) {
  if (!dateStr) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If text says forever
  if (dateStr.toLowerCase().includes("forever")) return true;

  const parsedDate = parseEncoraDate(dateStr);

  if (parsedDate) {
    // True if date is today or in the future; False if in the past
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
    card.className = "item-card";

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
    
    let nftDateStr = "";
    for (const key in item) {
      if (key.trim().toLowerCase() === "nft date") {
        nftDateStr = (item[key] || "").trim();
        break;
      }
    }

    let nftForever = false;
    for (const key in item) {
      if (key.trim().toLowerCase() === "nft forever") {
        nftForever = (item[key] || "").toString().toLowerCase() === "true";
        break;
      }
    }

    const formatClass = format.toLowerCase().includes("audio") ? "badge-audio" : "badge-video";
    const locationParts = [tour, venue].filter(Boolean).join(" - ");

    // --- NFT LOGIC ---
    let nftBadgeHTML = '';

    if (nftForever) {
      nftBadgeHTML = `<br><span class="nft-active">⛔ NFT FOREVER</span>`;
    } else if (nftDateStr !== "") {
      const active = isNftStillActive(nftDateStr);

      if (active) {
        // STILL NFT -> Pulsing Red (#C4001A)
        nftBadgeHTML = `<br><span class="nft-active">⛔ NFT UNTIL: ${nftDateStr}</span>`;
      } else {
        // PAST NFT -> Silver (#C0C0C0)
        nftBadgeHTML = `<br><span class="nft-passed">✅ PAST NFT (${nftDateStr})</span>`;
      }
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
