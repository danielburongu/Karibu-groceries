// managerDashboard.js Manager Dashboard

document.addEventListener("DOMContentLoaded", async () => {
  const session = JSON.parse(localStorage.getItem("kglSession") || "null");

  if (!session?.token) {
    redirectToLogin();
    return;
  }

  const token = session.token;
  const API = "http://localhost:5000/api/reports/manager-summary";

  function redirectToLogin() {
    localStorage.removeItem("kglSession");
    window.location.href = "/frontend/login.html";
  }

  function formatCurrency(amount = 0) {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  async function loadDashboard() {
    try {
      const res = await fetch(`${API}?range=30`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        redirectToLogin();
        return;
      }

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();

      setText("managerBranch", data.branch);

      setText("branchRevenue", formatCurrency(data.financials.revenue));

      setText("branchCost", formatCurrency(data.financials.procurementCost));

      setText("branchProfit", formatCurrency(data.financials.profit));

      setText("branchMargin", `${data.financials.margin}%`);

      setText("branchCredit", formatCurrency(data.totals.creditOutstanding));

      setText("branchTonnage", data.totals.tonnage);

      setText("branchTransactions", data.totals.transactions);
    } catch (err) {
      console.error("Manager Dashboard Error:", err);
    }
  }

  loadDashboard();
});
