/* ============================================================
   EVIDENCE FILE ENGINE v3.0 [CLASSIFIED PROJECT ARCHIVE]
   ============================================================ */

let allData = [];
let currentFilteredItems = [];
let currentFilter = 'all';
let currentCategory = 'all';
let searchTimeout = null;
let currentRenderToken = 0;

// Pagination configuration
const BATCH_SIZE = 25;
let displayedCount = 0;
let observer = null;

// LocalStorage Case File / Trade Cart State
const STORAGE_KEY = "bootleg_trade_cart";
let tradeCart = loadCartFromStorage();

// Audio Synthesizer Engine (No external sound files required)
const SecurityAudio = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  },
  playBeep(freq = 440, type = 'sine', duration = 0.08) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  },
  click() { this.playBeep(800, 'square', 0.03); },
  alert() { this.playBeep(180, 'sawtooth', 0.25); },
  success() { 
    this.playBeep(523.25, 'sine', 0.08); 
    setTimeout(() => this.playBeep(659.25, 'sine', 0.12), 80);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  setupIntersectionObserver();
  injectDynamicThreatBanner();

  // Initialize audio context on first human interaction
  document.addEventListener("click", () => SecurityAudio.init(), { once: true });

  Papa.parse("./list.csv", {
    download: true,
    header: true,
    skipEmptyLines: "greedy",
    delimiter: "", // Auto-detect tab vs comma
    transformHeader: function(header) {
      return header.replace(/[\ufeff\u200b\r\n]/g, '').trim();
    },
    complete: function(results) {
      // Index records with encrypted case metadata tags
      allData = results.data.map((item, index) => {
        item._caseID = `CASE-${(index + 101).toString(16).toUpperCase()}`;
        item._searchIndex = `${getValByName(item, "Show")} ${getValByName(item, "Date")} ${getValByName(item, "Cast")} ${getValByName(item, "Master")} ${getValByName(item, "Tour", "Location")} ${getValByName(item, "Venue")}`.toLowerCase();
        return item;
      });
      
      applyFiltersAndRender();
      updateCartUI();
    },
    error: function(err) {
      const stats = document.getElementById('stats');
      if (stats) stats.innerText = "[CRITICAL SYSTEM ERROR]: DATA FILE 'list.csv' NOT FOUND OR CORRUPTED.";
    }
  });

  // Debounced Search Input Event with Glitch Feedback
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        SecurityAudio.click();
        applyFiltersAndRender();
      }, 120);
    });
  }

  // Format Filter Listeners
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      SecurityAudio.click();
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.getAttribute("data-filter");
      applyFiltersAndRender();
    });
  });

  // Category Filter Listeners
  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      SecurityAudio.click();
      document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentCategory = e.target.getAttribute("data-category");
      applyFiltersAndRender();
    });
  });

  // Event Delegation for Cards (Click to Declassify Redactions & Actions)
  const cardContainer = document.getElementById("card-container");
  if (cardContainer) {
    cardContainer.addEventListener("click", (e) => {
      // Interactive Classified Redactions
      const redactedEl = e.target.closest(".classified-redacted");
      if (redactedEl) {
        SecurityAudio.click();
        redactedEl.classList.toggle("revealed");
        return;
      }

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
      SecurityAudio.click();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Evidence Locker (Cart Drawer) Events
  const overlay = document.getElementById("drawer-overlay");
  const cartToggleBtn = document.getElementById("cart-toggle-btn");
  if (cartToggleBtn) cartToggleBtn.addEventListener("click", () => { SecurityAudio.click(); openDrawer(); });
  
  const closeDrawerBtn = document.getElementById("close-drawer-btn");
  if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", () => { SecurityAudio.click(); closeDrawer(); });
  
  if (overlay) overlay.addEventListener("click", closeDrawer);
  
  const clearCartBtn = document.getElementById("clear-cart-btn");
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      SecurityAudio.alert();
      tradeCart = [];
      saveCartToStorage();
      updateCartUI();
      applyFiltersAndRender();
    });
  }

  const copyTradeBtn = document.getElementById("copy-trade-btn");
  if (copyTradeBtn) copyTradeBtn.addEventListener("click", copyTradeRequest);

  // Secure Email Dispatch Handler
  const emailBtn = document.getElementById("email-trade-btn");
  if (emailBtn) {
    emailBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!tradeCart.length) {
        SecurityAudio.alert();
        alert("⚠️ EVIDENCE DOSSIER EMPTY. Select items to initiate secure requisition.");
        return;
      }

      SecurityAudio.success();
      const recipient = "tradingtreelost@gmail.com";
      const subject = `EVIDENCE DOSSIER REQUEST (${tradeCart.length} FILE REQUISITIONS)`;
      const bodyText = generateFormattedText();
      
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(bodyText).catch(() => {});
      }

      setTimeout(() => {
        const useGmail = confirm(
          "📂 DOSSIER COPIED TO SECURE BUFFER!\n\n" +
          "• Click 'OK' to dispatch via Web Terminal (Gmail).\n" +
          "• Click 'Cancel' for Native Mail Client."
        );
        if (useGmail) window.open(gmailUrl, "_blank");
        else window.location.href = mailtoUrl;
      }, 20);
    });
  }
});

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
    rootMargin: "400px",
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

  // Dynamic Terminal Status Output
  const statsEl = document.getElementById('stats');
  if (statsEl) {
    statsEl.innerText = `[RECORD COUNT]: ${currentFilteredItems.length} / ${allData.length} FILES RETRIEVED`;
  }

  // 2. Clear Container and Render Initial Frame
  const container = document.getElementById("card-container");
  if (container) {
    container.innerHTML = "";
    displayedCount = 0;

    if (currentFilteredItems.length > 0) {
      appendNextBatch(30);
    } else {
      container.innerHTML = `
        <div class="empty-archive-msg" style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #7a1d1d; border: 1px dashed #5a1010;">
          <h3>[NO MATCHING DOSSIERS FOUND]</h3>
          <p>Query matches no classified records in this archive level.</p>
        </div>
      `;
    }
  }
}

function appendNextBatch(count = BATCH_SIZE) {
  const container = document.getElementById("card-container");
  if (!container) return;

  const nextSlice = currentFilteredItems.slice(displayedCount, displayedCount + count);
  if (nextSlice.length === 0) return;

  const fragment = document.createDocumentFragment();
  const tempContainer = document.createElement("div");

  tempContainer.innerHTML = nextSlice.map((item, i) => {
    const globalIndex = displayedCount + i;
    const show = getValByName(item, "Show") || "UNNAMED INCIDENT";
    const date = getValByName(item, "Date");
    const matineeEve = getValByName(item, "Matinée / Evening", "Matinee / Evening");
    const showTime = matineeEve ? ` (${matineeEve})` : "";
    
    const format = getFormat(item);
    const sizeVal = getFileSize(item);

    let displayFormatStr = "";
    if (format && sizeVal) {
      displayFormatStr = `${format} [${sizeVal}]`;
    } else if (format) {
      displayFormatStr = format;
    } else if (sizeVal) {
      displayFormatStr = sizeVal;
    }

    const tour = getValByName(item, "Tour", "Location", "City");
    const venue = getValByName(item, "Venue", "Theater", "Theatre");
    const master = getValByName(item, "Master");
    const cast = getValByName(item, "Cast");
    const masterNotes = getValByName(item, "Master Notes");
    const tradingNotes = getValByName(item, "Trading Notes");
    const myNotes = getValByName(item, "My Notes");

    const displayType = getMediaType(item);
    const formatBadgeHTML = displayFormatStr ? `<span class="badge badge-format">${displayFormatStr}</span>` : '';
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
      nftBadgeHTML = `<br><span class="nft-active">⛔ SEALED PERMANENTLY (NFT FOREVER)</span>`;
    } else if (nftDateStr !== "") {
      if (isNftStillActive(nftDateStr)) {
        isNFTActive = true;
        nftBadgeHTML = `<br><span class="nft-active">⛔ EMBARGOED UNTIL: ${nftDateStr}</span>`;
      } else {
        isNFTActive = false;
        nftBadgeHTML = `<br><span class="nft-passed">✅ DECLASSIFIED (${nftDateStr})</span>`;
      }
    }

    const cardClass = `item-card ${isNFTActive ? 'card-nft-active' : 'card-standard'}`;
    const itemInCart = isInCart(item);

    // Apply interactive classified censorship to extra notes for thriller immersion
    const applyRedaction = (text) => {
      if (!text) return "";
      return text.replace(/\b(kill|death|blood|murder|secret|private|leak|bootleg|unknown|lost|missing)\b/gi, 
        '<span class="classified-redacted" title="Click to declassify">$1</span>');
    };

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
          <span style="font-size: 0.75rem; color: #6e2a2a; letter-spacing: 1px;">ID: ${item._caseID}</span><br>
          ${date ? `📅 <strong>Date:</strong> ${date}${showTime}` : ''} 
          ${locationParts ? `<br>📍 <strong>Location:</strong> ${locationParts}` : ''}
          ${master ? `<br>🎥 <strong>Operative / Master:</strong> ${master}` : ''}
          ${nftBadgeHTML}
        </div>

        ${cast ? `<div class="card-cast"><strong>PERSONNEL / CAST:</strong> ${applyRedaction(cast)}</div>` : ''}
        ${masterNotes ? `<div class="card-notes"><strong>OPERATIVE NOTES:</strong> ${applyRedaction(masterNotes)}</div>` : ''}
        ${tradingNotes ? `<div class="card-notes"><strong>EXCHANGE CONDITIONS:</strong> ${applyRedaction(tradingNotes)}</div>` : ''}
        ${myNotes ? `<div class="card-notes"><strong>ARCHIVIST REMARKS:</strong> ${applyRedaction(myNotes)}</div>` : ''}

        <div class="card-actions">
          <button type="button" class="add-cart-btn ${itemInCart ? 'in-cart' : ''}" data-index="${globalIndex}">
            ${itemInCart ? '✓ Dossier Attached' : '+ Requisition File'}
          </button>
          <button type="button" class="copy-card-btn" data-index="${globalIndex}">📋 Copy Intelligence</button>
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
   LOCALSTORAGE CART & THRILLER HELPERS
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
  const fmt = getFormat(item) || getFileSize(item) || getMediaType(item);
  return `${getValByName(item, "Show")}|${getValByName(item, "Date")}|${getValByName(item, "Master")}|${fmt}`.toLowerCase();
}

function isInCart(item) {
  const key = getItemKey(item);
  return tradeCart.some(c => c.key === key);
}

function toggleCartItem(item, buttonEl) {
  const key = getItemKey(item);
  const existingIdx = tradeCart.findIndex(c => c.key === key);

  if (existingIdx > -1) {
    SecurityAudio.alert();
    tradeCart.splice(existingIdx, 1);
    if (buttonEl) {
      buttonEl.innerText = "+ Requisition File";
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
      SecurityAudio.alert();
      const showName = getValByName(item, "Show") || "This file";
      const nftMsg = nftDateStr ? `ACTIVE EMBARGO UNTIL ${nftDateStr}` : "PERMANENT CLASSIFICATION";
      
      const proceed = confirm(
        `⛔ SECURITY EMBARGO WARNING\n\n` +
        `"${showName}" is restricted under [${nftMsg}].\n\n` +
        `Attempting to add this to your dossier anyway?`
      );

      if (!proceed) return;
    }

    SecurityAudio.success();
    const fmt = getFormat(item);
    const sz = getFileSize(item);
    let displayFmt = (fmt && sz) ? `${fmt} [${sz}]` : (fmt || sz || getMediaType(item));

    tradeCart.push({
      key: key,
      caseID: item._caseID || "FILE-RAW",
      show: getValByName(item, "Show") || "UNNAMED INCIDENT",
      date: getValByName(item, "Date") || "DATE UNKNOWN",
      type: getMediaType(item),
      format: displayFmt,
      tour: getValByName(item, "Tour", "Location", "City"),
      venue: getValByName(item, "Venue", "Theater", "Theatre"),
      master: getValByName(item, "Master")
    });

    if (buttonEl) {
      buttonEl.innerText = "✓ Dossier Attached";
      buttonEl.classList.add("in-cart");
    }
  }

  saveCartToStorage();
  updateCartUI();
}

function generateFormattedText() {
  const itemsText = tradeCart.map((item, i) => {
    const location = [item.tour, item.venue].filter(Boolean).join(" - ");
    let line = `${i + 1}. [${item.caseID}] ${item.show} - ${item.date} (${item.format})`;
    if (location) line += ` | ${location}`;
    if (item.master) line += ` | Master: ${item.master}`;
    return line;
  }).join("\n");

  return [
    "--- CLASSIFIED DOSSIER REQUISITION ---",
    "ATTN: ARCHIVE CONTROLLER",
    "I am requesting an evidence transfer for the following items:",
    "",
    itemsText,
    "",
    "SENDER DOSSIER / TRADE LINK: [INSERT YOUR LINK HERE]",
    "--- END TRANSMISSION ---"
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
    container.innerHTML = `<p class="empty-cart-msg">[EVIDENCE LOCKER EMPTY]: Select "+ Requisition File" on any record.</p>`;
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
      SecurityAudio.alert();
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
  SecurityAudio.success();
  const text = generateFormattedText();
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("copy-trade-btn");
    if (btn) {
      btn.innerText = "✅ Dossier Copied!";
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
  if (!item) return "";

  const sizeFields = ["File Size", "Size", "Filesize"];
  for (const f of sizeFields) {
    const val = getValByName(item, f);
    if (val) {
      const match = val.match(/\b\d+(\.\d+)?\s*(gb|mb|kb|tb)\b/i);
      if (match) return match[0].toUpperCase();
    }
  }

  for (const key in item) {
    const val = item[key];
    if (typeof val === 'string' && val) {
      const match = val.match(/\b\d+(\.\d+)?\s*(gb|mb|kb|tb)\b/i);
      if (match) return match[0].toUpperCase();
    }
  }

  return "";
}

function getFormat(item) {
  if (!item) return "";

  const candidateKeys = [
    "Trader Format", "Release Format", "File Format", 
    "Media Format", "Format", "Container", "Extension", 
    "Video Format", "Audio Format"
  ];

  let rawFormat = candidateKeys.map(k => getValByName(item, k)).find(v => Boolean(v)) || "";

  if (!rawFormat) {
    const formatRegex = /\b(vob|mp4|mkv|mov|avi|iso|mp3|m4a|flac|wav|ts|m2ts|wmv|mpg|mpeg|tracked|untracked)\b/i;
    for (const key in item) {
      const val = item[key];
      if (typeof val === 'string' && formatRegex.test(val)) {
        const match = val.match(formatRegex);
        if (match) {
          rawFormat = match[0].toUpperCase();
          break;
        }
      }
    }
  }

  if (!rawFormat) return "";

  let cleaned = rawFormat.replace(/\b\d+(\.\d+)?\s*(gb|mb|kb|tb)\b/gi, "");
  cleaned = cleaned.replace(/\b(video|audio|both|mixed)\b/gi, "");
  cleaned = cleaned
    .replace(/[\(\[\{\)\]\}]/g, " ")
    .replace(/[-–—/,\.\:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

function getMediaType(item) {
  const audioVideo = getValByName(item, "Audio / Video", "Audio/Video").toLowerCase();
  const typeRaw = getValByName(item, "Type").toLowerCase();
  
  const rawFmt = (
    getValByName(item, "Trader Format") + " " + 
    getValByName(item, "Release Format") + " " + 
    getValByName(item, "Format")
  ).toLowerCase();

  const isAudio = audioVideo.includes("audio") || typeRaw.includes("audio") || rawFmt.match(/\b(audio|mp3|m4a|wav|flac|tracked|cd)\b/);
  const isVideo = audioVideo.includes("video") || typeRaw.includes("video") || rawFmt.match(/\b(video|mp4|vob|mov|mkv|avi|iso)\b/);

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
  SecurityAudio.success();
  const show = getValByName(item, "Show") || "UNNAMED INCIDENT";
  const date = getValByName(item, "Date") || "UNKNOWN DATE";
  const tour = getValByName(item, "Tour", "Location", "City");
  const venue = getValByName(item, "Venue", "Theater", "Theatre");
  const master = getValByName(item, "Master") || "UNIDENTIFIED OPERATIVE";
  
  const fmt = getFormat(item);
  const sz = getFileSize(item);
  const formatStr = (fmt && sz) ? `${fmt} [${sz}]` : (fmt || sz || getMediaType(item));

  const location = [tour, venue].filter(Boolean).join(" - ");

  let text = `[${item._caseID || 'FILE'}] ${show} - ${date} (${formatStr})`;
  if (location) text += ` | ${location}`;
  if (master) text += ` | Operative: ${master}`;

  navigator.clipboard.writeText(text).then(() => {
    const originalText = buttonElement.innerText;
    buttonElement.innerText = "✅ Extracted!";
    buttonElement.classList.add("copied");

    setTimeout(() => {
      buttonElement.innerText = originalText;
      buttonElement.classList.remove("copied");
    }, 2000);
  });
}

function injectDynamicThreatBanner() {
  if (document.getElementById("thriller-security-bar")) return;
  const bar = document.createElement("div");
  bar.id = "thriller-security-bar";
  bar.style.cssText = `
    background: #110305;
    color: #ff3333;
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    padding: 6px 12px;
    border-bottom: 1px solid #660d0d;
    display: flex;
    justify-content: space-between;
    letter-spacing: 1px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.8);
  `;
  bar.innerHTML = `
    <span>🔒 SECURITY CLEARANCE: LEVEL 4 (INTERNAL USE ONLY)</span>
    <span>TERMINAL STATUS: ACTIVE MONITORING</span>
  `;
  document.body.prepend(bar);
}
