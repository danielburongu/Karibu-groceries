const user = JSON.parse(localStorage.getItem("kglUser") || "{}");

// ROLE PROTECTION
if (!user || user.role !== "director") {
  alert("Access denied. Director only.");
  window.location.href = "../../index.html";
}

// LOGOUT
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("kglUser");
  window.location.href = "../../index.html";
});

// LOAD DATA
const cashSales = JSON.parse(localStorage.getItem("kglSales") || "[]");
const creditSales = JSON.parse(localStorage.getItem("kglCreditSales") || "[]");

// GLOBAL TOTALS
const totalRevenue = cashSales.reduce((s, x) => s + (x.amountPaid || 0), 0);
const totalCredit = creditSales.reduce((s, x) => s + (x.amountDue || 0), 0);
const totalTonnage =
  cashSales.reduce((s, x) => s + (x.tonnageSold || 0), 0) +
  creditSales.reduce((s, x) => s + (x.tonnage || 0), 0);

document.getElementById("totalRevenue").textContent =
  formatCurrency(totalRevenue);
document.getElementById("totalCredit").textContent =
  formatCurrency(totalCredit);
document.getElementById("totalTonnage").textContent = `${totalTonnage} KG`;
document.getElementById("totalTransactions").textContent =
  cashSales.length + creditSales.length;

// BRANCH SUMMARY
const branches = {};

cashSales.forEach((s) => {
  if (!branches[s.branch]) {
    branches[s.branch] = { cash: 0, credit: 0, kg: 0 };
  }
  branches[s.branch].cash += s.amountPaid || 0;
  branches[s.branch].kg += s.tonnageSold || 0;
});

creditSales.forEach((s) => {
  if (!branches[s.branch]) {
    branches[s.branch] = { cash: 0, credit: 0, kg: 0 };
  }
  branches[s.branch].credit += s.amountDue || 0;
  branches[s.branch].kg += s.tonnage || 0;
});

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

// HELPERS
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  }).format(amount);
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
