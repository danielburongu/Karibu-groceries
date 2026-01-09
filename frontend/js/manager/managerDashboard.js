// managerDashboard.js — Manager Dashboard Logic

/* AUTH & ROLE PROTECTION */
let user = null;
try {
  user = JSON.parse(localStorage.getItem("kglUser"));
} catch {
  user = null;
}

if (!user || user.role !== "manager") {
  alert("Access denied. Managers only.");
  window.location.href = "/index.html";
  throw new Error("Unauthorized access");
}

/* DOM READY */
document.addEventListener("DOMContentLoaded", () => {
  /* USER CONTEXT */
  const nameEl = document.getElementById("managerName");
  const branchEl = document.getElementById("managerBranch");

  if (nameEl) {
    nameEl.textContent = user.displayName || user.username || "Manager";
  }

  if (branchEl) {
    branchEl.textContent = user.branch
      ? user.branch.charAt(0).toUpperCase() + user.branch.slice(1)
      : "—";
  }

  /* NAVIGATION ACTIONS*/
  const navMap = [
    {
      id: "openProcurement",
      url: "/pages/procurement.html",
    },
    {
      id: "viewStock",
      url: "/pages/stock.html",
    },
    {
      id: "managerSales",
      url: "/pages/cash-sale.html",
    },
    {
      id: "viewSalesHistory",
      url: "/pages/sales-history.html",
    },
  ];

  navMap.forEach(({ id, url }) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("click", () => {
        window.location.href = url;
      });
    }
  });
});

/* SESSION EXPIRY HANDLING*/
window.addEventListener("storage", (e) => {
  if (e.key === "kglUser" && !e.newValue) {
    alert("Session expired. Please login again.");
    window.location.href = "/index.html";
  }
});
