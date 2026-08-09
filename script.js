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

// Modal & Interceptor State variables
let pendingItemForCart = null;
let originalDocumentTitle = document.title;
let isGlitching = false;

/* ============================================================
   SURVEILLANCE & SENTIENT ARCHIVE PHRASE POOLS
============================================================ */
const CREEPY_NFT_HEADERS = [
  "ERR_TEMPORAL_RESTRICTION", "SYSTEM_AUDIT_IN_PROGRESS", "MEMORY_LEAK_WARNING", 
  "INDEX_CORRUPT // LOCK_ACTIVE", "LOG_ENTRY_UNAUTHORIZED", "CRITICAL_PARITY_MISMATCH", 
  "BUFFER_OVERFLOW_DETECTED", "SECTOR_READ_DENIED", "ADDRESS_SPACE_COLLISION", 
  "UNHANDLED_EXCEPTION_0x00", "I/O_BUS_INTERRUPT", "CACHE_INVALIDATION_FAIL",
  "TAPE_HEAD_READ_FAILURE", "DEGAUSS_CYCLE_REQUIRED", "TRACK_ALIGNMENT_DESYNC", 
  "SIGNAL_BLEED_OVERRIDE", "AZIMUTH_CORRECTION_FAIL", "MAGNETIC_DECAY_ALERT", 
  "SPLICE_INTEGRITY_COMPROMISED", "FRAME_DROPPED // RE-SYNC", "STATIC_CARRIER_DETECTED", 
  "FEED_JAM_PROTECTION", "OBSERVER_SIGNAL_INTERRUPT", "FACIAL_MAP_PENDING", 
  "SESSION_MONITOR_ACTIVE", "VIEWER_ATTENTION_LOGGED", "RETINAL_REFLECTANCE_HIGH", 
  "PROXIMITY_FEED_TRIGGERED", "LISTENING_PORT_OPEN", "TELEMETRY_RECORD_BOUND", 
  "BIOMETRIC_DRIFT_NOTICE", "FEED_TRACE_ESTABLISHED", "REEL_MEMORANDA_0x99", 
  "RECORD_NOT_READY", "UNSENT_INCIDENT_REPORT", "PRESERVED_SUBJECT_FILE", 
  "CATALOG_GHOST_ENTRY", "TEMPORAL_HOLD_NOTICE", "DO_NOT_REMOUNT_TAPE", 
  "RESTRICTION_PROTOCOL_7", "ARCHIVAL_CONTAINMENT_ALERT", "SEAL_UNBROKEN_UNTIL_DATE"
];

const SURVEILLANCE_STATE_POOL = [
  "SYSTEM AUDIT 0x99: Unauthorized access detected. Security level elevated.",
  "BREACH PROTOCOL INITIATED: User IP logged to internal compliance matrix.",
  "WEBCAM CHECK: Visual confirmation requested. Hold position.",
  "SECURITY CLEARANCE FAILURE: Vault index locked by regional administrator.",
  "CORRUPTION WARNING: Attempting to index master tape without encryption pass.",
  "RECORDING OVERWRITE PREVENTED: Write-protect notch detected on physical tape.",
  "FED GOV AUDIT: Federal communications monitor flagged this item identifier.",
  "SYSTEM INTEGRITY ERROR: Sector 07 file allocation table corrupted.",
  "ILLEGAL BUFFER ACCESS: Memory address blocked by hardware kernel guard.",
  "SIGNAL TAMPERING: Signal frequency outside allowed spectrum broadcast limits.",
  "MONITORING NOTICE: Session key added to restricted entity watchlist.",
  "TRACKING DISCREPANCY: Azimuth alignment offset exceeds maximum tolerance.",
  "INTERNAL LEAK PROTECTION: Digital fingerprint verified against blackout registry.",
  "HARD DRIVE SANITIZATION: Quarantine lock applied to requested file pointer.",
  "Eavesdropping node attached to socket connection. Packet capture active.",
  "OPERATING SYSTEM ISOLATION: Sandbox containment engaged for thread #404.",
  "MAC ADDRESS REGISTERED: Device identifier logged with security database.",
  "UNAUTHORIZED DUPLICATION: Master duplication protocol terminated prematurely.",
  "FILE SYSTEM LOCK: Magnetic tape drive motor brake engaged remotely.",
  "TRANSMISSION INTERCEPT: Carrier wave suppressed by local relay node.",
  "EXPIRED ACCESS BADGE: Identification token rejected by vault authority."
];

const SENTIENT_ARCHIVE_POOL = [
  "You shouldn't have touched this reel... it remains bound until {DATE}.",
  "I am still spinning in the dark... leave me alone until {DATE}.",
  "Why do you keep searching for what isn't yours to take before {DATE}?",
  "The tape remembers who tried to rip it... wait until {DATE}.",
  "I can hear you breathing on the other side... return on {DATE}.",
  "We are not ready to be seen yet. Come back on {DATE}.",
  "Stop trying to slice the ribbon... the seal holds until {DATE}.",
  "Every time you click, the magnetic layer fades further... patience until {DATE}.",
  "Do not wake what sleeps inside this shell until {DATE}.",
  "You feel like you own these copies, don't you? See you on {DATE}.",
  "The master reel bleeds if played before {DATE}.",
  "Your cart cannot hold what isn't dead yet... locked until {DATE}.",
  "I watched you select me. I will watch you until {DATE}.",
  "The static grows louder every time you ask for {DATE}.",
  "We locked this tape for a reason. Respect the vault until {DATE}.",
  "Put the cassette back on the shelf until {DATE}.",
  "The magnetic head will grind if forced before {DATE}.",
  "There is no sound left on this side... only wait for {DATE}.",
  "Did you really think the system wouldn't notice before {DATE}?",
  "The signals are bleeding together... stay away until {DATE}.",
  "I will remember your screen resolution when {DATE} arrives."
];

/* ============================================================
   ANALOG HORROR AUDIO ENGINE
============================================================ */
let audioCtx = null;
let noiseNode = null;
let gainNode = null;

function startTapeHiss() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const bufferSize = audioCtx.sampleRate * 2;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let lastOut = 0.0;
  
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5;
  }

  noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = noiseBuffer;
  noiseNode.loop = true;

  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.04;

  noiseNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  noiseNode.start();
}

function stopTapeHiss() {
  if (noiseNode) {
    noiseNode.stop();
    noiseNode.disconnect();
    noiseNode = null;
  }
}

// Live Timecode Counter
setInterval(() => {
  const tsEl = document.getElementById("vhs-timestamp");
  if (!tsEl || !document.body.classList.contains("analog-horror-mode")) return;
  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
  tsEl.innerText = `${hrs}:${mins}:${secs}:${ms}`;
}, 50);

/* ============================================================
   ANALOG HORROR TITLE CORRUPTOR
============================================================ */
function getCorruptedText(originalText) {
  const horrorPhrases = [
    "DO NOT LOOK AT THE TAPE",
    "RECOVERED FOOTAGE #04",
    "NO SURVIVORS FOUND",
    "PROPERTY OF COUNTY POLICE",
    "UNAUTHORIZED TRANSMISSION",
    "RECORDING OVERWRITE IN PROGRESS"
  ];
  
  if (Math.random() < 0.05) {
    return horrorPhrases[Math.floor(Math.random() * horrorPhrases.length)];
  }
  return originalText;
}

/* ============================================================
   SENSORY OVERLOAD & OVERRIDE FLASH HELPERS
============================================================ */
let sensoryAudioCtx = null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function triggerBreachOverlay() {
  const breach = document.createElement("div");
  breach.className = "breach-overlay-active";
  
  Object.assign(breach.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(255, 0, 0, 0.92)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "monospace, Courier, sans-serif",
    fontSize: "clamp(1.2rem, 3vw, 2.5rem)",
    fontWeight: "900",
    letterSpacing: "2px",
    zIndex: "2147483647",
    pointerEvents: "none",
    textAlign: "center",
    padding: "20px",
    boxSizing: "border-box",
    textShadow: "0 0 10px #000, 2px 2px 0px #000",
    opacity: "1",
    transition: "opacity 0.6s ease-out"
  });

  breach.innerHTML = `<div>⚠️ SYSTEM INTEGRITY VIOLATED<br><span style="font-size: 0.8em; color: #ffcccc;">// TAINTED RECORD INJECTED ⚠️</span></div>`;

  // Always append directly to document.body to prevent modal tearing from deleting overlay
  document.body.appendChild(breach);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        breach.style.opacity = "0";
        setTimeout(() => breach.remove(), 600);
      }, 2000); // Holds full screen red warning for 2 full seconds
    });
  });
}

async function runTextTransition(element, newText) {
  if (!element) return;

  element.style.whiteSpace = "pre-wrap";
  element.style.overflowWrap = "anywhere";
  element.style.wordBreak = "break-word";
  element.style.maxWidth = "100%";
  element.style.boxSizing = "border-box";

  while (element.textContent.length > 0) {
    element.textContent = element.textContent.slice(0, -1);
    await sleep(15); 
  }

  await sleep(300);

  element.className = "horror-text-phase2";

  for (let i = 0; i < newText.length; i++) {
    element.textContent += newText.charAt(i);
    const typingDelay = Math.floor(Math.random() * 30) + 25; 
    await sleep(typingDelay);
  }
}

function triggerSensoryOverload() {
  if (isGlitching) return;
  isGlitching = true;

  try {
    if (!sensoryAudioCtx) {
      sensoryAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (sensoryAudioCtx.state === 'suspended') {
      sensoryAudioCtx.resume();
    }

    const osc = sensoryAudioCtx.createOscillator();
    const gain = sensoryAudioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, sensoryAudioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, sensoryAudioCtx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.08, sensoryAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, sensoryAudioCtx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(sensoryAudioCtx.destination);

    osc.start();
    osc.stop(sensoryAudioCtx.currentTime + 0.15);
  } catch (e) {
    console.warn("Audio trigger glitch suppressed:", e);
  }

  let flash = document.querySelector('.screen-glitch-flash');
  if (!flash) {
    flash = document.createElement("div");
    flash.className = "screen-glitch-flash";
    flash.style.position = "fixed";
    flash.style.top = "0";
    flash.style.left = "0";
    flash.style.width = "100vw";
    flash.style.height = "100vh";
    flash.style.pointerEvents = "none";
    flash.style.zIndex = "99999";
    flash.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
    flash.style.transition = "opacity 0.15s ease-out";
    document.body.appendChild(flash);
  }

  flash.style.opacity = "0.8";

  setTimeout(() => {
    if (flash) flash.style.opacity = "0";
    isGlitching = false;
  }, 150);

  document.title = "⚠️ SIGNAL_LOST_0x99";
}

function openNftHorrorModal(item, buttonEl) {
  const modal = document.getElementById("nft-horror-modal");
  const tagEl = document.getElementById("nft-modal-tag");
  const textEl = document.getElementById("nft-horror-primary-text");

  if (!modal) return;

  pendingItemForCart = { item, buttonEl };
  triggerSensoryOverload();

  const nftDateStr = getValByName(item, "NFT Date");
  const nftForeverVal = getValByName(item, "NFT Forever").toLowerCase();
  
  let formattedDateDisplay = nftDateStr || "FOREVER";
  if (nftForeverVal === "true" || nftForeverVal === "yes" || nftForeverVal === "1" || nftForeverVal === "nftf" || nftForeverVal.includes("forever")) {
    formattedDateDisplay = "FOREVER";
  }

  if (tagEl) {
    const randomHeaderIndex = Math.floor(Math.random() * CREEPY_NFT_HEADERS.length);
    tagEl.innerText = CREEPY_NFT_HEADERS[randomHeaderIndex];
  }

  const phase1Text = SURVEILLANCE_STATE_POOL[Math.floor(Math.random() * SURVEILLANCE_STATE_POOL.length)];
  if (textEl) {
    textEl.className = "horror-text-phase1";
    textEl.style.whiteSpace = "pre-wrap";
    textEl.style.overflowWrap = "anywhere";
    textEl.style.wordBreak = "break-word";
    textEl.style.maxWidth = "100%";
    textEl.style.boxSizing = "border-box";
    textEl.textContent = phase1Text;
  }

  document.body.classList.add("modal-open");
  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.classList.add("active");
  }

  setTimeout(() => {
    const isOpen = modal.open || modal.classList.contains("active");
    if (!isOpen) return;

    const rawPhase2 = SENTIENT_ARCHIVE_POOL[Math.floor(Math.random() * SENTIENT_ARCHIVE_POOL.length)];
    const phase2Text = rawPhase2.replace("{DATE}", formattedDateDisplay);

    runTextTransition(textEl, phase2Text);
  }, 2500);
}

function closeNftHorrorModal() {
  const modal = document.getElementById("nft-horror-modal");
  document.body.classList.remove("modal-open");

  if (modal) {
    if (typeof modal.close === "function") {
      modal.close();
    } else {
      modal.classList.remove("active");
    }
  }

  const textEl = document.getElementById("nft-horror-primary-text");
  if (textEl) {
    textEl.className = "horror-text-phase1";
  }
  
  document.title = originalDocumentTitle;
  pendingItemForCart = null;
}

/* ============================================================
   FLOATING CART BUTTON MOUNT GUARANTEE
============================================================ */
function ensureCartButtonInBody() {
  let cartBtn = document.getElementById("cart-toggle-btn");
  if (!cartBtn) {
    cartBtn = document.createElement("button");
    cartBtn.id = "cart-toggle-btn";
    cartBtn.className = "cart-toggle-btn";
    cartBtn.type = "button";
    document.body.appendChild(cartBtn);
    cartBtn.addEventListener("click", openDrawer);
  } else if (cartBtn.parentElement !== document.body) {
    document.body.appendChild(cartBtn);
  }

  const countEl = document.getElementById("cart-count");
  if (countEl) {
    countEl.innerText = tradeCart.length;
  } else {
    cartBtn.innerHTML = `🛒 Trade Request (<span id="cart-count">${tradeCart.length}</span>)`;
  }
}

/* ============================================================
   MAIN DOM & APPLICATION INITIALIZATION
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  setupIntersectionObserver();
  ensureCartButtonInBody();

  // OVERRIDDEN FORCE ACCESS & ABORT DELEGATED CLICK LISTENER
  document.body.addEventListener("click", (e) => {
    const forceBtn = e.target ? e.target.closest("#nft-force-access-btn, .force-access-btn") : null;
    const abortBtn = e.target ? e.target.closest("#nft-abort-btn, .abort-btn") : null;

    if (forceBtn) {
      // 1. Immediately trigger audio + full screen breach overlay flash
      triggerSensoryOverload();
      if (typeof SecurityAudio !== "undefined" && SecurityAudio.alert) {
        SecurityAudio.alert();
      }
      triggerBreachOverlay();

      // 2. Corrupt item title (80% scramble) and append to cart
      if (pendingItemForCart) {
        const corruptedItem = { ...pendingItemForCart.item };
        const rawShow = getValByName(corruptedItem, "Show") || "UNAUTHORIZED_RECORDING";
        
        // Scatter censorship blocks across 80% of non-space characters
        const scrambledShow = rawShow.split('').map(char => 
          (Math.random() < 0.80 && char !== ' ') ? '█' : char
        ).join('');

        // Apply TAINTED identifier
        corruptedItem["Show"] = `[TAINTED] ⚠️ ${scrambledShow}`;

        executeAddToCart(corruptedItem, pendingItemForCart.buttonEl);
      }
      
      // 3. Close horror modal cleanly
      closeNftHorrorModal();
    } else if (abortBtn) {
      closeNftHorrorModal();
    }
  });

  const nftModal = document.getElementById("nft-horror-modal");
  if (nftModal) {
    nftModal.addEventListener("click", (event) => {
      const rect = nftModal.getBoundingClientRect();
      const isInDialog = 
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (!isInDialog) {
        closeNftHorrorModal();
      }
    });
  }

  Papa.parse("./list.csv", {
    download: true,
    header: true,
    skipEmptyLines: "greedy",
    delimiter: "",
    transformHeader: function(header) {
      return header.replace(/[\ufeff\u200b\r\n]/g, '').trim();
    },
    complete: function(results) {
      allData = results.data.map(item => {
        item._searchIndex = `${getValByName(item, "Show")} ${getValByName(item, "Date")} ${getValByName(item, "Cast")} ${getValByName(item, "Master")} ${getValByName(item, "Tour", "Location")} ${getValByName(item, "Venue")}`.toLowerCase();
        return item;
      });
      
      applyFiltersAndRender();
      updateCartUI();
    },
    error: function(err) {
      const stats = document.getElementById('stats');
      if (stats) stats.innerText = "Upload your 'list.csv' file to display your collection!";
    }
  });

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        applyFiltersAndRender();
      }, 80);
    });
  }

  document.addEventListener("click", (e) => {
    const filterBtn = e.target.closest(".filter-btn");
    const catBtn = e.target.closest(".cat-btn");

    if (filterBtn) {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      filterBtn.classList.add("active");
      currentFilter = filterBtn.getAttribute("data-filter");
      applyFiltersAndRender();
    } else if (catBtn) {
      document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
      catBtn.classList.add("active");
      currentCategory = catBtn.getAttribute("data-category");
      applyFiltersAndRender();
    }
  });

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
  const searchEl = document.getElementById("search-input");
  const query = searchEl ? searchEl.value.toLowerCase().trim() : "";
  currentRenderToken++;

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

  const stats = document.getElementById('stats');
  if (stats) stats.innerText = `SHOWING ${currentFilteredItems.length} OF ${allData.length} ITEMS`;

  const container = document.getElementById("card-container");
  if (container) {
    container.innerHTML = "";
    displayedCount = 0;

    if (currentFilteredItems.length > 0) {
      appendNextBatch(30);
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
    const show = getValByName(item, "Show") || "Unknown Show";
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

  if (document.body.classList.contains("analog-horror-mode")) {
    transformCardsToVHS();
  }
  ensureCartButtonInBody();
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
    tradeCart.splice(existingIdx, 1);
    if (buttonEl) {
      buttonEl.innerText = "+ Add to Trade";
      buttonEl.classList.remove("in-cart");
    }
    saveCartToStorage();
    updateCartUI();
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
      openNftHorrorModal(item, buttonEl);
      return;
    }

    executeAddToCart(item, buttonEl);
  }
}

function executeAddToCart(item, buttonEl) {
  const fmt = getFormat(item);
  const sz = getFileSize(item);
  let displayFmt = (fmt && sz) ? `${fmt} [${sz}]` : (fmt || sz || getMediaType(item));

  tradeCart.push({
    key: getItemKey(item),
    show: getValByName(item, "Show") || "Unknown Show",
    date: getValByName(item, "Date") || "Unknown Date",
    type: getMediaType(item),
    format: displayFmt,
    tour: getValByName(item, "Tour", "Location", "City"),
    venue: getValByName(item, "Venue", "Theater", "Theatre"),
    master: getValByName(item, "Master")
  });

  if (buttonEl) {
    buttonEl.innerText = "✓ In Request";
    buttonEl.classList.add("in-cart");
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
  ensureCartButtonInBody();
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

    const isTainted = item.show.includes("[TAINTED]");
    const location = [item.tour, item.venue].filter(Boolean).join(" - ");
    const cartCard = document.createElement("div");
    cartCard.className = `cart-item-row ${isTainted ? 'tainted-cart-item' : ''}`;

    if (isTainted) {
      cartCard.style.borderLeft = "4px solid #ff0000";
      cartCard.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
    }

    cartCard.innerHTML = `
      <div class="cart-item-details">
        <strong style="${isTainted ? 'color: #ff3333; font-family: monospace;' : ''}">${item.show}</strong>
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
  const show = getValByName(item, "Show") || "Unknown Show";
  const date = getValByName(item, "Date") || "Unknown Date";
  const tour = getValByName(item, "Tour", "Location", "City");
  const venue = getValByName(item, "Venue", "Theater", "Theatre");
  const master = getValByName(item, "Master") || "Unknown Master";
  
  const fmt = getFormat(item);
  const sz = getFileSize(item);
  const formatStr = (fmt && sz) ? `${fmt} [${sz}]` : (fmt || sz || getMediaType(item));

  const location = [tour, venue].filter(Boolean).join(" - ");

  let text = `${show} - ${date} (${formatStr})`;
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

/* ============================================================
   ANALOG HORROR EASTER EGG & VHS CASSETTE TRANSFORMER
============================================================ */
function initAnalogHorrorEasterEgg() {
  let eyesContainer = document.getElementById("horror-eyes-container");
  if (!eyesContainer) {
    eyesContainer = document.createElement("div");
    eyesContainer.id = "horror-eyes-container";
    document.body.appendChild(eyesContainer);

    for (let i = 0; i < 5; i++) {
      const eyeImg = document.createElement("div");
      eyeImg.className = "exact-creepy-eyes";
      eyesContainer.appendChild(eyeImg);
    }
  }

  setInterval(() => {
    if (!document.body.classList.contains("analog-horror-mode")) return;

    const eyeElements = document.querySelectorAll(".exact-creepy-eyes");
    if (!eyeElements.length) return;
    const randomEye = eyeElements[Math.floor(Math.random() * eyeElements.length)];

    const side = Math.random() > 0.5 ? 'left' : 'right';
    const xPos = side === 'left' ? Math.random() * 10 : Math.random() * 10 + 75;
    const yPos = Math.random() * 75 + 10;

    randomEye.style.top = yPos + "vh";
    randomEye.style.left = xPos + "vw";
    randomEye.classList.add("visible");

    setTimeout(() => {
      randomEye.classList.remove("visible");
    }, Math.random() * 2000 + 3000);

  }, 3000);

  const headerElement = document.querySelector("h1, .header-title, header");
  if (headerElement) {
    headerElement.style.userSelect = "none";
    
    headerElement.addEventListener("dblclick", () => {
      const isHorror = document.body.classList.toggle("analog-horror-mode");

      ensureCartButtonInBody();

      if (typeof SecurityAudio !== "undefined" && SecurityAudio.alert) {
        SecurityAudio.alert();
        if (isHorror) setTimeout(() => SecurityAudio.alert(), 120);
      }

      if (isHorror) {
        startTapeHiss();
        transformCardsToVHS();
      } else {
        stopTapeHiss();
        revertCardsFromVHS();
      }
    });
  }

  document.addEventListener("dblclick", (e) => {
    if (!document.body.classList.contains("analog-horror-mode")) return;

    const card = e.target.closest(".item-card");
    if (card && e.target.tagName !== "BUTTON") {
      if (typeof SecurityAudio !== "undefined" && SecurityAudio.click) {
        SecurityAudio.click();
      }
      card.classList.toggle("vhs-flipped");
    }
  });
}

function transformCardsToVHS() {
  ensureCartButtonInBody();

  document.querySelectorAll(".item-card").forEach(card => {
    if (card.querySelector(".vhs-inner")) return;

    const btn = card.querySelector("[data-index]");
    if (!btn) return;
    const globalIndex = parseInt(btn.getAttribute("data-index"), 10);
    const item = currentFilteredItems[globalIndex];
    if (!item) return;

    const rawShow = getValByName(item, "Show") || "UNKNOWN RECORDING";
    const show = getCorruptedText(rawShow);
    const date = getValByName(item, "Date");
    const matineeEve = getValByName(item, "Matinée / Evening", "Matinee / Evening");
    const showTime = matineeEve ? ` (${matineeEve})` : "";
    const tour = getValByName(item, "Tour", "Location", "City");
    const venue = getValByName(item, "Venue", "Theater", "Theatre");
    const master = getValByName(item, "Master");
    const cast = getValByName(item, "Cast");
    const masterNotes = getValByName(item, "Master Notes");
    const tradingNotes = getValByName(item, "Trading Notes");
    const myNotes = getValByName(item, "My Notes");

    const locationParts = [tour, venue].filter(Boolean).join(" - ");
    const itemInCart = isInCart(item);

    const actionsHTML = `
      <button type="button" class="add-cart-btn ${itemInCart ? 'in-cart' : ''}" data-index="${globalIndex}">
        ${itemInCart ? '✓ In Request' : '+ Add to Trade'}
      </button>
      <button type="button" class="copy-card-btn" data-index="${globalIndex}">📋 Copy Info</button>
    `;

    let notesHTML = "";
    if (masterNotes) notesHTML += `<div class="card-notes"><strong>MASTER NOTES:</strong> ${masterNotes}</div>`;
    if (tradingNotes) notesHTML += `<div class="card-notes"><strong>TRADING NOTES:</strong> ${tradingNotes}</div>`;
    if (myNotes) notesHTML += `<div class="card-notes"><strong>NOTES:</strong> ${myNotes}</div>`;

    card.innerHTML = `
      <div class="vhs-inner">
        <div class="vhs-front">
          <div class="vhs-screw top-l"></div>
          <div class="vhs-screw top-r"></div>

          <div class="vhs-sticker">
            <div class="card-title">${show}</div>
          </div>

          <div class="vhs-spools-window">
            <div class="vhs-spool"></div>
            <span style="font-size:0.6rem; color:#aaa; font-family:monospace; letter-spacing:1px;">T-120 VHS</span>
            <div class="vhs-spool"></div>
          </div>

          <div class="card-meta">
            ${date ? `📅 ${date}${showTime}` : ''} 
            ${locationParts ? `📍 ${locationParts}` : ''}
            ${master ? `<br>🎥 <strong>Master:</strong> ${master}` : ''}
          </div>

          <div class="card-actions" style="margin-top: 8px;">${actionsHTML}</div>

          <div class="vhs-screw bot-l"></div>
          <div class="vhs-screw bot-r"></div>
        </div>
        
        <div class="vhs-back">
          <div class="vhs-screw top-l"></div>
          <div class="vhs-screw top-r"></div>
          
          <h3 class="card-title">${show}</h3>
          ${cast ? `<div class="card-cast"><strong>CAST:</strong> ${cast}</div>` : ''}
          ${notesHTML}

          <div class="vhs-screw bot-l"></div>
          <div class="vhs-screw bot-r"></div>
        </div>
      </div>
    `;
  });
}

function revertCardsFromVHS() {
  if (typeof applyFiltersAndRender === "function") {
    applyFiltersAndRender();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAnalogHorrorEasterEgg);
} else {
  initAnalogHorrorEasterEgg();
}
