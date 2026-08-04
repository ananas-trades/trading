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

// Robust helper function to parse Encora date strings accurately
function parseDateString(dateStr) {
  if (!dateStr) return null;
  
  // Try standard JS date parsing first
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d;
  }

  // Handle YYYY-MM-DD or YYYY/MM/DD manually
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    // If year is first (4 digits)
    if (parts[0].length === 4) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    // If year is last (4 digits) -> MM/DD/YYYY or DD/MM/YYYY
    if (parts[2].length === 4) {
      return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    }
  }

  return null;
}

function renderCards() {
  const query = document.getElementById("search-input").value.toLowerCase();
  const container = document.getElementById("card-container");
  container.innerHTML = "";

  const filtered = allData.filter(item => {
    const format = (item["Format"] || item["Type"] || "").trim();
    
    // Filter type check (Video vs Audio)
    if (currentFilter !== 'all' && !format.toLowerCase().includes(currentFilter.toLowerCase())) {
      return false;
    }

    // Search query check across all fields
    const searchableText = Object.values(item).join(" ").toLowerCase();
    return searchableText.includes(query);
  });

  document.getElementById('stats').innerText = `SHOWING ${filtered.length} OF ${allData.length} ITEMS`;

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";

    // Mapped directly to Encora export headers
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
    
    const nftDateStr = (item["NFT Date"] || item["NFT date"] || item["nft date"] || "").trim();
    const nftForever = (item["NFT Forever"] || item["NFT forever"] || "").toString().toLowerCase() === "true";

    const formatClass = format.toLowerCase().includes("audio") ? "badge-audio" : "badge-video";

    // Build location string from Tour and Venue
    const locationParts = [tour, venue].filter(Boolean).join(" - ");

    // --- NFT LOGIC ---
    let nftBadgeHTML = '';

    if (nftForever) {
      nftBadgeHTML = `<br><span class="nft-active">⛔ NFT FOREVER</span>`;
    } else if (nftDateStr !== "") {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalized start of today
      
      const parsedNftDate = parseDateString(nftDateStr);

      if (parsedNftDate && parsedNftDate >= today) {
        // STILL ACTIVE NFT -> #C4001A (Red)
        nftBadgeHTML = `<br><span class="nft-active">⛔ NFT UNTIL: ${nftDateStr}</span>`;
      } else {
        // EXPIRED/PAST NFT (2023, etc.) -> #C0C0C0 (Silver)
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
