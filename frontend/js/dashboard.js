// dashboard.js - Enhanced with Top-Selling, Low Stock Alerts, and Export

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("kglUser") || "{}");

  if (!user || !user.role) {
    window.location.href = "./index.html";
    return;
  }

  // Header info
  document.getElementById("userName").textContent = user.displayName || user.username || "User";
  document.getElementById("userRole").textContent = 
    user.role === "sales" ? "Sales Agent" :
    user.role === "manager" ? "Manager" : "Director";
  document.getElementById("userBranch").textContent = user.branch ? 
    user.branch.charAt(0).toUpperCase() + user.branch.slice(1) : "—";

  document.getElementById("currentDate").textContent = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // Role visibility
  if (user.role === "sales") {
    document.getElementById("procurementLink")?.style.setProperty("display", "none");
    document.getElementById("stockLink")?.style.setProperty("display", "none");
    document.getElementById("adminLink")?.style.setProperty("display", "none");
  } else if (user.role === "manager") {
    document.getElementById("adminLink")?.style.setProperty("display", "none");
  }

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    if (confirm("Logout from Karibu Groceries?")) {
      localStorage.removeItem("kglUser");
      window.location.href = "./index.html";
    }
  });

  // Load data
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-GB');

  const cashSales = JSON.parse(localStorage.getItem("kglSales") || "[]");
  const creditSales = JSON.parse(localStorage.getItem("kglCreditSales") || "[]");
  const allSales = [...cashSales, ...creditSales];
  const stock = JSON.parse(localStorage.getItem("kglStock") || "[]");

  // Stats
  const todayCash = cashSales
    .filter(s => s.date === todayStr)
    .reduce((sum, s) => sum + s.amountPaid, 0);

  const totalCredit = creditSales.reduce((sum, s) => sum + s.amountDue, 0);

  const totalStockKG = stock.reduce((sum, item) => sum + item.tonnage, 0);

  const todayTransactions = allSales.filter(s => s.date === todayStr).length;

  document.getElementById("cashToday").textContent = formatCurrency(todayCash);
  document.getElementById("creditTotal").textContent = formatCurrency(totalCredit);
  document.getElementById("totalStock").textContent = totalStockKG.toLocaleString() + " KG";
  document.getElementById("todayTx").textContent = todayTransactions;

  // === Top Selling Produce ===
  const produceSales = {};
  allSales.forEach(sale => {
    const name = sale.produceName || sale.produceName;
    produceSales[name] = (produceSales[name] || 0) + (sale.tonnageSold || sale.tonnage || 0);
  });

  const topSelling = Object.entries(produceSales)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const topContainer = document.getElementById("topSellingContainer");
  if (topSelling.length === 0) {
    topContainer.innerHTML = `<div class="empty-message">No sales recorded yet.</div>`;
  } else {
    topContainer.innerHTML = topSelling.map(([name, kg]) => `
      <div class="top-item">
        <strong>${name}</strong>
        <span class="text-success fw-bold">${kg.toLocaleString()} KG sold</span>
      </div>
    `).join("");
  }

  // === Low Stock Alerts ===
  const lowStock = stock.filter(item => item.tonnage < 2000); // threshold
  const lowContainer = document.getElementById("lowStockContainer");

  if (lowStock.length === 0) {
    lowContainer.innerHTML = `<div class="empty-message">All items are well-stocked.</div>`;
  } else {
    lowContainer.innerHTML = lowStock.map(item => `
      <div class="low-stock-item">
        <div>
          <strong>${item.produceName} (${item.produceType || 'Standard'})</strong><br>
          <small class="text-muted">${item.branch} branch</small>
        </div>
        <div class="text-end">
          <span class="badge">${item.tonnage.toLocaleString()} KG left</span>
        </div>
      </div>
    `).join("");
  }

  // === Export Reports ===
  document.getElementById("exportBtn").addEventListener("click", () => {
    const data = {
      summary: { todayCash, totalCredit, totalStockKG, todayTransactions },
      topSelling,
      lowStock,
      allSales: allSales.length,
      timestamp: new Date().toISOString()
    };

    const csv = convertToCSV(data);
    downloadCSV(csv, `karibu-report-${today.toISOString().slice(0,10)}.csv`);
  });

  function convertToCSV(obj) {
    let csv = "Karibu Groceries Daily Report\n\n";
    csv += `Date,${todayStr}\n`;
    csv += `Cash Sales Today,${formatCurrency(todayCash)}\n`;
    csv += `Credit Outstanding,${formatCurrency(totalCredit)}\n`;
    csv += `Total Stock,${totalStockKG} KG\n`;
    csv += `Today's Transactions,${todayTransactions}\n\n`;

    csv += "Top Selling Produce\n";
    csv += "Produce,KG Sold\n";
    topSelling.forEach(([name, kg]) => csv += `${name},${kg}\n`);

    csv += "\nLow Stock Items\n";
    csv += "Produce,Type,Branch,Remaining KG\n";
    lowStock.forEach(item => csv += `${item.produceName},${item.produceType || '—'},${item.branch},${item.tonnage}\n`);

    return csv;
  }

  function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  }
});