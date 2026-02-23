/**
 * stock.js
 * JWT Protected | Branch Scoped
 */

document.addEventListener("DOMContentLoaded", () => {
  /* ===============================
     SESSION VALIDATION
  =============================== */
  const session = JSON.parse(localStorage.getItem("kglSession") || "null");

  if (!session?.token || !["manager", "director"].includes(session.user.role)) {
    redirectToLogin();
    return;
  }

  const token = session.token;
  const user = session.user;

  const API = "http://localhost:5000/api/stock";

  /* ===============================
     DOM REFERENCES
  =============================== */
  const tableBody = document.getElementById("stockTableBody");
  const emptyState = document.getElementById("emptyState");
  const totalTonnageEl = document.getElementById("totalTonnage");
  const totalItemsEl = document.getElementById("totalItems");
  const lowStockCountEl = document.getElementById("lowStockCount");
  const outStockCountEl = document.getElementById("outStockCount");
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const exportBtn = document.getElementById("exportStockBtn");

  if (user.role === "director" && exportBtn) {
    exportBtn.style.display = "none";
  }

  let allStock = [];

  /* ===============================
     HELPERS
  =============================== */
  function redirectToLogin() {
    localStorage.removeItem("kglSession");
    window.location.href = "/frontend/login.html";
  }

  function authHeaders() {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  function formatCurrency(amount = 0) {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(Number(amount || 0));
  }

  function capitalize(text = "") {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "-";
  }

  function getStatus(tonnage = 0) {
    const t = Number(tonnage || 0);
    if (t <= 0) return "out";
    if (t <= 500) return "low";
    return "available";
  }

  function getStatusBadge(status) {
    const map = {
      available: {
        label: "Available",
        bg: "rgba(21,128,61,0.1)",
        color: "var(--success)",
      },
      low: { label: "Low", bg: "rgba(217,119,6,0.1)", color: "var(--warning)" },
      out: { label: "Out", bg: "rgba(220,38,38,0.1)", color: "var(--danger)" },
    };
    return map[status] || map.out;
  }

  /* ===============================
     FETCH STOCK FROM BACKEND
  =============================== */
  async function fetchStock() {
    try {
      const res = await fetch(API, {
        headers: authHeaders(),
      });

      if (res.status === 401) {
        redirectToLogin();
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch stock");
      }

      allStock = await res.json();
      applyFilters();
    } catch (err) {
      console.error("STOCK FETCH ERROR:", err);
      alert("Unable to load stock data.");
    }
  }

  /* ===============================
     RENDER TABLE
  =============================== */
  function renderStock(data) {
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!data.length) {
      emptyState?.classList.remove("d-none");
      return;
    }

    emptyState?.classList.add("d-none");

    data.forEach((item) => {
      const tonnage = Number(item.tonnage || 0);
      const status = getStatus(tonnage);
      const badge = getStatusBadge(status);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.produceName || "-"}</td>
        <td>${item.produceType || "-"}</td>
        <td>${capitalize(item.branch)}</td>
        <td class="text-end">${tonnage.toLocaleString()}</td>
        <td class="text-end">${formatCurrency(item.sellingPrice)}</td>
        <td>
          <span class="status-badge" style="background:${badge.bg}; color:${badge.color};">
            ${badge.label}
          </span>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  /* ===============================
     KPIs
  =============================== */
  function updateKPIs(data) {
    let totalKG = 0;
    let low = 0;
    let out = 0;

    data.forEach((item) => {
      const tonnage = Number(item.tonnage || 0);
      totalKG += tonnage;

      const status = getStatus(tonnage);
      if (status === "low") low++;
      if (status === "out") out++;
    });

    totalTonnageEl &&
      (totalTonnageEl.textContent = `${totalKG.toLocaleString()} KG`);
    totalItemsEl && (totalItemsEl.textContent = data.length);
    lowStockCountEl && (lowStockCountEl.textContent = low);
    outStockCountEl && (outStockCountEl.textContent = out);
  }

  /* ===============================
     FILTERS
  =============================== */
  function applyFilters() {
    const term = (searchInput?.value || "").toLowerCase().trim();
    const status = statusFilter?.value || "all";

    const filtered = allStock.filter((item) => {
      const name = (item.produceName || "").toLowerCase();
      const type = (item.produceType || "").toLowerCase();
      const branch = (item.branch || "").toLowerCase();

      const matchesSearch =
        !term ||
        name.includes(term) ||
        type.includes(term) ||
        branch.includes(term);

      const matchesStatus =
        status === "all" || status === getStatus(item.tonnage);

      return matchesSearch && matchesStatus;
    });

    renderStock(filtered);
    updateKPIs(filtered);
  }

  /* ===============================
     EXPORT (Manager Only)
  =============================== */
  exportBtn?.addEventListener("click", async () => {
    if (user.role !== "manager") return;

    try {
      const res = await fetch(`${API}/export`, {
        headers: authHeaders(),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "stock-report.csv";
      link.click();
    } catch (err) {
      console.error("EXPORT ERROR:", err);
      alert("Export failed.");
    }
  });

  /* ===============================
     EVENTS
  =============================== */
  searchInput?.addEventListener("input", applyFilters);
  statusFilter?.addEventListener("change", applyFilters);

  /* ===============================
     INIT
  =============================== */
  fetchStock();
});

/* ===============================
   MULTI TAB SESSION SYNC
=============================== */
window.addEventListener("storage", (e) => {
  if (e.key === "kglSession" && !e.newValue) {
    window.location.href = "/frontend/login.html";
  }
});
