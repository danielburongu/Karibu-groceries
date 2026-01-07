// salesHistory.js

const user = JSON.parse(localStorage.getItem("kglUser") || "{}");

// ===============================
// Role Protection
// ===============================
if (!user || (user.role !== "sales" && user.role !== "manager" && user.role !== "director")) {
  alert("Access denied. Unauthorized role.");
  window.location.href = "../index.html";
}

// ===============================
// Dynamic Back Button
// ===============================
const backBtn = document.getElementById("backToDashboard");
if (backBtn) {
  if (user.role === "director") {
    backBtn.href = "../director/director.html";
  } else if (user.role === "manager") {
    backBtn.href = "./manager.html";
  } else {
    backBtn.href = "./sales.html"; // Sales Agent dashboard (create later if needed)
  }
}

// ===============================
// DOM Elements
// ===============================
const tableBody = document.getElementById("salesTableBody");
const emptyState = document.getElementById("emptyState");
const recordCount = document.getElementById("recordCount");

const searchInput = document.getElementById("searchInput");
const branchFilter = document.getElementById("branchFilter");
const typeFilter = document.getElementById("typeFilter");
const dateFrom = document.getElementById("dateFrom");
const dateTo = document.getElementById("dateTo");

// ===============================
// Load Data
// ===============================
const cashSales = JSON.parse(localStorage.getItem("kglSales")) || [];
const creditSales = JSON.parse(localStorage.getItem("kglCreditSales")) || [];

// ===============================
// All Sales Records
// ===============================
let allSales = [];

// Cash Sales
cashSales.forEach((sale) => {
  allSales.push({
    dateTime: `${sale.date || ''} ${sale.time || ''}`.trim(),
    produce: sale.produceName || "Unknown",
    branch: (sale.branch || "unknown").toLowerCase(),
    tonnage: parseFloat(sale.tonnageSold) || 0,
    amount: parseFloat(sale.amountPaid) || 0,
    buyer: sale.buyerName || "N/A",
    agent: sale.salesAgent || "Unknown",
    type: "cash",
    rawDate: sale.date || "", // For date filtering
  });
});

// Credit Sales
creditSales.forEach((sale) => {
  allSales.push({
    dateTime: `${sale.dispatchDate || ''} ${sale.dispatchTime || ''}`.trim(),
    produce: sale.produceName || "Unknown",
    branch: (sale.branch || "unknown").toLowerCase(),
    tonnage: parseFloat(sale.tonnage) || 0,
    amount: parseFloat(sale.amountDue) || 0,
    buyer: sale.buyerName || "N/A",
    agent: sale.salesAgent || "Unknown",
    type: "credit",
    rawDate: sale.dispatchDate || "",
  });
});

// ===============================
// Role-Based Initial Filtering (Agent sees only own sales)
// ===============================
let displayedSales = allSales.filter((sale) => {
  if (user.role === "sales") {
    return sale.agent.toLowerCase() === user.username?.toLowerCase();
  }
  return true; // Manager & Director see all
});

// ===============================
// Sort: Most Recent First
// ===============================
displayedSales.sort((a, b) => {
  const dateA = new Date(a.rawDate || a.dateTime);
  const dateB = new Date(b.rawDate || b.dateTime);
  return dateB - dateA;
});

// ===============================
// Render Function
// ===============================
function renderTable(sales) {
  // Update record count
  recordCount.textContent = `${sales.length} record${sales.length !== 1 ? 's' : ''} found`;

  if (sales.length === 0) {
    tableBody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";
  tableBody.innerHTML = "";

  sales.forEach((sale) => {
    const row = document.createElement("tr");

    const branchName = sale.branch.charAt(0).toUpperCase() + sale.branch.slice(1);

    row.innerHTML = `
      <td>${sale.dateTime || "—"}</td>
      <td>${sale.produce}</td>
      <td>${branchName}</td>
      <td>${sale.tonnage.toLocaleString()}</td>
      <td class="amount">UGX ${sale.amount.toLocaleString()}</td>
      <td>${sale.buyer}</td>
      <td>${sale.agent}</td>
      <td class="type ${sale.type}">${sale.type.charAt(0).toUpperCase() + sale.type.slice(1)}</td>
    `;

    tableBody.appendChild(row);
  });
}

// Initial render
renderTable(displayedSales);

// ===============================
// Live Filters
// ===============================
function applyFilters() {
  let filtered = [...displayedSales];

  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedBranch = branchFilter.value.toLowerCase();
  const selectedType = typeFilter.value;
  const fromDate = dateFrom.value;
  const toDate = dateTo.value;

  if (searchTerm) {
    filtered = filtered.filter((sale) =>
      sale.buyer.toLowerCase().includes(searchTerm) ||
      sale.produce.toLowerCase().includes(searchTerm) ||
      sale.agent.toLowerCase().includes(searchTerm)
    );
  }

  if (selectedBranch) {
    filtered = filtered.filter((sale) => sale.branch === selectedBranch);
  }

  if (selectedType) {
    filtered = filtered.filter((sale) => sale.type === selectedType);
  }

  if (fromDate) {
    filtered = filtered.filter((sale) => sale.rawDate >= fromDate);
  }

  if (toDate) {
    filtered = filtered.filter((sale) => sale.rawDate <= toDate);
  }

  renderTable(filtered);
}

// Attach event listeners
[searchInput, branchFilter, typeFilter, dateFrom, dateTo].forEach((el) => {
  if (el) el.addEventListener("input", applyFilters);
  if (el) el.addEventListener("change", applyFilters);
});