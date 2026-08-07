let allData = [];
let currentFilteredItems = [];
let currentFilter = 'all';
let currentCategory = 'all';
let searchTimeout = null;
let currentRenderToken = 0;

// Pagination configuration
const BATCH_SIZE = 20;
let displayedCount = 0;
let observer = null;

// LocalStorage Trade Cart State
const STORAGE_KEY = "bootleg_trade_cart";
let tradeCart = loadCartFromStorage();

document.addEventListener("DOMContentLoaded", () => {
  setupIntersectionObserver();
  setupFieryCursor(); // Initialize Custom Fiery Cursor Tracker

  Papa.parse("./list.csv", {
    download: true,
    header: true,
    skipEmptyLines: "greedy",
    delimiter: "", // Auto-detect tab vs comma
    transformHeader: function(header) {
      return header.replace(/[\ufeff\u200b\r\n]/g, '').trim();
    },
    complete: function(results) {
      // Pre-index searchable text for fast low-memory filtering
      allData = results.data.map(item => {
        item._searchIndex = `${getValByName(item, "Show")} ${getValByName(item, "Date")} ${getValByName(item, "Cast")} ${getValByName(item, "Master")} ${getValByName(item, "Tour", "Location")} ${getValByName(item, "Venue")}`.toLowerCase();
        return item;
      });
      
      applyFiltersAndRender();
      updateCartUI();
    },
    error: function(err) {
      document.getElementById('stats').innerText = "Upload your 'list.csv' file to display your collection!";
    }
  });

  // Debounced Search Input Event
  document.getElementById("search-input").addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      applyFiltersAndRender();
    }, 100);
  });

  // Format Filter Listeners
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.getAttribute("data-filter");
      applyFiltersAndRender();
    });
  });

  // Category Filter Listeners
  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentCategory = e.target.getAttribute("data-category");
      applyFiltersAndRender();
    });
  });

  // Event Delegation for Card Actions
  const cardContainer = document.getElementById("card-container");
  if (cardContainer) {
    cardContainer.addEventListener("click", (e) => {
      const addBtn = e.target.closest(".add-cart-btn");
      const copyBtn = e.target.closest(".copy-card-btn");

      if (addBtn) {
        const idx = parseInt(addBtn.getAttribute("data-index"), 10);
        const item = currentFilteredItems[idx];
        if (item) toggleCartItem(item, addBtn);
      } else if (copyBtn) {
        const idx = parseInt(copyBtn.getAttribute("data-index"), 10);
        const item = currentFilteredItems[idx];
        if (item) copySingleItemSummary(item, copyBtn);
      }
    });
  }

  // Scroll To Top
  const scrollTopBtn = document.getElementById("scroll-top-btn");
  if (scrollTopBtn) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        scrollTopBtn.classList.add("visible");
      } else {
        scrollTopBtn.classList.remove("visible");
      }
    }, { passive: true });

    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Cart Drawer Events
  const overlay = document.getElementById("drawer-overlay");
  const cartToggleBtn = document.getElementById("cart-toggle-btn");
  if (cartToggleBtn) cartToggleBtn.addEventListener("click", openDrawer);
  
  const closeDrawerBtn = document.getElementById("close-drawer-btn");
  if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", closeDrawer);
  
  if (overlay) overlay.addEventListener("click", closeDrawer);
  
  const clearCartBtn = document.getElementById("clear-cart-btn");
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      tradeCart = [];
      saveCartToStorage();
      updateCartUI();
      applyFiltersAndRender();
    });
  }

  const copyTradeBtn = document.getElementById("copy-trade-btn");
  if (copyTradeBtn) copyTradeBtn.addEventListener("click", copyTradeRequest);

  // Email Trade Handler
  const emailBtn = document.getElementById("email-trade-btn");
  if (emailBtn) {
    emailBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!tradeCart.length) {
        alert("Your trade request is empty! Add items to your list first.");
        return;
      }

      const recipient = "tradingtreelost@gmail.com";
      const subject = `Trade Request (${tradeCart.length} Items)`;
      const bodyText = generateFormattedText();
      
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(bodyText).catch(() => {});
      }

      setTimeout(() => {
        const useGmail = confirm(
          "📋 Request COPIED to clipboard!\n\n" +
          "• Click 'OK' to open Gmail Web.\n" +
          "• Click 'Cancel' for Default Mail App."
        );
        if (useGmail) window.open(gmailUrl, "_blank");
        else window.location.href = mailtoUrl;
      }, 10);
    });
  }
});

/* ============================================================
   FIERY CURSOR TRACKER ENGINE
============================================================ */
function setupFieryCursor() {
  const cursor = document.getElementById('fiery-cursor');
  const fireCursorSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="%23ffe600" stroke="%23ff007f" stroke-width="1" d="M3 1l12 26 4-10 10-4L3 1z"/><path fill="%2300f0ff" stroke="%23ffffff" stroke-width="0.5" d="M3 3l10 22 3-8 8-3L3 3z"/></svg>`;

  if (cursor) {
    cursor.style.backgroundImage = `url('${fireCursorSVG}')`;

    window.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    }, { passive: true });
  }
}

/* ============================================================
   INTERSECTION OBSERVER (INFINITE SCROLL ENGINE)
============================================================ */
function setupIntersectionObserver() {
  const sentinel = document.getElementById("scroll-sentinel");
  if (!sentinel) return;

  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      if (displayedCount < currentFilteredItems.length) {
        appendNextBatch();
      }
    }
  }, {
    root: null,
    rootMargin: "400px", // Pre-loads next batch 400px before user reaches bottom
    threshold: 0.1
  });

  observer.observe(sentinel);
}

function applyFiltersAndRender() {
  const query = document.getElementById("search-input").value.toLowerCase().trim();
  currentRenderToken++;

  // 1. Filter Data Set
  currentFilteredItems = allData.filter(item => {
    const displayType = getMediaType(item);
    if (currentFilter !== 'all' && displayType.toLowerCase() !== currentFilter.toLowerCase()) {
      return false;
    }

    if (currentCategory !== 'all') {
      const tour = getValByName(item, "Tour", "Location", "City").toLowerCase();
      const venue = getValByName(item, "Venue", "Theater", "Theatre").toLowerCase();
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

    if (query && !item._searchIndex.includes(query)) {
      return false;
    }

    return true;
  });

  document.getElementById('stats').innerText = `SHOWING ${currentFilteredItems.length} OF ${allData.length} ITEMS`;

  // 2. Clear Container and Render Initial Frame
  const container = document.getElementById("card-container");
  container.innerHTML = "";
  displayedCount = 0;

  if (currentFilteredItems.length > 0) {
    appendNextBatch(30); // Initial fast view batch
  }
}

function appendNextBatch(count = BATCH_SIZE) {
  const container = document.getElementById("card-container");
  const nextSlice = currentFilteredItems.slice(displayedCount, displayedCount + count);

  if (nextSlice.length === 0) return;

  const fragment = document.createDocumentFragment();
  const tempContainer = document.createElement("div");

  tempContainer.innerHTML = nextSlice.map((item, i) => {
    const globalIndex = displayedCount + i;
    const show = getValByName(item, "Show") || "Unknown Show";
    const date = getValByName(item, "Date");
    const matineeEve = getValByName(item, "Matinée / Evening", "Matinee / Evening");
    const showTime = matineeEve ? ` (${matineeEve})` : "";
    
    const format = getFormat(item);
    const sizeVal = getFileSize(item);
    const fileSize = sizeVal ? ` [${sizeVal}]` : "";

    const tour = getValByName(item, "Tour", "Location", "City");
    const venue = getValByName(item, "Venue", "Theater", "Theatre");
    const master = getValByName(item, "Master");
    const cast = getValByName(item, "Cast");
    const masterNotes = getValByName(item, "Master Notes");
    const tradingNotes = getValByName(item, "Trading Notes");
    const myNotes = getValByName(item, "My Notes");

    const displayType = getMediaType(item);
    const formatBadgeHTML = format ? `<span class="badge badge-format">${format}${fileSize}</span>` : '';
    const safeTypeClass = displayType.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const typeBadgeHTML = `<span class="badge badge-${safeTypeClass}">${displayType}</span>`;
    
    const nftDateStr = getValByName(item, "NFT Date");
    const nftForeverVal = getValByName(item, "NFT Forever").toLowerCase();
    
    let nftForever = (
      nftForeverVal === "true" || nftForeverVal === "yes" || nftForeverVal === "1" || 
      nftForeverVal === "nftf" || nftForeverVal.includes("forever") ||
      nftDateStr.toLowerCase().includes("forever") || nftDateStr.toLowerCase() === "nftf"
    );

    const locationParts = [tour, venue].filter(Boolean).join(" - ");
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

    const cardClass = `item-card ${isNFTActive ? 'card-nft-active' : 'card-standard'}`;
    const itemInCart = isInCart(item);

    return `
      <div class="${cardClass}">
        <div class="card-header">
          <div class="card-title">${show}</div>
          <div class="card-badges" style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
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
          <button type="button" class="add-cart-btn ${itemInCart ? 'in-cart' : ''}" data-index="${globalIndex}">
            ${itemInCart ? '✓ In Request' : '+ Add to Trade'}
          </button>
          <button type="button" class="copy-card-btn" data-index="${globalIndex}">📋 Copy Info</button>
        </div>
      </div>
    `;
  }).join('');

  while (tempContainer.firstChild) {
    fragment.appendChild(tempContainer.firstChild);
  }

  container.appendChild(fragment);
  displayedCount += nextSlice.length;
}

/* ============================================================
   LOCALSTORAGE CART & HELPERS
============================================================ */
function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function saveCartToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tradeCart));
  } catch (e) {}
}

function openDrawer() {
  document.getElementById("trade-drawer")?.classList.add("open");
  document.getElementById("drawer-overlay")?.classList.add("open");
}

function closeDrawer() {
  document.getElementById("trade-drawer")?.classList.remove("open");
  document.getElementById("drawer-overlay")?.classList.remove("open");
}

function getItemKey(item) {
  return `${getValByName(item, "Show")}|${getValByName(item, "Date")}|${getValByName(item, "Master")}|${getFormat(item)}`.toLowerCase();
}

function isInCart(item) {
  const key = getItemKey(item);
  return tradeCart.some(c => c.key === key);
}

function toggleCartItem(item, buttonEl) {
  const key = getItemKey(item);
  const existingIdx = tradeCart.findIndex(c => c.key === key);

  if (existingIdx > -1) {
    tradeCart.splice(existingIdx, 1);
    if (buttonEl) {
      buttonEl.innerText = "+ Add to Trade";
      buttonEl.classList.remove("in-cart");
    }
  } else {
    const nftDateStr = getValByName(item, "NFT Date");
    const nftForeverVal = getValByName(item, "NFT Forever").toLowerCase();
    
    let isNFTActive = (
      nftForeverVal === "true" || nftForeverVal === "yes" || nftForeverVal === "1" || 
      nftForeverVal === "nftf" || nftForeverVal.includes("forever") ||
      nftDateStr.toLowerCase().includes("forever") || nftDateStr.toLowerCase() === "nftf"
    );

    if (!isNFTActive && nftDateStr !== "") {
      isNFTActive = isNftStillActive(nftDateStr);
    }

    if (isNFTActive) {
      const showName = getValByName(item, "Show") || "This item";
      const nftMsg = nftDateStr ? `NFT restriction until ${nftDateStr}` : "NFT FOREVER (Not For Trade)";
      
      const proceed = confirm(
        `⛔ RESTRICTED ITEM WARNING\n\n` +
        `"${showName}" is currently under an active ${nftMsg}.\n\n` +
        `Are you sure you want to add this to your trade request?`
      );

      if (!proceed) return;
    }

    tradeCart.push({
      key: key,
      show: getValByName(item, "Show") || "Unknown Show",
      date: getValByName(item, "Date") || "Unknown Date",
      type: getMediaType(item),
      format: getFormat(item) || getMediaType(item),
      tour: getValByName(item, "Tour", "Location", "City"),
      venue: getValByName(item, "Venue", "Theater", "Theatre"),
      master: getValByName(item, "Master")
    });

    if (buttonEl) {
      buttonEl.innerText = "✓ In Request";
      buttonEl.classList.add("in-cart");
    }
  }

  saveCartToStorage();
  updateCartUI();
}

function generateFormattedText() {
  const itemsText = tradeCart.map((item, i) => {
    const location = [item.tour, item.venue].filter(Boolean).join(" - ");
    let line = `${i + 1}. ${item.show} - ${item.date} (${item.format})`;
    if (location) line += ` | ${location}`;
    if (item.master) line += ` | Master: ${item.master}`;
    return line;
  }).join("\n");

  return [
    "Hi!",
    "I would like to initiate a trade for the following items from your collection:",
    "",
    itemsText,
    "",
    "My Trading List / Link: [INSERT YOUR LINK HERE]",
    "",
    "Thanks!"
  ].join("\n");
}

function updateCartUI() {
  const container = document.getElementById("cart-items-container");
  const countEl = document.getElementById("cart-count");
  const videoCountEl = document.getElementById("cart-video-count");
  const audioCountEl = document.getElementById("cart-audio-count");

  if (countEl) countEl.innerText = tradeCart.length;

  let videos = 0;
  let audios = 0;

  if (!container) return;

  if (tradeCart.length === 0) {
    container.innerHTML = `<p class="empty-cart-msg">No items added yet. Click "+ Add to Trade" on any item card!</p>`;
    if (videoCountEl) videoCountEl.innerText = "0";
    if (audioCountEl) audioCountEl.innerText = "0";
    return;
  }

  container.innerHTML = "";

  tradeCart.forEach(item => {
    if (item.type.includes("VIDEO")) videos++;
    if (item.type.includes("AUDIO")) audios++;

    const location = [item.tour, item.venue].filter(Boolean).join(" - ");
    const cartCard = document.createElement("div");
    cartCard.className = "cart-item-row";

    cartCard.innerHTML = `
      <div class="cart-item-details">
        <strong>${item.show}</strong>
        <span>📅 ${item.date} (${item.format}) ${location ? `| 📍 ${location}` : ''}</span>
      </div>
      <button type="button" class="remove-cart-item" data-key="${item.key}">&times;</button>
    `;

    cartCard.querySelector(".remove-cart-item").addEventListener("click", () => {
      tradeCart = tradeCart.filter(c => c.key !== item.key);
      saveCartToStorage();
      updateCartUI();
      applyFiltersAndRender();
    });

    container.appendChild(cartCard);
  });

  if (videoCountEl) videoCountEl.innerText = videos;
  if (audioCountEl) audioCountEl.innerText = audios;
}

function copyTradeRequest() {
  if (!tradeCart.length) return;
  const text = generateFormattedText();
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("copy-trade-btn");
    if (btn) {
      btn.innerText = "✅ Copied Request!";
      setTimeout(() => { btn.innerText = "📋 Copy Request"; }, 2000);
    }
  });
}

function getValByName(item, ...names) {
  if (!item) return "";
  const keys = Object.keys(item);
  for (const name of names) {
    const target = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const key of keys) {
      if (key.toLowerCase().replace(/[^a-z0-9]/g, '') === target) {
        const val = item[key];
        if (val !== undefined && val !== null) {
          const str = val.toString().trim();
          if (str) return str;
        }
      }
    }
  }
  return "";
}

function getFileSize(item) {
  const named = getValByName(item, "File Size", "Size", "Filesize");
  if (named && /^\d+(\.\d+)?\s*(gb|mb|kb|tb)$/i.test(named.trim())) return named.trim();
  for (const val of Object.values(item)) {
    if (val && /^\d+(\.\d+)?\s*(gb|mb|kb|tb)$/i.test(val.toString().trim())) return val.toString().trim();
  }
  return named;
}

function getFormat(item) {
  return getValByName(item, "Trader Format") || getValByName(item, "Format") || getValByName(item, "Release Format");
}

function getMediaType(item) {
  const audioVideo = getValByName(item, "Audio / Video", "Audio/Video").toLowerCase();
  const typeRaw = getValByName(item, "Type").toLowerCase();
  const formatRaw = getFormat(item).toLowerCase();

  const isAudio = audioVideo.includes("audio") || typeRaw.includes("audio") || formatRaw.match(/audio|mp3|m4a|wav|flac|tracked|cd/);
  const isVideo = audioVideo.includes("video") || typeRaw.includes("video") || formatRaw.match(/video|mp4|vob|mov|mkv|avi/);

  if (audioVideo.includes("both") || audioVideo.includes("mixed") || audioVideo.includes("&") || audioVideo.includes("/") || (isAudio && isVideo)) {
    return "VIDEO / AUDIO";
  }
  if (isAudio) return "AUDIO";
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
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
    }
    if (year && month !== undefined && day) return new Date(year, month, day);
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
  return parsedDate ? parsedDate >= today : false;
}

function copySingleItemSummary(item, buttonElement) {
  const show = getValByName(item, "Show") || "Unknown Show";
  const date = getValByName(item, "Date") || "Unknown Date";
  const tour = getValByName(item, "Tour", "Location", "City");
  const venue = getValByName(item, "Venue", "Theater", "Theatre");
  const master = getValByName(item, "Master") || "Unknown Master";
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
  });
}
