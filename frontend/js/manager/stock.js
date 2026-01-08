const user = JSON.parse(localStorage.getItem("kglUser") || "{}");

// ROLE PROTECTION
if (!user || user.role !== "manager") {
  alert("Access denied. Manager only.");
  window.location.href = "../index.html";
}

// DOM
const tableBody = document.getElementById("stockTableBody");
const emptyState = document.getElementById("emptyState");

const totalTonnageEl = document.getElementById("totalTonnage");
const totalItemsEl = document.getElementById("totalItems");
const lowStockCountEl = document.getElementById("lowStockCount");
const outStockCountEl = document.getElementById("outStockCount");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

// DATA
const stock = JSON.parse(localStorage.getItem("kglStock") || "[]");

// RENDER
function renderStock(data) {
  tableBody.innerHTML = "";

  if (!data.length) {
    emptyState.classList.remove("d-none");
    return;
  }

  emptyState.classList.add("d-none");

  data.forEach((item) => {
    let status = "available";
    if (item.tonnage <= 0) status = "out";
    else if (item.tonnage <= 500) status = "low";

    const row = document.createElement("tr");
    row.dataset.status = status;

    row.innerHTML = `
      <td>${item.produceName}</td>
      <td>${item.produceType}</td>
      <td>${item.branch}</td>
      <td class="text-end">${item.tonnage}</td>
      <td class="text-end">UGX ${item.sellingPrice}</td>
      <td><span class="status-badge status-${status}">
        ${status === "out" ? "Out" : status === "low" ? "Low" : "Available"}
      </span></td>
    `;

    tableBody.appendChild(row);
  });
}

// KPIs
function updateKPIs() {
  let totalKG = 0;
  let low = 0;
  let out = 0;

  stock.forEach((item) => {
    totalKG += item.tonnage;
    if (item.tonnage <= 0) out++;
    else if (item.tonnage <= 500) low++;
  });

  totalTonnageEl.textContent = `${totalKG} KG`;
  totalItemsEl.textContent = stock.length;
  lowStockCountEl.textContent = low;
  outStockCountEl.textContent = out;

  if (out > 0) {
    alert(" Stock Alert: Some items are out of stock.");
  }
}

// FILTERS
function applyFilters() {
  const term = searchInput.value.toLowerCase();
  const status = statusFilter.value;

  const filtered = stock.filter((item) => {
    const matchesSearch =
      item.produceName.toLowerCase().includes(term) ||
      item.branch.toLowerCase().includes(term);

    let itemStatus = "available";
    if (item.tonnage <= 0) itemStatus = "out";
    else if (item.tonnage <= 500) itemStatus = "low";

    const matchesStatus = status === "all" || status === itemStatus;

    return matchesSearch && matchesStatus;
  });

  renderStock(filtered);
}

// EVENTS
searchInput.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);

// INIT
renderStock(stock);
updateKPIs();
