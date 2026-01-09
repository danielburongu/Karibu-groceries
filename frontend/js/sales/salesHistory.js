/* SESSION CHECK */
let user = null;

try {
  user = JSON.parse(localStorage.getItem("kglUser"));
} catch {
  user = null;
}

if (!user || !user.role) {
  window.location.href = "../index.html";
}

/* LOAD DATA*/
const cashSales = JSON.parse(localStorage.getItem("kglSales") || "[]");
const creditSales = JSON.parse(localStorage.getItem("kglCreditSales") || "[]");

/* BUTTON CONTROL */
const cashBtn = document.getElementById("cashBtn");
const creditBtn = document.getElementById("creditBtn");
const exportBtn = document.getElementById("exportCsvBtn");

if (user.role === "director") {
  cashBtn && (cashBtn.style.display = "none");
  creditBtn && (creditBtn.style.display = "none");
  exportBtn && (exportBtn.style.display = "none");
}

/* DIRECTOR VIEW (SUMMARY ONLY) */
if (user.role === "director") {
  const summary = document.getElementById("directorSummary");
  summary && summary.classList.remove("d-none");

  const totalCash = cashSales.reduce((s, x) => s + (x.amountPaid || 0), 0);

  const totalCredit = creditSales.reduce((s, x) => s + (x.amountDue || 0), 0);

  const totalTonnage =
    cashSales.reduce((s, x) => s + (x.tonnageSold || 0), 0) +
    creditSales.reduce((s, x) => s + (x.tonnage || 0), 0);

  setText("totalCash", formatCurrency(totalCash));
  setText("totalCredit", formatCurrency(totalCredit));
  setText("totalTonnage", `${totalTonnage.toLocaleString()} KG`);
  setText("totalTransactions", cashSales.length + creditSales.length);
}

/* TABLE VIEW (MANAGER / SALES)*/
document.getElementById("salesTableSection")?.classList.remove("d-none");

const tableBody = document.getElementById("salesTableBody");
const emptyState = document.getElementById("emptyState");
const recordCount = document.getElementById("recordCount");

const branchFilter = document.getElementById("branchFilter");
const typeFilter = document.getElementById("typeFilter");

let allSales = [];

/* CASH SALES*/
cashSales.forEach((s) => {
  allSales.push({
    date: `${s.date || ""} ${s.time || ""}`.trim() || "-",
    produce: s.produceName || "-",
    branch: (s.branch || "").toLowerCase(),
    kg: s.tonnageSold || 0,
    amount: s.amountPaid || 0,
    buyer: s.buyerName || "-",
    agent: s.salesAgent || "-",
    type: "cash",
  });
});

/* CREDIT SALES */
creditSales.forEach((s) => {
  allSales.push({
    date: s.createdAt ? new Date(s.createdAt).toLocaleString("en-GB") : "-",
    produce: s.produceName || "-",
    branch: (s.branch || "").toLowerCase(),
    kg: s.tonnage || 0,
    amount: s.amountDue || 0,
    buyer: s.buyerName || "-",
    agent: s.salesAgent || "-",
    type: "credit",
  });
});

/* SALES AGENT VIEW (OWN SALES) */
if (user.role === "sales") {
  exportBtn && (exportBtn.style.display = "none");

  allSales = allSales.filter(
    (s) => s.agent && s.agent.toLowerCase() === user.username.toLowerCase(),
  );
}

/* RENDER TABLE */
function render(data) {
  if (!tableBody || !emptyState) return;

  tableBody.innerHTML = "";

  if (data.length === 0) {
    showEmpty(
      "No records found",
      "Sales transactions will appear here once recorded.",
    );
    recordCount.textContent = "0 records";
    return;
  }

  emptyState.classList.add("d-none");
  recordCount.textContent = `${data.length} record(s)`;

  data.forEach((s) => {
    tableBody.innerHTML += `
      <tr>
        <td>${s.date}</td>
        <td>${s.produce}</td>
        <td>${capitalize(s.branch)}</td>
        <td class="text-end">${s.kg.toLocaleString()}</td>
        <td class="text-end">${formatCurrency(s.amount)}</td>
        <td>${s.buyer}</td>
        <td>${s.agent}</td>
        <td class="type ${s.type}">${s.type}</td>
      </tr>
    `;
  });
}

/* FILTER HANDLING*/
function applyFilters() {
  let filtered = [...allSales];

  if (branchFilter?.value) {
    filtered = filtered.filter(
      (s) => s.branch === branchFilter.value.toLowerCase(),
    );
  }

  if (typeFilter?.value) {
    filtered = filtered.filter((s) => s.type === typeFilter.value);
  }

  render(filtered);
}

branchFilter?.addEventListener("change", applyFilters);
typeFilter?.addEventListener("change", applyFilters);

/* INIT */
render(allSales);

/* HELPERS */
function capitalize(v = "") {
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : "-";
}

function formatCurrency(v = 0) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  }).format(v);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function showEmpty(title, message) {
  emptyState.classList.remove("d-none");
  emptyState.innerHTML = `
    <h5 class="mb-2">${title}</h5>
    <p class="text-muted mb-0">${message}</p>
  `;
}
