// managerDashboard.js

/* AUTH & ROLE PROTECTION */
const user = JSON.parse(localStorage.getItem("kglUser") || "{}");

if (!user || user.role !== "manager") {
  alert("Access denied. Manager only.");
  window.location.href = "../index.html";
}

/* USER CONTEXT */
document.addEventListener("DOMContentLoaded", () => {
  // Optional: show manager info if elements exist
  const nameEl = document.getElementById("managerName");
  const branchEl = document.getElementById("managerBranch");

  if (nameEl) nameEl.textContent = user.username || "Manager";
  if (branchEl)
    branchEl.textContent =
      user.branch?.charAt(0).toUpperCase() + user.branch?.slice(1) || "—";
});

/* LOGOUT */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (confirm("Logout from Karibu Groceries?")) {
      localStorage.removeItem("kglUser");
      window.location.href = "../index.html";
    }
  });
}

/* NAVIGATION ACTIONS */
// Record procurement (manager only)
const openProcurement = document.getElementById("openProcurement");
if (openProcurement) {
  openProcurement.addEventListener("click", () => {
    window.location.href = "../pages/procurement.html";
  });
}

// View stock levels
const viewStock = document.getElementById("viewStock");
if (viewStock) {
  viewStock.addEventListener("click", () => {
    window.location.href = "../pages/stock.html";
  });
}

// Manager sales (manager CAN record sales)
const managerSales = document.getElementById("managerSales");
if (managerSales) {
  managerSales.addEventListener("click", () => {
    window.location.href = "../pages/cash-sale.html";
  });
}

// Sales history (manager sees all branch sales)
const viewSalesHistory = document.getElementById("viewSalesHistory");
if (viewSalesHistory) {
  viewSalesHistory.addEventListener("click", () => {
    window.location.href = "../pages/sales-history.html";
  });
}

/* Prevent stock manipulation by mistake */
window.addEventListener("storage", (e) => {
  if (e.key === "kglUser" && !e.newValue) {
    alert("Session expired. Please login again.");
    window.location.href = "../index.html";
  }
});
