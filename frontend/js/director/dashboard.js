// director/dashboard.js — Director Analytics (READ-ONLY)

/* AUTH & ROLE PROTECTION */
const user = JSON.parse(localStorage.getItem("kglUser") || "{}");

if (!user || user.role !== "director") {
  alert("Access denied. Directors only.");
  window.location.href = "../../index.html";
  throw new Error("Unauthorized access");
}

/* LOAD SALES DATA (SAFE) */
const allSales = JSON.parse(localStorage.getItem("kglSales") || "[]");

/* Separate by type */
const cashSales = allSales.filter((s) => s.type === "cash");
const creditSales = allSales.filter((s) => s.type === "credit");

/* GLOBAL TOTALS */
const totalRevenue = cashSales.reduce((sum, s) => sum + (s.amountPaid || 0), 0);

const totalCredit = creditSales.reduce((sum, s) => sum + (s.amountDue || 0), 0);

const totalTonnage =
  cashSales.reduce((s, x) => s + (x.tonnageSold || 0), 0) +
  creditSales.reduce((s, x) => s + (x.tonnageSold || 0), 0);

/* UPDATE KPI UI */
document.getElementById("totalRevenue").textContent =
  formatCurrency(totalRevenue);

document.getElementById("totalCredit").textContent =
  formatCurrency(totalCredit);

document.getElementById("totalTonnage").textContent =
  `${totalTonnage.toLocaleString()} KG`;

document.getElementById("totalTransactions").textContent =
  cashSales.length + creditSales.length;

/* BRANCH SUMMARY */
const branches = {};

allSales.forEach((sale) => {
  if (!branches[sale.branch]) {
    branches[sale.branch] = { cash: 0, credit: 0, kg: 0 };
  }

  if (sale.type === "cash") {
    branches[sale.branch].cash += sale.amountPaid || 0;
    branches[sale.branch].kg += sale.tonnageSold || 0;
  }

  if (sale.type === "credit") {
    branches[sale.branch].credit += sale.amountDue || 0;
    branches[sale.branch].kg += sale.tonnageSold || 0;
  }
});

/* RENDER TABLE */
const tbody = document.getElementById("branchSummaryTable");
tbody.innerHTML = "";

Object.entries(branches).forEach(([branch, data]) => {
  tbody.innerHTML += `
    <tr>
      <td>${capitalize(branch)}</td>
      <td class="text-end">${formatCurrency(data.cash)}</td>
      <td class="text-end">${formatCurrency(data.credit)}</td>
      <td class="text-end">${data.kg.toLocaleString()}</td>
    </tr>
  `;
});

/* HELPERS */
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

function capitalize(text = "") {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
