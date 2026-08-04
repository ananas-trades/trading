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

// Comprehensive NFT Active Check
function isNftStillActive(dateStr) {
  if (!dateStr) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Clean string: replace periods with dashes (e.g. 2023.10.12 -> 2023-10-12)
  const cleanStr = dateStr.trim().replace(/\./g, '-');

  // 1. Extract 4-digit year directly from string
  const yearMatch = cleanStr.match(/\b(20\d\d)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    const currentYear = today.getFullYear();

    // If the year in the CSV is strictly in the past (e.g., 2023, 2024, 2025), it's NOT active
    if (year < currentYear) {
      return false;
    }
  }

  // 2. Parse as full Date for current or future years
  const parsedDate = new Date(cleanStr);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate >= today;
  }

  // 3. If there is NO 4-digit year and date parsing failed, treat it as expired unless it explicitly says "forever"
  if (cleanStr.toLowerCase().includes("forever")) {
    return true;
  }

  return false; // Default to expired for unrecognized past/invalid strings
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
    
    // Find NFT date field regardless of header variations
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
        // STILL ACTIVE NFT -> Glowing Red (#C4001A)
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
