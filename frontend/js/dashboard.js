document.addEventListener("DOMContentLoaded", () => {
  /* AUTH & SESSION GUARD */
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("kglUser"));
  } catch {
    user = null;
  }

  if (!user || !user.role) {
    window.location.href = "/index.html";
    return;
  }

  const role = user.role;

  /* SAFE DOM HELPERS */
  const $ = (id) => document.getElementById(id);
  const setText = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };

  /* ROLE-BASED VISIBILITY */
  document.querySelectorAll("[class*='role-']").forEach((el) => {
    el.style.display = "none";
  });

  document.querySelectorAll(`.role-${role}`).forEach((el) => {
    el.style.display = "";
  });

  /* HEADER / NAV USER INFO */
  const displayName =
    user.displayName ||
    (user.username
      ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
      : "User");

  setText("navUserName", displayName);
  setText("dropdownUserName", displayName);
  setText("dropdownUserRole", role.charAt(0).toUpperCase() + role.slice(1));
  setText("profileAvatar", displayName.charAt(0).toUpperCase());

  setText(
    "userBranch",
    user.branch ? user.branch.toUpperCase() : "All Branches",
  );

  setText(
    "currentDate",
    new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  );

  /* LOAD DATA (SAFE) */
  const cashSales = JSON.parse(localStorage.getItem("kglSales") || "[]");
  const creditSales = JSON.parse(
    localStorage.getItem("kglCreditSales") || "[]",
  );
  const stock = JSON.parse(localStorage.getItem("kglStock") || "[]");

  /* DATE HELPERS */
  const todayStr = new Date().toISOString().split("T")[0];

  const normalizeDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d) ? null : d.toISOString().split("T")[0];
  };

  /* NORMALIZE SALES */
  const allSales = [];

  cashSales.forEach((s) => {
    allSales.push({
      date: normalizeDate(s.date),
      amount: Number(s.amountPaid) || 0,
      tonnage: Number(s.tonnageSold) || 0,
      produce: s.produceName || "Unknown",
    });
  });

  creditSales.forEach((s) => {
    allSales.push({
      date: normalizeDate(s.dispatchDate),
      amount: Number(s.amountDue) || 0,
      tonnage: Number(s.tonnage) || 0,
      produce: s.produceName || "Unknown",
    });
  });

  /* DIRECTOR KPIs */
  if (role === "director") {
    const totalCash = cashSales.reduce(
      (sum, s) => sum + (Number(s.amountPaid) || 0),
      0,
    );
    const totalCredit = creditSales.reduce(
      (sum, s) => sum + (Number(s.amountDue) || 0),
      0,
    );
    const totalStock = stock.reduce(
      (sum, i) => sum + (Number(i.tonnage) || 0),
      0,
    );

    setText("dirCashTotal", formatCurrency(totalCash));
    setText("dirCreditTotal", formatCurrency(totalCredit));
    setText("dirStockTotal", `${totalStock.toLocaleString()} KG`);
  }

  /* MANAGER / SALES KPIs */
  if (role !== "director") {
    const todaySales = allSales.filter((s) => s.date === todayStr);

    const todayTotal = todaySales.reduce((sum, s) => sum + s.amount, 0);

    setText("cashToday", formatCurrency(todayTotal));
    setText("todayTx", todaySales.length);
  }

  if (role === "manager") {
    const outstandingCredit = creditSales.reduce(
      (sum, s) => sum + (Number(s.amountDue) || 0),
      0,
    );

    const availableStock = stock.reduce(
      (sum, i) => sum + (Number(i.tonnage) || 0),
      0,
    );

    setText("creditTotal", formatCurrency(outstandingCredit));
    setText("stockTotal", `${availableStock.toLocaleString()} KG`);
  }

  /* TOP SELLING PRODUCE */
  const produceTotals = {};

  allSales.forEach((s) => {
    if (!s.produce) return;
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

  /* LOW STOCK ALERTS */
  const lowStockContainer = $("lowStockContainer");
  const threshold = 2000;

  if (lowStockContainer) {
    const lowItems = stock
      .filter((i) => (Number(i.tonnage) || 0) < threshold)
      .sort((a, b) => (Number(a.tonnage) || 0) - (Number(b.tonnage) || 0));

    lowStockContainer.innerHTML =
      lowItems.length === 0
        ? `<div class="empty-state">All stock levels are healthy.</div>`
        : `
          <div class="list-group list-group-flush">
            ${lowItems
              .map(
                (i) => `
              <div class="list-group-item">
                <strong>${i.produceName || "Unknown"}</strong><br/>
                <small class="text-warning">
                  ${(Number(i.tonnage) || 0).toLocaleString()} KG remaining
                </small>
              </div>`,
              )
              .join("")}
          </div>`;
  }

  /* HELPERS */
  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  }
});
