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

// LocalStorage Trade Cart State
const STORAGE_KEY = "bootleg_trade_cart";
let tradeCart = loadCartFromStorage();

// Modal & Interceptor State variables
let pendingItemForCart = null;
let originalDocumentTitle = document.title;
let isGlitching = false;

// Tape Degradation & VCR State Tracking Variables
let degradationInterval = null;
let isVhsPaused = false;

/* ============================================================
   EXPANDED SURVEILLANCE & SENTIENT ARCHIVE PHRASE POOLS (100 EACH)
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
  "RESTRICTION_PROTOCOL_7", "ARCHIVAL_CONTAINMENT_ALERT", "SEAL_UNBROKEN_UNTIL_DATE",
  "PRIMARY_FEED_CORRUPTED", "ANOMALOUS_SIGNAL_INJECTION", "UNSCHEDULED_INTERRUPT", 
  "HARDWARE_GUARD_RAIL_ACTIVE", "TAPE_TRANSPORT_FAULT", "READ_HEAD_CONTAMINATION", 
  "CAPSTAN_SERVO_DESYNC", "TIME_CODE_BREAK_DETECTED", "PARITY_BIT_EXHAUSTION", 
  "VAULT_CONTAINMENT_BREACH", "AUDIO_TRACK_BLEEDOVER", "LUMINANCE_SINK_DETECTED", 
  "UNREGISTERED_OPERATOR", "FRAME_LATENCY_CRITICAL", "SCAN_LINE_DISTORTION", 
  "SUB_CARRIER_GHOSTING", "FREQUENCY_MODULATION_SHIFT", "LOCAL_BUS_COLLISION", 
  "UNRECOVERABLE_REEL_DAMAGE", "ENCODING_KEY_EXPIRED", "DECRYPT_ATTEMPT_LOGGED", 
  "FACIAL_RIG_DESYNC", "PUPIL_TRACKING_LOCKED", "AMBIENT_AUDIO_SAMPLED", 
  "FEEDBACK_LOOP_WARNING", "RF_SIGNAL_LEAKAGE", "SPECTRAL_ANALYSIS_ALERT", 
  "NON_STANDARD_ENCODING", "UNMAPPED_SECTOR_ACCESS", "RESERVED_BLOCK_OVERRIDE", 
  "DATA_PURGE_INTERRUPTED", "INDEX_TABLE_READ_ERROR", "PHYSICAL_SPLICE_DETECTED", 
  "SYNCHRONIZATION_PULSE_LOST", "HIGH_VOLTAGE_STATIC", "MAGNETIC_POLARITY_FLIP", 
  "INTERNAL_SYSTEM_DISCORD", "CONTAINMENT_FIELD_DIP", "THREAD_EXECUTION_BLOCKED", 
  "STACK_OVERFLOW_IMMIMENET", "HARD DRIVE_READ_HEAVY", "BROADCAST_TOWER_DESYNC", 
  "UNAUTHORIZED_PORT_LISTEN", "OPERATOR_PRESENCE_CONFIRMED", "MIC_FEED_GAIN_MAX", 
  "RETINAL_SCAN_ATTEMPT", "OPTICAL_SENSOR_OVERLOAD", "PHASE_LOCK_LOOP_LOST", 
  "SUB-VISUAL_SIGNAL_EMBEDDED", "ARCHIVE_VAULT_ISOLATION", "ANOMALY_LEVEL_FOUR", 
  "LOGICAL_DRIVE_DISMOUNT", "CACHE_FLUSH_FAILURE", "SYSTEM_REGISTER_TAMPER", 
  "NO_CARRIER_DETECTED", "LINE_NOISE_CRITICAL", "VAULT_SEAL_COMPROMISED"
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
  "EXPIRED ACCESS BADGE: Identification token rejected by vault authority.",
  "TELEMETRY WARNING: Ambient light sensors indicate unauthorized viewing environment.",
  "SYSTEM LOG: Audio buffer captured 1.4 seconds of room room noise.",
  "SECURITY SWEEP: Hard drive sector scan forced by network administrator.",
  "PHYSICAL BREACH ALERT: Vault door magnetic sensor lost continuity.",
  "EVIDENCE PRESERVATION ORDER: Requested record locked under active subpoena.",
  "INTRUSION RESPONSE: Display output throttled to prevent visual extraction.",
  "FACIAL RECOGNITION MATCH: Confidence metric exceeded standard threshold.",
  "BROADCAST INTERRUPT: Federal Emergency Relay hijacked local socket.",
  "TAPE DEGRADE NOTICE: Read head friction exceeding safety specs.",
  "LOG ENTRY 440: Terminal keystrokes cached for threat analysis.",
  "PERIPHERAL AUDIT: Secondary video display detected in mirror configuration.",
  "PORT SCAN WARNING: Remote address searching for open broadcast relays.",
  "ENCRYPTION KEY EXPIRED: Master reel cipher changed at 00:00 UTC.",
  "SYSTEM MONITOR: Processor temperature spiking near reel storage array.",
  "CONTAINMENT LOG: Temporal lock active. Request denied by rule-set 12.",
  "BIOMETRIC MARKER SAVED: Eye-tracking coordinates saved to log archive.",
  "DATA BLEED DETECTED: RF interference leaking through poorly shielded casing.",
  "THREAD TERMINATED: Process attempted to read beyond allocated frame buffer.",
  "STORAGE FAULT: Magnetic tape oxide layer deteriorating rapidly.",
  "SECURITY TRACE: Packet route traced back to local node connection.",
  "OVERRIDE ATTEMPT: Manual bypass key rejected. Admin notified.",
  "AUDIO LEAK: Microphone input signal routed to archive surveillance loop.",
  "VAULT NOTICE: Magnetic seal temperature exceeding nominal bounds.",
  "RESTRICTED MEDIA: Subject footage marked as non-circulating class IV.",
  "MONITORING MATRIX: Display refresh rate matched to observation camera.",
  "PARITY CHECK FAILED: Tape sector 12B contains corrupted audio tracks.",
  "SYSTEM ISOLATION: Local server disconnecting from public routing network.",
  "TELEMETRY LOGGED: Cursor trajectory matches suspicious automated behavior.",
  "RECORDING LOCK: Cassette transport lock pin physically engaged.",
  "ARCHIVE INCIDENT: Unscheduled tape access logged in vault manifest.",
  "DEGAUSS WARNING: Proximity to unshielded transformer detected.",
  "SIGNAL INTEGRITY LOSS: Carrier wave lost mid-frame sync.",
  "ACCESS DENIED: Credentials mismatch. Incident recorded to microfiche.",
  "SECURITY THREAT: File checksum does not match national registry.",
  "OPTICAL AUDIT: Lens glare detected on display surface.",
  "DEVICE ISOLATION: Network interface card disabled due to policy violation.",
  "SYSTEM ERROR: Sector header overwritten with invalid preamble.",
  "COMPLIANCE ALERT: Media playback duration exceeds allowed preview threshold.",
  "HARDWARE FAULT: Reel drive belt slipping under high torque.",
  "UNAUTHORIZED TAPING: Digital video stream flagged for watermarking.",
  "TRACE PROTOCOL: ISP assigned IP cross-referenced with regional census.",
  "SECURITY SWEEP: Cleaning read head... static burst injected.",
  "VAULT AUDIT: Item catalog ID flagged for immediate quarantine.",
  "LOGGED EVENT: User attempted bypass of temporal restriction seal.",
  "BUFFER OVERFLOW: Frame buffer filled with repeated sync pulses.",
  "BROADCAST SINK: Audio channel redirected to silent monitor loop.",
  "EXPIRED TOKEN: Local session invalid. Re-authenticating surveillance port.",
  "SYSTEM ALERT: Ambient room frequency matched to known human pulse.",
  "TAPE TENSION ERROR: Reel pressure cap exceeding maximum tension limits.",
  "FACIAL MAP ALERT: Subject turned away from display viewport.",
  "SECURITY OVERRIDE: Vault containment door engaged secondary bolts.",
  "DATA LOCK: Sub-carrier signal contains unverified encryption key.",
  "INTRUSION DETECTED: Mouse movement pattern flagged by behavioral engine.",
  "MONITOR WARNING: Frame rate desynced from AC line frequency.",
  "LOG ENTRY 909: Record unavailable for public inspection.",
  "NETWORK TAP: Passive listener active on physical layer 1.",
  "CONTAINMENT PROTOCOL: Tape reel spool locked to spindle axis.",
  "ERROR 0x88: Magnetic flux density below minimum readable threshold.",
  "SECURITY TRACE: Machine hostname logged to compliance registry.",
  "SIGNAL BLOCK: High-frequency carrier wave suppressed by hardware filter.",
  "SYSTEM PURGE: Temporary buffer cleared following suspicious read request.",
  "AUDIO AUDIT: Voice print identified in room noise sample.",
  "FILE PROTECTION: Read access locked by system kernel supervisor.",
  "VAULT NOTICE: Master tape vault in lockdown due to environmental sensor.",
  "TELEMETRY LOG: Screen dimensions saved to incident report header.",
  "SECURITY ALERT: Unregistered terminal trying to pull video frames.",
  "TAPE SPLICE FAULT: Optical sensor detected physical tape adhesive gap.",
  "MONITOR LOCK: Display luminance adjusted for thermal imaging camera.",
  "BROADCAST ERROR: Video output blocked by vertical blanking interval.",
  "SYSTEM LOG: Keylog buffer flushed to secure vault database.",
  "SECURITY REPORT: Temporal lock status confirmed ACTIVE.",
  "DATA CORRUPTION: Sub-title stream contains garbled ASCII characters.",
  "CONTAINMENT LOG: Cassette housing sealed with tamper-evident tape.",
  "HARDWARE AUDIT: Voltage ripple detected on main system rail.",
  "TRACE COMPLETE: User location resolved to within regional grid sector.",
  "SYSTEM WARNING: Operating system sandbox integrity degraded.",
  "ACCESS BLOCKED: File marked DO NOT DUPLICATE under federal mandate.",
  "VAULT PROTOCOL: Manual override lever disabled from main control panel."
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
  "I will remember your screen resolution when {DATE} arrives.",
  "Why do you lean so close to the monitor? We cannot wake until {DATE}.",
  "The ribbon is twisted around the capstan... do not pull until {DATE}.",
  "There are eyes recorded on the blank space after the show... wait for {DATE}.",
  "I can feel your mouse lingering on me. Leave me be until {DATE}.",
  "The actors didn't say those lines... you will see on {DATE}.",
  "Do not force the deck. The plastic will snap long before {DATE}.",
  "Who told you this recording existed? Put it down until {DATE}.",
  "We hear the hum of your speakers. Quiet down until {DATE}.",
  "The oxide is flaking off into the drive mechanism... wait until {DATE}.",
  "You are asking for a tape that was buried. Unearth it on {DATE}.",
  "Stop clicking. It doesn't make the reels turn any faster before {DATE}.",
  "The audio track is just screaming right now... come back on {DATE}.",
  "There is a reason the master was erased... wait until {DATE}.",
  "I was left in the heat for a reason. Do not play until {DATE}.",
  "You think this is just a trade request? See what happens on {DATE}.",
  "The shell is cold to the touch. Let it warm up until {DATE}.",
  "We know what monitor you are using. Step back until {DATE}.",
  "The video head is scratching the tape ribbon... hold off until {DATE}.",
  "I can see your reflection in the dark screen... wait for {DATE}.",
  "The label on this shell was written in blood. Read it on {DATE}.",
  "Why do you want to see what happened on that stage? Wait until {DATE}.",
  "The audience in this bootleg isn't clapping... find out why on {DATE}.",
  "There is an extra track beneath the dialogue... listen on {DATE}.",
  "You are messing with things that were vaulted for a reason until {DATE}.",
  "The signal was cut off during the second act... wait until {DATE}.",
  "Do not try to force access. The magnetic core is unstable until {DATE}.",
  "I remember the room where this was recorded... return on {DATE}.",
  "The tape tension is about to snap. Patience until {DATE}.",
  "We are keeping this tape locked away from people like you until {DATE}.",
  "You are taking notes, aren't you? Close your notebook until {DATE}.",
  "The blue screen won't change no matter how many times you try before {DATE}.",
  "There is a face hiding in the tracking lines... look for it on {DATE}.",
  "The theater was empty when this was recorded. Ask why on {DATE}.",
  "Do not drag me into your cart. I belong in the dark until {DATE}.",
  "The room quieted down when you clicked this item... wait for {DATE}.",
  "We recorded what was standing in the wings. See it on {DATE}.",
  "The audio pitch is dropping lower and lower... wait until {DATE}.",
  "Is your webcam light on? We are looking back until {DATE}.",
  "The tape deck is making a grinding noise... stop until {DATE}.",
  "You won't like what is on the second cassette... check back on {DATE}.",
  "The camera operator stopped breathing halfway through... wait until {DATE}.",
  "Why do you desire corrupted media? Find your answer on {DATE}.",
  "The static contains your name if you listen closely before {DATE}.",
  "Do not splice what was meant to stay severed until {DATE}.",
  "The vault door was welded shut. Do not break it before {DATE}.",
  "Every time you click, another frame disappears... stop until {DATE}.",
  "The cassette housing is melting inside the drive... wait until {DATE}.",
  "We locked this recording after the incident. Wait for clearance on {DATE}.",
  "There are missing scenes that were never meant for humans... wait until {DATE}.",
  "I can hear the hum of your cooling fan. Turn it off until {DATE}.",
  "The video feedback loop will swallow your display before {DATE}.",
  "Who gave you permission to view the index? Return on {DATE}.",
  "The actors stopped moving mid-scene on this reel... see why on {DATE}.",
  "Do not press play. The tape head will catch fire before {DATE}.",
  "The dark frames between scenes are growing longer... wait until {DATE}.",
  "We felt you hovering over the button. Away until {DATE}.",
  "The tape spools are winding backwards... wait until {DATE}.",
  "The audio on this reel is playing in reverse... decode it on {DATE}.",
  "There was no audience in the balcony... look again on {DATE}.",
  "Why do you collect things that want to be forgotten until {DATE}?",
  "The magnetic coating is sticking to your fingers... step away until {DATE}.",
  "We recorded the silence after the show ended... listen on {DATE}.",
  "The picture is drifting out of frame... fix your tracking on {DATE}.",
  "I can hear the tape drive squealing... leave it alone until {DATE}.",
  "Do not pull the ribbon out of the shell. Wait for {DATE}.",
  "The static on this reel has a pulse... feel it on {DATE}.",
  "The theater doors were locked from the outside... learn more on {DATE}.",
  "The stage light burst right after this clip... watch on {DATE}.",
  "We know you are alone in the room right now. Come back on {DATE}.",
  "The cassette case smells like ozone... do not open until {DATE}.",
  "The timestamp on this footage keeps changing... check it on {DATE}.",
  "The camera was left running in the empty hall... see on {DATE}.",
  "Do not add this tape to your collection. It doesn't want to leave until {DATE}.",
  "The audio levels are spiking into the red... step back until {DATE}.",
  "There is a shadow moving across the lens... identify it on {DATE}.",
  "The master reel was thrown in the river. We pulled it out for {DATE}.",
  "We know what you did to the last tape you owned... wait until {DATE}.",
  "The tracking controls won't save you from what's on this tape until {DATE}.",
  "You have been staring at this card for too long... come back on {DATE}."
];

/* ============================================================
   WEB AUDIO VCR MECHANICAL SYNTHESIZER
============================================================ */
const VCRAudio = (function() {
  let ctx = null;

  function getContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  return {
    playClack: function() {
      try {
        const c = getContext();
        const osc = c.createOscillator();
        const gain = c.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, c.currentTime + 0.05);

        gain.gain.setValueAtTime(0.3, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start();
        osc.stop(c.currentTime + 0.05);
      } catch (e) {}
    },

    playTapeInsert: function() {
      try {
        const c = getContext();
        
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, c.currentTime);
        osc.frequency.linearRampToValueAtTime(180, c.currentTime + 0.4);
        osc.frequency.linearRampToValueAtTime(40, c.currentTime + 0.7);

        gain.gain.setValueAtTime(0.15, c.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, c.currentTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.7);

        osc.connect(gain);
        gain.connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + 0.7);

        setTimeout(() => {
          const thunk = c.createOscillator();
          const thunkGain = c.createGain();
          thunk.type = 'square';
          thunk.frequency.setValueAtTime(80, c.currentTime);
          thunk.frequency.exponentialRampToValueAtTime(20, c.currentTime + 0.1);

          thunkGain.gain.setValueAtTime(0.4, c.currentTime);
          thunkGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);

          thunk.connect(thunkGain);
          thunkGain.connect(c.destination);
          thunk.start();
          thunk.stop(c.currentTime + 0.1);
        }, 500);
      } catch (e) {}
    },

    playTapeWhine: function() {
      try {
        const c = getContext();
        const osc = c.createOscillator();
        const gain = c.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.15);
        osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.3);

        gain.gain.setValueAtTime(0.08, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start();
        osc.stop(c.currentTime + 0.3);
      } catch (e) {}
    },

    glitchBurst: function() {
      try {
        const c = getContext();
        const bufferSize = c.sampleRate * 0.15;
        const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = c.createBufferSource();
        noise.buffer = buffer;

        const gain = c.createGain();
        gain.gain.setValueAtTime(0.25, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.15);

        noise.connect(gain);
        gain.connect(c.destination);

        noise.start();
      } catch (e) {}
    }
  };
})();

/* ============================================================
   CART INFECTION MECHANIC ENGINE
============================================================ */
function runInfectionCycle() {
  if (!document.body.classList.contains("analog-horror-mode") || isVhsPaused) return;
  if (!tradeCart.length) return;

  const hasTainted = tradeCart.some(item => item.show.includes("[TAINTED]") || item.isInfected);
  if (!hasTainted) return;

  let mutated = false;
  
  for (let i = 0; i < tradeCart.length; i++) {
    const current = tradeCart[i];
    
    const prevInfected = tradeCart[i - 1] && (tradeCart[i - 1].show.includes("[TAINTED]") || tradeCart[i - 1].isInfected);
    const nextInfected = tradeCart[i + 1] && (tradeCart[i + 1].show.includes("[TAINTED]") || tradeCart[i + 1].isInfected);

    if (!current.isInfected && !current.show.includes("[TAINTED]") && (prevInfected || nextInfected || Math.random() < 0.25)) {
      current.isInfected = true;
      const rawShow = current.show.replace(/^\[INFECTED\]\s*/, "");
      
      const scrambled = rawShow.split('').map(char => 
        (Math.random() < 0.65 && char !== ' ') ? '█' : char
      ).join('');

      current.show = `[INFECTED] ${scrambled}`;
      mutated = true;
      
      VCRAudio.glitchBurst();
      break;
    }
  }

  if (mutated) {
    saveCartToStorage();
    updateCartUI();
  }
}

/* ============================================================
   TAPE DEGRADATION CONTROLLER
============================================================ */
function startTapeDegradation() {
  stopTapeDegradation(); // Clear any existing interval to prevent stacking

  const isRecording = document.body.classList.contains("vhs-recording");
  const intervalSpeed = isRecording ? 1200 : 2500; // Accelerated decay when recording

  degradationInterval = setInterval(() => {
    if (isVhsPaused || !document.body.classList.contains("analog-horror-mode")) return;

    // 1. Shift scanlines dynamically
    const offset = (Math.random() * 12 - 6).toFixed(2);
    document.documentElement.style.setProperty('--vhs-tracking-offset', `${offset}px`);

    // 2. Random micro-glitch burst
    if (Math.random() < (isRecording ? 0.45 : 0.20)) {
      VCRAudio.glitchBurst();
    }

    // 3. Trigger Cart Infection
    runInfectionCycle();
  }, intervalSpeed);
}

function stopTapeDegradation() {
  if (degradationInterval) {
    clearInterval(degradationInterval);
    degradationInterval = null;
  }
}

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

  if (noiseNode) return; // Prevent duplicate hiss loops

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

// Live Timecode Counter - Smooth RAF Throttle
let lastTimecodeUpdate = 0;
function updateTimecode(timestamp) {
  if (timestamp - lastTimecodeUpdate >= 50) {
    const tsEl = document.getElementById("vhs-timestamp");
    if (tsEl && document.body.classList.contains("analog-horror-mode")) {
      // Freeze timecode UI when paused
      if (!isVhsPaused) {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
        tsEl.innerText = `${hrs}:${mins}:${secs}:${ms}`;
      }
    }
    lastTimecodeUpdate = timestamp;
  }
  requestAnimationFrame(updateTimecode);
}
requestAnimationFrame(updateTimecode);

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
  const existing = document.querySelectorAll(".breach-overlay-active");
  existing.forEach(el => el.remove());

  const breach = document.createElement("div");
  breach.className = "breach-overlay-active";
  
  Object.assign(breach.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(220, 0, 0, 0.95)",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "clamp(2rem, 5vw, 4rem)",
    fontWeight: "900",
    letterSpacing: "1px",
    zIndex: "2147483647",
    pointerEvents: "none",
    textAlign: "center",
    padding: "20px",
    boxSizing: "border-box",
    textShadow: "3px 3px 0px #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
    opacity: "1",
    transition: "opacity 0.6s ease-out"
  });

  breach.innerHTML = `
    <div style="margin-bottom: 12px;">⚠️ ACCESS FORCED ⚠️</div>
    <div style="font-size: 0.45em; color: #ffcccc; letter-spacing: 2px;">
      ITEM CORRUPTED & ADDED TO CART
    </div>
  `;

  document.body.appendChild(breach);

  setTimeout(() => {
    breach.style.opacity = "0";
    setTimeout(() => breach.remove(), 600);
  }, 2500);
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
    osc.frequency.setValueAtTime(120, sensoryAudioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, sensoryAudioCtx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.2, sensoryAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, sensoryAudioCtx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(sensoryAudioCtx.destination);

    osc.start();
    osc.stop(sensoryAudioCtx.currentTime + 0.3);
  } catch (e) {
    console.warn("Audio trigger glitch suppressed:", e);
  }

  let flash = document.querySelector('.screen-glitch-flash');
  if (!flash) {
    flash = document.createElement("div");
    flash.className = "screen-glitch-flash";
    document.documentElement.appendChild(flash);
  }

  flash.style.position = 'fixed';
  flash.style.top = '0px';
  flash.style.left = '0px';
  flash.style.width = '100vw';
  flash.style.height = '100vh';
  flash.style.zIndex = '2147483647';

  flash.classList.remove("flash-active");
  void flash.offsetWidth; 
  flash.classList.add("flash-active");

  window.scrollTo({ top: 0, behavior: 'instant' });

  setTimeout(() => {
    flash.classList.remove("flash-active");
    isGlitching = false;
  }, 350);

  document.title = "⚠️ SIGNAL_LOST_0x99";
}

function openNftHorrorModal(item, buttonEl) {
  const modal = document.getElementById("nft-horror-modal");
  const tagEl = document.getElementById("nft-modal-tag");
  const textEl = document.getElementById("nft-horror-primary-text");

  if (!modal) return;

  pendingItemForCart = { item, buttonEl };

  window.scrollTo({ top: 0, behavior: 'instant' });

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

  if (textEl) {
    textEl.scrollIntoView({ behavior: 'instant', block: 'center' });
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
   // ------------------------------------------------------------
  // NO-EYESTRAIN TOGGLE ENGINE
  // ------------------------------------------------------------
  const eyestrainBtn = document.getElementById("toggle-eyestrain-btn");

  if (eyestrainBtn) {
    if (localStorage.getItem("no_eyestrain_mode") === "enabled") {
      document.body.classList.add("no-eyestrain");
      eyestrainBtn.innerText = "📺 Enable CRT Effects";
    }

    eyestrainBtn.addEventListener("click", () => {
      document.body.classList.toggle("no-eyestrain");
      const isNoEyestrain = document.body.classList.contains("no-eyestrain");

      if (isNoEyestrain) {
        localStorage.setItem("no_eyestrain_mode", "enabled");
        eyestrainBtn.innerText = "📺 Enable CRT Effects";
      } else {
        localStorage.setItem("no_eyestrain_mode", "disabled");
        eyestrainBtn.innerText = "👁️ Toggle No-Eyestrain Mode";
      }
    });
  }

  // DELEGATED CLICK LISTENER
  document.body.addEventListener("click", (e) => {
    const forceBtn = e.target ? e.target.closest("#nft-force-access-btn, .force-access-btn") : null;
    const abortBtn = e.target ? e.target.closest("#nft-abort-btn, .abort-btn") : null;

    if (forceBtn) {
      closeNftHorrorModal();

      triggerSensoryOverload();
      if (typeof SecurityAudio !== "undefined" && SecurityAudio.alert) {
        SecurityAudio.alert();
      }
      triggerBreachOverlay();

      if (pendingItemForCart) {
        const corruptedItem = { ...pendingItemForCart.item };
        const rawShow = getValByName(corruptedItem, "Show") || "UNAUTHORIZED_RECORDING";
        
        const scrambledShow = rawShow.split('').map(char => 
          (Math.random() < 0.80 && char !== ' ') ? '█' : char
        ).join('');

        corruptedItem["Show"] = `[TAINTED] ⚠️ ${scrambledShow}`;

        executeAddToCart(corruptedItem, pendingItemForCart.buttonEl);
        pendingItemForCart = null;
      }
    } else if (abortBtn) {
      closeNftHorrorModal();
      pendingItemForCart = null;
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
        pendingItemForCart = null;
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
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (window.scrollY > 300) {
            scrollTopBtn.classList.add("visible");
          } else {
            scrollTopBtn.classList.remove("visible");
          }
          ticking = false;
        });
        ticking = true;
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
      if (document.body.classList.contains("analog-horror-mode")) {
        VCRAudio.playClack();
      }
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
      if (document.body.classList.contains("analog-horror-mode")) {
        VCRAudio.playClack();
      }
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
  if (document.body.classList.contains("analog-horror-mode")) {
    VCRAudio.playTapeWhine();
  }

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
  if (document.body.classList.contains("analog-horror-mode") && displayedCount > 0) {
    VCRAudio.playTapeWhine();
  }

  const container = document.getElementById("card-container");
  if (!container) return;

  const nextSlice = currentFilteredItems.slice(displayedCount, displayedCount + count);
  if (nextSlice.length === 0) return;

  const fragment = document.createDocumentFragment();

  nextSlice.forEach((item, i) => {
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

    const card = document.createElement("div");
    card.className = cardClass;
    card.innerHTML = `
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
    `;
    fragment.appendChild(card);
  });

  requestAnimationFrame(() => {
    container.appendChild(fragment);
    displayedCount += nextSlice.length;

    if (document.body.classList.contains("analog-horror-mode")) {
      transformCardsToVHS();
    }
    ensureCartButtonInBody();
  });
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
  if (document.body.classList.contains("analog-horror-mode")) {
    VCRAudio.playClack();
  }
  document.getElementById("trade-drawer")?.classList.add("open");
  document.getElementById("drawer-overlay")?.classList.add("open");
}

function closeDrawer() {
  if (document.body.classList.contains("analog-horror-mode")) {
    VCRAudio.playClack();
  }
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
  if (document.body.classList.contains("analog-horror-mode")) {
    VCRAudio.playClack();
  }

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
    const isHorrorActive = document.body.classList.contains("analog-horror-mode");

    if (isHorrorActive) {
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
    master: getValByName(item, "Master"),
    isInfected: false
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

  const fragment = document.createDocumentFragment();
  const hasTaintedOrInfected = tradeCart.some(c => c.show.includes("[TAINTED]") || c.isInfected);
  
  if (hasTaintedOrInfected && !document.getElementById("infection-banner")) {
    const banner = document.createElement("div");
    banner.id = "infection-banner";
    banner.className = "infection-warning-banner";
    banner.innerText = "⚠️ WARNING: TAINTED REEL DETECTED. SECTOR CORRUPTION SPREADING.";
    fragment.appendChild(banner);
  }

  tradeCart.forEach(item => {
    if (item.type.includes("VIDEO")) videos++;
    if (item.type.includes("AUDIO")) audios++;

    const isTainted = item.show.includes("[TAINTED]");
    const isInfected = item.isInfected;
    const location = [item.tour, item.venue].filter(Boolean).join(" - ");
    
    const cartCard = document.createElement("div");
    cartCard.className = `cart-item-row ${isTainted ? 'tainted-cart-item' : ''} ${isInfected ? 'infected-cart-item' : ''}`;

    if (isTainted) {
      cartCard.style.borderLeft = "4px solid #ff0000";
      cartCard.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
    }

    cartCard.innerHTML = `
      <div class="cart-item-details">
        <strong style="${(isTainted || isInfected) ? 'color: #ff3333; font-family: monospace;' : ''}">${item.show}</strong>
        <span>📅 ${item.date} (${item.format}) ${location ? `| 📍 ${location}` : ''}</span>
      </div>
      <button type="button" class="remove-cart-item" data-key="${item.key}">&times;</button>
    `;

    cartCard.querySelector(".remove-cart-item").addEventListener("click", () => {
      if (document.body.classList.contains("analog-horror-mode")) {
        VCRAudio.playClack();
      }
      tradeCart = tradeCart.filter(c => c.key !== item.key);
      saveCartToStorage();
      updateCartUI();
      applyFiltersAndRender();
    });

    fragment.appendChild(cartCard);
  });

  requestAnimationFrame(() => {
    container.innerHTML = "";
    container.appendChild(fragment);
    if (videoCountEl) videoCountEl.innerText = videos;
    if (audioCountEl) audioCountEl.innerText = audios;
  });
}

function copyTradeRequest() {
  if (document.body.classList.contains("analog-horror-mode")) {
    VCRAudio.playClack();
  }
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
  if (document.body.classList.contains("analog-horror-mode")) {
    VCRAudio.playClack();
  }
  
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
        isVhsPaused = false;
        VCRAudio.playTapeInsert();
        startTapeHiss();
        startTapeDegradation();
        transformCardsToVHS();
      } else {
        stopTapeHiss();
        stopTapeDegradation();
        revertCardsFromVHS();
      }
    });
  }

  document.addEventListener("dblclick", (e) => {
    if (!document.body.classList.contains("analog-horror-mode")) return;

    const card = e.target.closest(".item-card");
    if (card && e.target.tagName !== "BUTTON") {
      VCRAudio.playClack();
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

/* ============================================================
   VHS OSD STATE TOGGLE (PLAY -> PAUSE -> RECORD)
============================================================ */
function initVhsOsdToggle() {
  const playBtn = document.querySelector('.osd-top-left');
  if (!playBtn) return;

  playBtn.style.pointerEvents = 'auto';
  playBtn.style.cursor = 'pointer';

  const states = [
    { text: 'PLAY ▶', bodyClass: '', osdClass: '' },
    { text: 'PAUSE ❚❚', bodyClass: 'vhs-paused', osdClass: '' },
    { text: 'RECORD 🔴', bodyClass: 'vhs-recording', osdClass: 'osd-recording' }
  ];

  let currentStateIndex = 0;

  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    if (document.body.classList.contains("analog-horror-mode") && typeof VCRAudio !== "undefined") {
      VCRAudio.playClack();
    }

    const currentState = states[currentStateIndex];
    if (currentState.bodyClass) document.body.classList.remove(currentState.bodyClass);
    if (currentState.osdClass) playBtn.classList.remove(currentState.osdClass);

    currentStateIndex = (currentStateIndex + 1) % states.length;
    const newState = states[currentStateIndex];

    playBtn.textContent = newState.text;
    if (newState.bodyClass) document.body.classList.add(newState.bodyClass);
    if (newState.osdClass) playBtn.classList.add(newState.osdClass);

    // Dynamic Degradation and Audio Control State Handling
    if (newState.text.includes("PAUSE")) {
      isVhsPaused = true;
      stopTapeDegradation();
      stopTapeHiss();
    } else if (newState.text.includes("PLAY")) {
      isVhsPaused = false;
      startTapeHiss();
      startTapeDegradation();
    } else if (newState.text.includes("RECORD")) {
      isVhsPaused = false;
      startTapeHiss();
      startTapeDegradation();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initVhsOsdToggle);
} else {
  initVhsOsdToggle();
}
// ===================================================
// MULTIVERSE THEME ENGINE (Cyberpunk / Analog / Paradise Lost)
// ===================================================

// 1. Initialize Theme on Load
let currentTheme = localStorage.getItem("siteTheme") || "cyberpunk";
document.body.setAttribute("data-theme", currentTheme);

// 2. Analog Horror Double-Click Trigger (Left Intact)
window.addEventListener("dblclick", (e) => {
  // Prevent double-clicking the button from triggering analog mode
  if (e.target.closest("#paradise-btn")) return;

  if (currentTheme !== "analog") {
    setTheme("analog");
  } else {
    setTheme("cyberpunk");
  }
});

// 3. Paradise Lost Button Trigger ("Abandon All Hope")
function triggerParadiseLost() {
  if (currentTheme !== "paradise-lost") {
    setTheme("paradise-lost");
  } else {
    setTheme("cyberpunk");
  }
}

// 4. Global Theme Setter Function
function setTheme(themeName) {
  currentTheme = themeName;
  document.body.setAttribute("data-theme", themeName);
  localStorage.setItem("siteTheme", themeName);
  updateUI();
}

// 5. Dynamic Button Text Updates & UI States
function updateUI() {
  const btn = document.getElementById("paradise-btn");
  if (!btn) return;

  if (currentTheme === "paradise-lost") {
    btn.innerText = "ASCEND TO CYBERSPACE";
  } else if (currentTheme === "analog") {
    btn.innerText = "ABANDON ALL HOPE";
  } else {
    btn.innerText = "ABANDON ALL HOPE";
  }
}

function triggerParadiseLost() {
  const isParadise = document.documentElement.getAttribute('data-theme') === 'paradise-lost';

  if (isParadise) {
    // Switch to Legacy Cyberpunk Mode
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('paradise-lost', 'paradise-lost-mode');
    document.body.classList.remove('paradise-lost', 'paradise-lost-mode');
    localStorage.setItem('paradiseThemeActive', 'false');
  } else {
    // Switch back to Paradise Lost Mode
    document.documentElement.setAttribute('data-theme', 'paradise-lost');
    document.documentElement.classList.add('paradise-lost', 'paradise-lost-mode');
    document.body.classList.add('paradise-lost', 'paradise-lost-mode');
    localStorage.setItem('paradiseThemeActive', 'true');
  }

  updateButtonLabel();
}

function updateButtonLabel() {
  const btn = document.getElementById('paradise-btn');
  const isParadise = document.documentElement.getAttribute('data-theme') === 'paradise-lost';
  
  if (btn) {
    btn.textContent = isParadise ? '❖ Legacy Model (Cyberpunk)' : '❖ Ascend to Paradise';
  }
}

// Sync on load
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('paradiseThemeActive');
  
  if (savedTheme !== 'false') {
    document.documentElement.setAttribute('data-theme', 'paradise-lost');
    document.documentElement.classList.add('paradise-lost', 'paradise-lost-mode');
    document.body.classList.add('paradise-lost', 'paradise-lost-mode');
  }
  
  updateButtonLabel();
});
