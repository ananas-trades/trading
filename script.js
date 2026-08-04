let allData = [];
let currentFilter = 'all';
let currentSubFilter = 'all';

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
      document.getElementById('stats').innerText = "Failed to load collection. Make sure list.csv exists!";
    }
  });

  // Search Input & Clear Button Logic
  const searchInput = document.getElementById("search-input");
  const clearBtn = document.getElementById("clear-search");

  searchInput.addEventListener("input", () => {
    clearBtn.style.display = searchInput.value ? "block" : "none";
    renderCards();
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.style.display = "none";
    renderCards();
  });

  // Main Format Filters (Video / Audio)
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.getAttribute("data-filter");
      renderCards();
    });
  });

  // Sub-Filters (Broadway, West End, Limited Trade)
  document.querySelectorAll(".sub-filter-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      if (e.target.classList.contains("active")) {
        e.target.classList.remove("active");
        currentSubFilter = 'all';
      } else {
        document.querySelectorAll(".sub-filter-btn").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        currentSubFilter = e.target.getAttribute("data-subfilter");
      }
      renderCards();
    });
  });

  // Copy Contact Email
  const copyEmailBtn = document.getElementById("copy-email-btn");
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", () => {
      showToast("Email copied to clipboard!");
    });
  }

  // Floating Back to Top Logic
  const backToTopBtn = document.getElementById("back-to-top");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopBtn.style.display = "block";
    } else {
      backToTopBtn.style.display = "none";
    }
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

function showToast(message) {
  navigator.clipboard.writeText("tradingtreelost@gmail.com");
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.remove("toast-hidden");
  setTimeout(() => {
    toast.classList.add("toast-hidden");
  }, 2000);
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
  const queryInput = document.getElementById("search-input");
  const query = queryInput ? queryInput.value.toLowerCase() : "";
  const container = document.getElementById("card-container");
  if (!container) return;
  
  container.innerHTML = "";

  const filtered = allData.filter(item => {
    // Check Format Filter
    const format = (item["Format"] || item["Type"] || "").trim();
    if (currentFilter !== 'all' && !format.toLowerCase().includes(currentFilter.toLowerCase())) {
      return false;
    }

    // Check Sub-Filter
    const searchableText = Object.values(item).join(" ").toLowerCase();
    if (currentSubFilter === 'broadway' && !searchableText.includes('broadway')) return false;
    if (currentSubFilter === 'west end' && !searchableText.includes('west end')) return false;
    if (currentSubFilter === 'limited') {
      const isLimited = searchableText.includes('limited') || (item["Limited Trade Status"] || "").length > 0;
      if (!isLimited) return false;
    }

    // Check Search Bar Query
    return searchableText.includes(query);
  });

  const statsEl = document.getElementById('stats');
  if (statsEl) {
    statsEl.innerText = `SHOWING ${filtered.length} OF ${allData.length} ITEMS`;
  }

  filtered.forEach(item => {
    const card = document.createElement("div");

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

    // NFT Badges
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

    card.className = "item-card";
    if (isNFTActive) {
      card.classList.add("card-nft-active");
    } else {
      card.classList.add("card-standard");
    }

    // Prepare Copy Text String for Traders
    const copyInfoText = `${show} - ${date} (${format}) - Master: ${master || 'Unknown'}`;

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

      ${cast ? `
        <div class="card-cast collapsible-box">
          <strong>CAST:</strong> ${cast}
        </div>
        ${cast.length > 120 ? '<button class="toggle-expand-btn">+ Show Full Cast</button>' : ''}
      ` : ''}
      
      ${masterNotes ? `<div class="card-notes"><strong>MASTER NOTES:</strong> ${masterNotes}</div>` : ''}
      ${tradingNotes ? `<div class="card-notes"><strong>TRADING NOTES:</strong> ${tradingNotes}</div>` : ''}
      ${myNotes ? `<div class="card-notes"><strong>NOTES:</strong> ${myNotes}</div>` : ''}

      <button class="copy-card-btn">📋 Copy Details for Email</button>
    `;

    // Copy Card Details Listener
    const copyCardBtn = card.querySelector(".copy-card-btn");
    if (copyCardBtn) {
      copyCardBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(copyInfoText);
        const toast = document.getElementById("toast");
        toast.innerText = "Show details copied!";
        toast.classList.remove("toast-hidden");
        setTimeout(() => toast.classList.add("toast-hidden"), 2000);
      });
    }

    // Toggle Collapsible Cast Listener
    const expandBtn = card.querySelector(".toggle-expand-btn");
    if (expandBtn) {
      expandBtn.addEventListener("click", () => {
        const box = card.querySelector(".card-cast");
        if (box.classList.contains("expanded")) {
          box.classList.remove("expanded");
          expandBtn.innerText = "+ Show Full Cast";
        } else {
          box.classList.add("expanded");
          expandBtn.innerText = "- Hide Full Cast";
        }
      });
    }

    container.appendChild(card);
  });
}
