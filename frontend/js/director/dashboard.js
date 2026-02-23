// director/dashboard.js Director Analytics
// API-powered | Secure | Token-aware | Financial-grade

document.addEventListener("DOMContentLoaded", () => {
  /* SESSION VALIDATION */
  const session = JSON.parse(localStorage.getItem("kglSession") || "null");

  if (!session || !session.token || !session.user) {
    redirectToLogin();
    return;
  }

  if (session.user.role !== "director") {
    alert("Access denied. Directors only.");
    redirectToLogin();
    return;
  }

  const token = session.token;
  const API = "http://localhost:5000/api/reports/director-summary";

  let latestData = null; // store latest response for export

  /* HELPERS */
  function redirectToLogin() {
    localStorage.removeItem("kglSession");
    window.location.href = "/frontend/login.html";
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function capitalize(text = "") {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "-";
  }

  function formatCurrency(amount = 0) {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(Number(amount || 0));
  }

  function showLoading() {
    [
      "totalRevenue",
      "totalCost",
      "totalProfit",
      "grossMargin",
      "totalCredit",
      "totalTonnage",
      "totalTransactions",
    ].forEach((id) => setText(id, "..."));
  }

  /* FETCH DASHBOARD DATA */
  async function fetchDashboard(days) {
    try {
      const res = await fetch(`${API}?range=${days}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        alert("Session expired. Please login again.");
        redirectToLogin();
        return null;
      }

      if (res.status === 403) {
        alert("Access denied.");
        return null;
      }

      if (!res.ok) {
        throw new Error("Failed to load dashboard data");
      }

      return await res.json();
    } catch (err) {
      console.error("DASHBOARD ERROR:", err);
      alert("Unable to load dashboard data.");
      return null;
    }
  }

  /* RENDER DASHBOARD */
  async function renderDashboard(days) {
    showLoading();

    const data = await fetchDashboard(days);
    if (!data) return;

    latestData = data; // save for export

    /* FINANCIAL SNAPSHOT */

    setText("totalRevenue", formatCurrency(data.financials?.revenue));

    setText("totalCost", formatCurrency(data.financials?.procurementCost));

    setText("totalProfit", formatCurrency(data.financials?.profit));

    setText("grossMargin", `${data.financials?.margin || 0}%`);

    /* OPERATIONAL METRICS */

    setText("totalCredit", formatCurrency(data.totals?.credit));

    setText("totalTonnage", Number(data.totals?.tonnage || 0).toLocaleString());

    setText("totalTransactions", data.totals?.transactions || 0);

    /* BRANCH TABLE */

    const tbody = document.getElementById("branchSummaryTable");
    if (!tbody) return;

    tbody.innerHTML = "";

    const branches = data.branches || {};

    if (!Object.keys(branches).length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            No financial data for selected period
          </td>
        </tr>`;
      return;
    }

    Object.entries(branches).forEach(([branch, b]) => {
      const marginClass =
        b.margin > 30 ? "text-success" : b.margin > 10 ? "" : "text-danger";

      tbody.innerHTML += `
        <tr>
          <td>${capitalize(branch)}</td>
          <td class="text-end">${formatCurrency(b.revenue)}</td>
          <td class="text-end">${formatCurrency(b.cost)}</td>
          <td class="text-end">${formatCurrency(b.profit)}</td>
          <td class="text-end ${marginClass}">
            ${b.margin || 0}%
          </td>
        </tr>
      `;
    });
  }

  /* EXPORT TO CSV */
  document.getElementById("exportCSV")?.addEventListener("click", () => {
    if (!latestData) {
      alert("No data available to export.");
      return;
    }

    let csv = "Branch,Revenue,Cost,Profit,Margin%\n";

    Object.entries(latestData.branches || {}).forEach(([branch, b]) => {
      csv += `${branch},${b.revenue},${b.cost},${b.profit},${b.margin}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `kgl-director-report-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  });

  /* PRINTABLE PDF */
  document.getElementById("exportPDF")?.addEventListener("click", () => {
    window.print();
  });

  /* TIME FILTER */
  const timeFilter = document.getElementById("timeFilter");

  if (timeFilter) {
    timeFilter.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      const days = Number(btn.dataset.range);

      timeFilter
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");

      renderDashboard(days);
    });
  }

  /* INIT */
  renderDashboard(30);

  /* MULTI-TAB SYNC */
  window.addEventListener("storage", (e) => {
    if (e.key === "kglSession" && !e.newValue) {
      redirectToLogin();
    }
  });
});
