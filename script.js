let allData = [];
let currentFilteredItems = []; // Keeps track of currently visible subset for Event Delegation
let currentFilter = 'all';
let currentCategory = 'all';
let searchTimeout = null;

// LocalStorage Trade Cart State
const STORAGE_KEY = "bootleg_trade_cart";
let tradeCart = loadCartFromStorage();

document.addEventListener("DOMContentLoaded", () => {
  Papa.parse("./list.csv", {
    download: true,
    header: true,
    skipEmptyLines: "greedy",
    delimiter: "", // Auto-detect tab vs comma
    transformHeader: function(header) {
      return header.replace(/[\ufeff\u200b\r\n]/g, '').trim();
    },
    complete: function(results) {
      // Pre-index searchable text for lightning-fast filtering
      allData = results.data.map(item => {
        item._searchIndex = `${getValByName(item, "Show")} ${getValByName(item, "Date")} ${getValByName(item, "Cast")} ${getValByName(item, "Master")} ${getValByName(item, "Tour", "Location")} ${getValByName(item, "Venue")}`.toLowerCase();
        return item;
      });
      
      renderCards();
      updateCartUI(); // Initial UI sync for cart items loaded from LocalStorage
    },
    error: function(err) {
      document.getElementById('stats').innerText = "Upload your 'list.csv' file to display your collection!";
    }
  });

  // Debounced Search Input Event (Prevents lag on fast typing)
  document.getElementById("search-input").addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderCards();
    }, 150);
  });

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

  // OPTIMIZED EVENT DELEGATION: Single listener handles all card actions
  const cardContainer = document.getElementById("card-container");
  if (cardContainer) {
    cardContainer.addEventListener("click", (e) => {
      const addBtn = e.target.closest(".add-cart-btn");
      const copyBtn = e.target.closest(".copy-card-btn");

      if (addBtn) {
        const idx = addBtn.getAttribute("data-index");
        const item = currentFilteredItems[idx];
        if (item) toggleCartItem(item, addBtn);
      } else if (copyBtn) {
        const idx = copyBtn.getAttribute("data-index");
        const item = currentFilteredItems[idx];
        if (item) copySingleItemSummary(item, copyBtn);
      }
    });
  }

  // Scroll To Top Visibility & Action (Smooth & Frame-Throttled)
  const scrollTopBtn = document.getElementById("scroll-top-btn");
  let isScrolling = false;

  window.addEventListener("scroll", () => {
    if (!isScrolling) {
      window.requestAnimationFrame(() => {
        if (scrollTopBtn) {
          if (window.scrollY > 300) {
            scrollTopBtn.classList.add("visible");
          } else {
            scrollTopBtn.classList.remove("visible");
          }
        }
        isScrolling = false;
      });
      isScrolling = true;
    }
  }, { passive: true });

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Trade Cart Drawer Listeners
  const drawer = document.getElementById("trade-drawer");
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
      renderCards();
    });
  }

  const copyTradeBtn = document.getElementById("copy-trade-btn");
  if (copyTradeBtn) copyTradeBtn.addEventListener("click", copyTradeRequest);

  // ✉️ EMAIL REQUEST HANDLER (NON-BLOCKING & INSTANT UI RESPONSE)
  const emailBtn = document.getElementById("email-trade-btn");
  if (emailBtn) {
    emailBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!tradeCart.length) {
        alert("Your trade request is empty! Add items to your list first.");
        return;
      }

      const recipient = "tradingtreelost@gmail.com";
      const subject = `Trade Request (${tradeCart.length} Items)`;
      const bodyText = generateFormattedText();
      
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(bodyText);
      
      const mailtoUrl = `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${encodedSubject}&body=${encodedBody}`;

      // 1. Copy formatted trade text to clipboard asynchronously
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(bodyText).catch(() => {});
      }

      // 2. Defer native alert/popup thread lock to allow instant UI response
      setTimeout(() => {
        const useGmail = confirm(
          "📋 Request COPIED to your clipboard!\n\n" +
          "• Click 'OK' to open directly in Gmail Web.\n" +
          "• Click 'Cancel' to try opening your default Mail App."
        );

        if (useGmail) {
          window.open(gmailUrl, "_blank");
        } else {
          window.location.href = mailtoUrl;
        }
      }, 10);
    });
  }
});

/* ============================================================
   LOCALSTORAGE CART PERSISTENCE
============================================================ */
function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Could not load trade cart from storage:", e);
    return [];
  }
}

function saveCartToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tradeCart));
  } catch (e) {
    console.error("Could not save trade cart to storage:", e);
  }
}

/* ============================================================
   DRAWER & CART MANAGERS
============================================================ */
function openDrawer() {
  const drawer = document.getElementById("trade-drawer");
  const overlay = document.getElementById("drawer-overlay");
  if (drawer) drawer.classList.add("open");
  if (overlay) overlay.classList.add("open");
}

function closeDrawer() {
  const drawer = document.getElementById("trade-drawer");
  const overlay = document.getElementById("drawer-overlay");
  if (drawer) drawer.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
}

function getItemKey(item) {
  const show = getValByName(item, "Show");
  const date = getValByName(item, "Date");
  const master = getValByName(item, "Master");
  const format = getFormat(item);
  return `${show}|${date}|${master}|${format}`.toLowerCase();
}

function isInCart(item) {
  const key = getItemKey(item);
  return tradeCart.some(c => c.key === key);
}

function toggleCartItem(item, buttonEl) {
  const key = getItemKey(item);
  const existingIdx = tradeCart.findIndex(c => c.key === key);

  if (existingIdx > -1) {
    // 1. Remove item from cart state
    tradeCart.splice(existingIdx, 1);
    
    // 2. INSTANT UI response on clicked button
    if (buttonEl) {
      buttonEl.innerText = "+ Add to Trade";
      buttonEl.classList.remove("in-cart");
    }
  } else {
    // ⚠️ NFT SMART WARNING CHECK
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

    // If active NFT, show confirmation warning prompt
    if (isNFTActive) {
      const showName = getValByName(item, "Show") || "This item";
      const nftMsg = nftDateStr ? `NFT restriction until ${nftDateStr}` : "NFT FOREVER (Not For Trade)";
      
      const proceed = confirm(
        `⛔ RESTRICTED ITEM WARNING\n\n` +
        `"${showName}" is currently under an active ${nftMsg}.\n\n` +
        `Are you sure you want to add this to your trade request?`
      );

      if (!proceed) return; // Cancel adding to cart
    }

    // 1. Add item to cart state
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

    // 2. INSTANT UI response on clicked button
    if (buttonEl) {
      buttonEl.innerText = "✓ In Request";
      buttonEl.classList.add("in-cart");
    }
  }

  // 3. Defer storage writes & drawer re-renders to next animation frame for smooth UI response
  requestAnimationFrame(() => {
    saveCartToStorage();
    updateCartUI();
  });
}

function removeFromCart(key) {
  tradeCart = tradeCart.filter(c => c.key !== key);
  saveCartToStorage();
  updateCartUI();
  renderCards();
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

    const detailsDiv = document.createElement("div");
    detailsDiv.className = "cart-item-details";
    detailsDiv.innerHTML = `
      <strong>${item.show}</strong>
      <span>📅 ${item.date} (${item.format}) ${location ? `| 📍 ${location}` : ''}</span>
    `;

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-cart-item";
    removeBtn.type = "button";
    removeBtn.innerHTML = "&times;";

    removeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeFromCart(item.key);
    });

    cartCard.appendChild(detailsDiv);
    cartCard.appendChild(removeBtn);
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

/* ============================================================
   DATA PARSING & DETECTORS
============================================================ */

function getValByName(item, ...names) {
  if (!item) return "";
  const keys = Object.keys(item);
  for (const name of names) {
    const target = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const key of keys) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanKey === target) {
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
  if (named && /^\d+(\.\d+)?\s*(gb|mb|kb|tb)$/i.test(named.trim())) {
    return named.trim();
  }

  const values = Object.values(item);
  for (const val of values) {
    if (!val) continue;
    const str = val.toString().trim();
    if (/^\d+(\.\d+)?\s*(gb|mb|kb|tb)$/i.test(str)) {
      return str;
    }
  }

  return named;
}

function getFormat(item) {
  const traderFmt = getValByName(item, "Trader Format");
  if (traderFmt) return traderFmt;

  const fmt = getValByName(item, "Format");
  if (fmt) return fmt;

  return getValByName(item, "Release Format");
}

function getMediaType(item) {
  const audioVideo = getValByName(item, "Audio / Video", "Audio/Video").toLowerCase();
  const typeRaw = getValByName(item, "Type").toLowerCase();
  const formatRaw = getFormat(item).toLowerCase();

  const isAudio = audioVideo.includes("audio") || typeRaw.includes("audio") || 
                  formatRaw.match(/audio|mp3|m4a|wav|flac|tracked|cd/);
                  
  const isVideo = audioVideo.includes("video") || typeRaw.includes("video") || 
                  formatRaw.match(/video|mp4|vob|mov|mkv|avi/);

  if (
    audioVideo.includes("both") || 
    audioVideo.includes("mixed") || 
    audioVideo.includes("&") ||
    audioVideo.includes("/") ||
    (isAudio && isVideo)
  ) {
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

/* ============================================================
   HIGH-PERFORMANCE CARD RENDERER
============================================================ */
function renderCards() {
  const query = document.getElementById("search-input").value.toLowerCase().trim();
  const container = document.getElementById("card-container");

  // 1. Filter Data Set
  currentFilteredItems = allData.filter(item => {
    // Format/Type Filter
    const displayType = getMediaType(item);
    if (currentFilter !== 'all' && displayType.toLowerCase() !== currentFilter.toLowerCase()) {
      return false;
    }

    // Category Filter
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

    // Fast Search via Pre-Indexed Search String
    if (query) {
      if (!item._searchIndex.includes(query)) return false;
    }

    return true;
  });

  document.getElementById('stats').innerText = `SHOWING ${currentFilteredItems.length} OF ${allData.length} ITEMS`;

  // 2. High-Speed HTML Array Map Construction
  const cardsHtml = currentFilteredItems.map((item, index) => {
    const show = getValByName(item, "Show") || "Unknown Show";
    const date = getValByName(item, "Date");
    const matineeEve = getValByName(item, "Matinée / Evening", "Matinee / Evening", "MatinÃ©e / Evening");
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
          <button type="button" class="add-cart-btn ${itemInCart ? 'in-cart' : ''}" data-index="${index}">
            ${itemInCart ? '✓ In Request' : '+ Add to Trade'}
          </button>
          <button type="button" class="copy-card-btn" data-index="${index}">📋 Copy Info</button>
        </div>
      </div>
    `;
  }).join('');

  // 3. Batch inject DOM content in a single hit
  container.innerHTML = cardsHtml;
}

// Function to copy a single item's summary
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
  }).catch(err => {
    console.error("Could not copy text: ", err);
  });
}
