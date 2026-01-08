document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("kglUser") || "{}");

  if (!user || !user.role) {
    window.location.href = "./index.html";
    return;
  }

  const role = user.role;

  /* SAFE DOM HELPERS*/
  const $ = (id) => document.getElementById(id);
  const setText = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };

  /* ROLE VISIBILITY */
  document.querySelectorAll("[class*='role-']").forEach((el) => {
    el.style.display = "none";
  });

  document.querySelectorAll(`.role-${role}`).forEach((el) => {
    el.style.display = "";
  });

  /* HEADER INFO */
  setText("navUserName", user.username || "User");
  setText("dropdownUserName", user.username || "User");
  setText("dropdownUserRole", role.charAt(0).toUpperCase() + role.slice(1));
  setText("profileAvatar", (user.username || "U").charAt(0).toUpperCase());
  setText("userBranch", user.branch || "—");

  setText(
    "currentDate",
    new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  );

  /* DATA LOADING */
  const cashSales = JSON.parse(localStorage.getItem("kglSales") || "[]");
  const creditSales = JSON.parse(
    localStorage.getItem("kglCreditSales") || "[]",
  );
  const stock = JSON.parse(localStorage.getItem("kglStock") || "[]");

  const todayStr = new Date().toISOString().split("T")[0];

  const parseDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d) ? null : d.toISOString().split("T")[0];
  };

  /* NORMALIZE SALES */
  const allSales = [];

  cashSales.forEach((s) => {
    allSales.push({
      date: s.date,
      amount: s.amountPaid || 0,
      tonnage: s.tonnageSold || 0,
      produce: s.produceName || "Unknown",
    });
  });

  creditSales.forEach((s) => {
    allSales.push({
      date: s.dispatchDate,
      amount: s.amountDue || 0,
      tonnage: s.tonnage || 0,
      produce: s.produceName || "Unknown",
    });
  });

  /* DIRECTOR KPIs */
  if (role === "director") {
    const totalCash = cashSales.reduce((s, x) => s + (x.amountPaid || 0), 0);
    const totalCredit = creditSales.reduce((s, x) => s + (x.amountDue || 0), 0);
    const totalStock = stock.reduce((s, i) => s + (i.tonnage || 0), 0);

    setText("dirCashTotal", formatCurrency(totalCash));
    setText("dirCreditTotal", formatCurrency(totalCredit));
    setText("dirStockTotal", `${totalStock.toLocaleString()} KG`);
  }

  /* MANAGER / SALES KPIs */
  if (role !== "director") {
    const todaySales = allSales.filter((s) => parseDate(s.date) === todayStr);

    const todayCash = todaySales.reduce((s, x) => s + x.amount, 0);

    setText("cashToday", formatCurrency(todayCash));
    setText("todayTx", todaySales.length);
  }

  if (role === "manager") {
    const outstandingCredit = creditSales.reduce(
      (s, x) => s + (x.amountDue || 0),
      0,
    );

    const availableStock = stock.reduce((s, i) => s + (i.tonnage || 0), 0);

    setText("creditTotal", formatCurrency(outstandingCredit));
    setText("stockTotal", `${availableStock.toLocaleString()} KG`);
  }

  /* TOP SELLING PRODUCE */
  const produceTotals = {};

  allSales.forEach((s) => {
    produceTotals[s.produce] = (produceTotals[s.produce] || 0) + s.tonnage;
  });

  const topSelling = Object.entries(produceTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const topContainer = $("topSellingContainer");

  if (topContainer) {
    topContainer.innerHTML =
      topSelling.length === 0
        ? `<div class="empty-state">No sales recorded yet.</div>`
        : `
          <div class="list-group list-group-flush">
            ${topSelling
              .map(
                ([name, kg], i) => `
              <div class="list-group-item d-flex justify-content-between">
                <strong>#${i + 1} ${name}</strong>
                <span class="text-success">${kg.toLocaleString()} KG</span>
              </div>`,
              )
              .join("")}
          </div>`;
  }

  /*LOW STOCK ALERTS (FIXED ID) */
  const lowStockContainer = $("lowStockContainer");
  const threshold = 2000;

  if (lowStockContainer) {
    const lowItems = stock
      .filter((i) => (i.tonnage || 0) < threshold)
      .sort((a, b) => (a.tonnage || 0) - (b.tonnage || 0));

    lowStockContainer.innerHTML =
      lowItems.length === 0
        ? `<div class="empty-state">All stock levels are healthy.</div>`
        : `
          <div class="list-group list-group-flush">
            ${lowItems
              .map(
                (i) => `
              <div class="list-group-item">
                <strong>${i.produceName}</strong><br/>
                <small class="text-warning">
                  ${(i.tonnage || 0).toLocaleString()} KG remaining
                </small>
              </div>`,
              )
              .join("")}
          </div>`;
  }

  /* LOGOUT (SAFE)*/
  const logoutBtn = $("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("Logout from Karibu Groceries?")) {
        localStorage.removeItem("kglUser");
        window.location.href = "./index.html";
      }
    });
  }

  /* HELPERS*/
  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  }
});
