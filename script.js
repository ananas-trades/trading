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

function renderCards() {
  const query = document.getElementById("search-input").value.toLowerCase();
  const container = document.getElementById("card-container");
  container.innerHTML = "";

  const filtered = allData.filter(item => {
    const format = (item.Format || item["Media Type"] || "").trim();
    
    // Filter type check
    if (currentFilter !== 'all' && !format.toLowerCase().includes(currentFilter.toLowerCase())) {
      return false;
    }

    // Search query check
    const searchableText = Object.values(item).join(" ").toLowerCase();
    return searchableText.includes(query);
  });

  document.getElementById('stats').innerText = `Showing ${filtered.length} of ${allData.length} items`;

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";

    const show = item.Show || item["Show Name"] || "Unknown Show";
    const date = item.Date || item["Performance Date"] || "";
    const format = item.Format || item["Media Type"] || "Video";
    const cast = item.Cast || item["Cast List"] || "";
    const location = item.Location || item["Tour"] || item["Venue"] || "";

    const formatClass = format.toLowerCase().includes("audio") ? "badge-audio" : "badge-video";

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${show}</div>
        <span class="badge ${formatClass}">${format}</span>
      </div>
      <div class="card-meta">
        ${date ? `📅 ${date}` : ''} ${location ? `📍 ${location}` : ''}
      </div>
      ${cast ? `<div class="card-cast"><strong>Cast:</strong> ${cast}</div>` : ''}
    `;

    container.appendChild(card);
  });
}
