/* salesHistory.js */

document.addEventListener("DOMContentLoaded", () => {
  /* SESSION VALIDATION */
  const session = JSON.parse(localStorage.getItem("kglSession") || "null");

  if (!session?.token || !["manager", "director"].includes(session.user.role)) {
    redirectToLogin();
    return;
  }

  const { token, user } = session;
  const API = "http://localhost:5000/api/sales";

  /* DOM REFERENCES */

  const tableBody = document.getElementById("salesTableBody");
  const emptyState = document.getElementById("emptyState");
  const recordCount = document.getElementById("recordCount");
  const paginationEl = document.getElementById("pagination");
  const directorKpis = document.getElementById("directorKpis");

  const branchFilter = document.getElementById("branchFilter");
  const typeFilter = document.getElementById("typeFilter");
  const pageSizeSelect = document.getElementById("pageSize");
  const exportBtn = document.getElementById("exportCsvBtn");

  const totalCashEl = document.getElementById("totalCash");
  const totalCreditEl = document.getElementById("totalCredit");
  const totalTonnageEl = document.getElementById("totalTonnage");
  const totalTransactionsEl = document.getElementById("totalTransactions");

  let currentPage = 1;
  let pageSize = Number(pageSizeSelect?.value || 10);

  /* HELPERS */
  function redirectToLogin() {
    localStorage.removeItem("kglSession");
    window.location.href = "/frontend/login.html";
  }

  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  function formatUSh(v = 0) {
    return "USh " + new Intl.NumberFormat("en-UG").format(Math.round(v || 0));
  }

  function capitalize(text = "") {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "-";
  }

  function formatSaleDate(isoString) {
    if (!isoString) return "-";
    const d = new Date(isoString);
    if (isNaN(d)) return "-";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const saleDay = new Date(d);
    saleDay.setHours(0, 0, 0, 0);

    if (saleDay.getTime() === today.getTime()) {
      return `Today at ${d.toLocaleTimeString("en-UG", { timeStyle: "short" })}`;
    }

    return d.toLocaleString("en-UG", {
      timeZone: "Africa/Kampala",
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function showLoading() {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4">
          <div class="spinner-border spinner-border-sm text-primary me-2"></div>
          Loading transactions...
        </td>
      </tr>
    `;
  }

  function showError(message = "Failed to load data.") {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 text-danger">
          ${message}
        </td>
      </tr>
    `;
  }

  /* FETCH SALES */
  async function fetchSales() {
    showLoading();

    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        type: typeFilter?.value || "",
      };

      if (user.role === "director" && branchFilter?.value) {
        params.branch = branchFilter.value;
      }

      const query = new URLSearchParams(params);

      const res = await fetch(`${API}?${query}`, {
        headers: authHeaders(),
        credentials: "include", // if using cookies in future
      });

      if (res.status === 401 || res.status === 403) return redirectToLogin();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      const records = data.data || data.records || data.sales || [];
      const totalPages = data.pagination?.totalPages || data.totalPages || 1;
      const totalRecords =
        data.pagination?.totalRecords || data.totalRecords || records.length;
      const summary = data.summary || {};

      renderTable(records);
      renderPagination(totalPages);
      updateKPIs(summary);

      recordCount.textContent = `${totalRecords.toLocaleString()} records`;
    } catch (err) {
      console.error("SALES FETCH ERROR:", err);
      showError("Failed to load sales data. Please check your connection.");
    }
  }

  /* RENDER TABLE */
  function renderTable(rows) {
    tableBody.innerHTML = "";

    if (!rows?.length) {
      emptyState.classList.remove("d-none");
      return;
    }

    emptyState.classList.add("d-none");

    const fragment = document.createDocumentFragment();

    rows.forEach((s) => {
      const tr = document.createElement("tr");

      const saleType = (s.type || "cash").toLowerCase();
      if (saleType === "credit") {
        tr.classList.add("table-warning-subtle");
      }

      const amount = s.amountPaid ?? s.amount ?? s.totalAmount ?? 0;
      const kg = s.kg ?? s.tonnage ?? s.tonnageSold ?? s.quantityKg ?? 0;

      tr.innerHTML = `
        <td>${formatSaleDate(s.createdAt || s.date)}</td>
        <td>${s.produce || s.produceName || s.item || "-"}</td>
        <td>${capitalize(s.branch || s.location)}</td>
        <td class="text-end">${Number(kg).toLocaleString()}</td>
        <td class="text-end fw-semibold">${formatUSh(amount)}</td>
        <td>${s.buyer || s.customer || "-"}</td>
        <td>${s.agent || s.createdBy || s.user || "-"}</td>
        <td>
          <span class="status-pill ${saleType === "cash" ? "status-active" : "status-low"}">
            ${capitalize(saleType)}
          </span>
        </td>
      `;

      fragment.appendChild(tr);
    });

    tableBody.appendChild(fragment);
  }

  /* PAGINATION */
  function renderPagination(totalPages) {
    paginationEl.innerHTML = "";
    if (totalPages <= 1) return;

    const createBtn = (label, page, active = false, disabled = false) => {
      const li = document.createElement("li");
      li.className = `page-item ${active ? "active" : ""} ${disabled ? "disabled" : ""}`;

      const btn = document.createElement("button");
      btn.className = "page-link";
      btn.textContent = label;
      if (!disabled) {
        btn.onclick = () => {
          currentPage = page;
          fetchSales();
        };
      }

      li.appendChild(btn);
      return li;
    };

    if (currentPage > 1) {
      paginationEl.appendChild(createBtn("Previous", currentPage - 1));
    }

    // Show fewer page numbers on small screens
    const maxVisible = window.innerWidth < 768 ? 5 : 7;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      paginationEl.appendChild(createBtn(i, i, i === currentPage));
    }

    if (currentPage < totalPages) {
      paginationEl.appendChild(createBtn("Next", currentPage + 1));
    }
  }

  /* UPDATE KPIs (Director Only) */

  function updateKPIs(summary) {
    if (!totalTransactionsEl) return;

    totalCashEl.textContent = formatUSh(summary.cashTotal || summary.cash || 0);
    totalCreditEl.textContent = formatUSh(
      summary.creditTotal || summary.credit || 0,
    );
    totalTonnageEl.textContent = `${(summary.totalKg || summary.kg || 0).toLocaleString()} KG`;
    totalTransactionsEl.textContent = (
      summary.transactions || 0
    ).toLocaleString();

    if (user.role === "director") {
      directorKpis?.classList.remove("d-none");
    }
  }

  /* EXPORT (with current filters) */

  exportBtn?.addEventListener("click", async () => {
    try {
      const params = new URLSearchParams({
        type: typeFilter?.value || "",
      });

      if (user.role === "director" && branchFilter?.value) {
        params.set("branch", branchFilter.value);
      }

      const res = await fetch(`${API}/export?${params}`, {
        headers: authHeaders(),
      });

      if (res.status === 401 || res.status === 403) return redirectToLogin();
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `karibu-sales-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("EXPORT ERROR:", err);
      alert("Failed to export sales data. Please try again.");
    }
  });

  /* FILTER EVENTS*/
  branchFilter?.addEventListener("change", () => {
    currentPage = 1;
    fetchSales();
  });
  typeFilter?.addEventListener("change", () => {
    currentPage = 1;
    fetchSales();
  });
  pageSizeSelect?.addEventListener("change", () => {
    pageSize = Number(pageSizeSelect.value);
    currentPage = 1;
    fetchSales();
  });

  /* INIT */
  fetchSales();
});

/* MULTI TAB SESSION SYNC */
window.addEventListener("storage", (e) => {
  if (e.key === "kglSession" && !e.newValue) {
    window.location.href = "/frontend/login.html";
  }
});
