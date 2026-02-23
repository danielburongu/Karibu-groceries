/**
 * dashboard.js
 */

document.addEventListener("DOMContentLoaded", () => {
  /* SESSION VALIDATION */
  const session = JSON.parse(localStorage.getItem("kglSession") || "null");

  if (!session?.token || !session.user) {
    redirectToLogin();
    return;
  }

  const { token, user } = session;
  const role = user.role?.toLowerCase();

  if (!["director", "manager", "sales"].includes(role)) {
    redirectToLogin();
    return;
  }

  const API_BASE = "http://localhost:5000/api";

  const $ = (id) => document.getElementById(id);
  const formatUSh = (v) =>
    `USh ${new Intl.NumberFormat("en-UG").format(Math.round(v || 0))}`;

  const redirectToLogin = () => {
    localStorage.removeItem("kglSession");
    window.location.href = "/frontend/login.html";
  };

  const authHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  /* USER CONTEXT */
  $("userBranch").textContent =
    role === "director" ? "All Branches" : (user.branch || "-").toUpperCase();

  $("currentDate").textContent = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /* ROLE VISIBILITY */
  document.querySelectorAll("[data-role]").forEach((el) => {
    const allowed = el.dataset.role.split(" ").map((r) => r.toLowerCase());
    el.hidden = !allowed.includes(role);
  });

  /* KPI COUNT-UP ANIMATION */
  function animateValue(el, end, formatter = (v) => v) {
    if (!el) return;

    const duration = 600;
    const start = 0;
    const startTime = performance.now();

    function frame(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = start + progress * (end - start);
      el.textContent = formatter(value);

      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  /* PARALLEL DATA FETCH */
  async function fetchAll() {
    try {
      const [salesRes, creditRes, stockRes] = await Promise.all([
        fetch(`${API_BASE}/sales`, { headers: authHeaders() }),
        fetch(`${API_BASE}/credits`, { headers: authHeaders() }),
        fetch(`${API_BASE}/stock`, { headers: authHeaders() }),
      ]);

      if (!salesRes.ok || !creditRes.ok || !stockRes.ok)
        throw new Error("Failed to load data");

      const salesData = await salesRes.json();
      const creditData = await creditRes.json();
      const stockData = await stockRes.json();

      return {
        sales: salesData.sales || salesData || [],
        credits: creditData.credits || creditData || [],
        stock: stockData.stock || stockData || [],
      };
    } catch (err) {
      console.error(err);
      showGlobalError("Failed to load dashboard data.");
      return { sales: [], credits: [], stock: [] };
    }
  }

  function showGlobalError(msg) {
    const el = $("dashboardError");
    if (!el) return;
    el.classList.remove("d-none");
    el.innerHTML = `
      <div class="alert alert-danger text-center">
        ${msg}
      </div>
    `;
  }

  /* DASHBOARD RENDER */
  async function render() {
    const { sales, credits, stock } = await fetchAll();

    const today = new Date().toISOString().split("T")[0];

    /* DIRECTOR */
    if (role === "director") {
      const totalCash = sales
        .filter((s) => s.type === "cash")
        .reduce((sum, s) => sum + Number(s.amountPaid || 0), 0);

      const totalCredit = credits.reduce(
        (sum, c) =>
          sum + (Number(c.amountDue || 0) - Number(c.amountPaid || 0)),
        0,
      );

      const totalStockKg = stock.reduce(
        (sum, i) => sum + Number(i.tonnage || 0),
        0,
      );

      animateValue($("dirCashTotal"), totalCash, formatUSh);
      animateValue($("dirCreditTotal"), totalCredit, formatUSh);
      animateValue(
        $("dirStockTotal"),
        totalStockKg,
        (v) => `${Math.round(v).toLocaleString()} KG`,
      );
    }

    /* MANAGER / SALES */
    if (role !== "director") {
      const branch = user.branch?.toLowerCase();

      const todaySales = sales.filter((s) => {
        const saleDate = new Date(s.createdAt || 0).toISOString().split("T")[0];
        return saleDate === today;
      });

      const todayCash = todaySales
        .filter((s) => s.type === "cash")
        .reduce((sum, s) => sum + Number(s.amountPaid || 0), 0);

      animateValue($("cashToday"), todayCash, formatUSh);
      animateValue($("todayTx"), todaySales.length, (v) => Math.round(v));

      if (role === "manager") {
        const branchCredits = credits.filter(
          (c) => c.branch?.toLowerCase() === branch,
        );

        const totalCredit = branchCredits.reduce(
          (sum, c) =>
            sum + (Number(c.amountDue || 0) - Number(c.amountPaid || 0)),
          0,
        );

        const branchStock = stock.filter(
          (i) => i.branch?.toLowerCase() === branch,
        );

        const totalStockKg = branchStock.reduce(
          (sum, i) => sum + Number(i.tonnage || 0),
          0,
        );

        animateValue($("creditTotal"), totalCredit, formatUSh);
        animateValue(
          $("stockTotal"),
          totalStockKg,
          (v) => `${Math.round(v).toLocaleString()} KG`,
        );
      }
    }

    renderTopSelling(sales);
    renderLowStock(stock);
  }

  /* TOP SELLING */
  function renderTopSelling(sales) {
    const container = $("topSellingContainer");
    const empty = $("topSellingEmpty");
    if (!container) return;

    const totals = {};

    sales.forEach((s) => {
      const name = s.produce || s.produceName || "Unknown";
      totals[name] = (totals[name] || 0) + Number(s.tonnageSold || 0);
    });

    const sorted = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    if (!sorted.length) {
      empty?.classList.remove("d-none");
      container.innerHTML = "";
      return;
    }

    empty?.classList.add("d-none");

    container.innerHTML = sorted
      .map(
        ([name, kg]) => `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="card product-card shadow-sm h-100">
          <img src="${getProductImage(name)}"
               class="card-img-top product-img"
               alt="${name}" loading="lazy"
               onerror="this.src='https://via.placeholder.com/300x200?text=Product';">
          <div class="card-body text-center p-3">
            <h6 class="card-title mb-2">${name}</h6>
            <p class="text-success fw-bold mb-1">
              ${Math.round(kg).toLocaleString()} KG sold
            </p>
          </div>
        </div>
      </div>
    `,
      )
      .join("");
  }

  /* LOW STOCK */
  function renderLowStock(stock) {
    const container = $("lowStockContainer");
    const empty = $("lowStockEmpty");
    if (!container) return;

    const LOW = 2000;
    const CRITICAL = 1000;

    const filtered = stock
      .filter((i) => Number(i.tonnage || 0) <= LOW)
      .sort((a, b) => Number(a.tonnage || 0) - Number(b.tonnage || 0));

    if (!filtered.length) {
      empty?.classList.remove("d-none");
      container.innerHTML = "";
      return;
    }

    empty?.classList.add("d-none");

    container.innerHTML = filtered
      .map((i) => {
        const kg = Number(i.tonnage || 0);
        const critical = kg < CRITICAL;

        return `
        <div class="col-6 col-md-4 col-lg-3">
          <div class="card product-card border-${critical ? "danger" : "warning"} h-100">
            <span class="badge bg-${critical ? "danger" : "warning"} low-stock-badge">
              ${critical ? "Critical" : "Low"}
            </span>
            <img src="${getProductImage(i.produceName)}"
                 class="card-img-top product-img"
                 alt="${i.produceName}"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x200?text=Product';">
            <div class="card-body text-center p-3">
              <h6 class="card-title mb-2">${i.produceName}</h6>
              <p class="fw-bold ${critical ? "text-danger" : "text-warning"}">
                ${kg.toLocaleString()} KG left
              </p>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  /* IMAGE MAP */
  function getProductImage(name = "") {
    const map = {
      matooke:
        "https://i.pinimg.com/1200x/77/26/4c/77264cf9e846ca16bd4e4934d9d71c0a.jpg",
      rice: "https://i.pinimg.com/1200x/69/96/00/699600b313bd13cd3b4988ffc88cb854.jpg",
      potatoes:
        "https://images.pexels.com/photos/10899606/pexels-photo-10899606.jpeg",
      tomatoes:
        "https://i2.pickpik.com/photos/439/186/370/market-vegetables-food-tomatoes-preview.jpg",
      mangoes:
        "https://images.pexels.com/photos/9844130/pexels-photo-9844130.jpeg",
      default:
        "https://i.pinimg.com/1200x/ac/1a/e7/ac1ae7b0e1fa061af2b21cb63b160725.jpg",
    };

    return map[name.toLowerCase().trim()] || map.default;
  }

  /* =====================================================
     MULTI TAB SYNC
  ===================================================== */
  window.addEventListener("storage", (e) => {
    if (e.key === "kglSession" && !e.newValue) {
      redirectToLogin();
    }
  });

  /* =====================================================
     INITIAL LOAD
  ===================================================== */
  render();
});
