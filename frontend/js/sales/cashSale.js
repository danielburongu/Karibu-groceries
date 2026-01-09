// cashSale.js — Cash Sales Logic (Sales role only)

/* AUTH & ROLE PROTECTION */
let user = null;
try {
  user = JSON.parse(localStorage.getItem("kglUser"));
} catch {
  user = null;
}

if (!user || user.role !== "sales") {
  alert("Access denied. Sales agents only.");
  window.location.href = "../index.html";
  throw new Error("Unauthorized access");
}

/* DOM REFERENCES (SAFE) */
const form = document.getElementById("cashSaleForm");
const produceSelect = document.getElementById("produceSelect");
const availableStockInput = document.getElementById("availableStock");
const priceInput = document.getElementById("price");
const branchInput = document.getElementById("branch");
const amountPaidInput = document.getElementById("amountPaid");
const tonnageInput = document.getElementById("tonnageSold");
const buyerNameInput = document.getElementById("buyerName");
const salesAgentInput = document.getElementById("salesAgent");

/* Receipt elements */
const receiptModalEl = document.getElementById("receiptModal");
const printBtn = document.getElementById("printReceiptBtn");

/* INITIALIZE USER DATA */
salesAgentInput.value = user.displayName || user.username || "Sales Agent";

/* LOAD & FILTER STOCK (BRANCH)*/
let allStock = JSON.parse(localStorage.getItem("kglStock") || "[]");

let branchStock = allStock.filter(
  (item) => item.branch === user.branch && Number(item.tonnage) > 0,
);

/* POPULATE PRODUCE DROPDOWN */
produceSelect.innerHTML = `<option value="" disabled selected>Select produce</option>`;

if (branchStock.length === 0) {
  const opt = document.createElement("option");
  opt.textContent = "No stock available";
  opt.disabled = true;
  produceSelect.appendChild(opt);
}

branchStock.forEach((item) => {
  const opt = document.createElement("option");
  opt.value = item.produceName;
  opt.textContent = `${item.produceName} (${item.tonnage} KG)`;
  produceSelect.appendChild(opt);
});

let selectedStock = null;

/* HANDLE PRODUCE SELECTION */
produceSelect.addEventListener("change", () => {
  selectedStock = branchStock.find(
    (s) => s.produceName === produceSelect.value,
  );

  if (!selectedStock) return;

  branchInput.value = selectedStock.branch.toUpperCase();
  availableStockInput.value = `${selectedStock.tonnage} KG`;
  priceInput.value = selectedStock.sellingPrice.toLocaleString();
  tonnageInput.value = "";
  amountPaidInput.value = "";
});

/* AUTO CALCULATE TOTAL */
tonnageInput.addEventListener("input", () => {
  if (!selectedStock) return;

  const qty = Number(tonnageInput.value);
  if (qty > 0) {
    amountPaidInput.value = (qty * selectedStock.sellingPrice).toLocaleString();
  } else {
    amountPaidInput.value = "";
  }
});

/* RECEIPT PREVIEW */
function showReceipt(sale) {
  if (!receiptModalEl) {
    alert("Receipt modal not found.");
    return;
  }

  document.getElementById("r-id").textContent = sale.id
    .slice(0, 8)
    .toUpperCase();
  document.getElementById("r-date").textContent = new Date(
    sale.date,
  ).toLocaleString("en-GB");
  document.getElementById("r-branch").textContent = sale.branch.toUpperCase();
  document.getElementById("r-produce").textContent = sale.produceName;
  document.getElementById("r-qty").textContent =
    sale.tonnageSold.toLocaleString();
  document.getElementById("r-price").textContent =
    sale.pricePerKg.toLocaleString();
  document.getElementById("r-total").textContent =
    sale.amountPaid.toLocaleString();
  document.getElementById("r-buyer").textContent = sale.buyerName;
  document.getElementById("r-agent").textContent = sale.salesAgent;

  const modal = new bootstrap.Modal(receiptModalEl);
  modal.show();
}

/* PRINT / EXPORT RECEIPT*/
printBtn?.addEventListener("click", () => {
  const content = document.getElementById("receiptContent")?.innerHTML;

  if (!content) {
    alert("Receipt content missing.");
    return;
  }

  const win = window.open("", "", "width=900,height=700");
  win.document.write(`
    <html>
      <head>
        <title>Cash Receipt</title>
        <link rel="stylesheet" href="../css/main.css" />
        <style>
          body { padding: 32px; }
        </style>
      </head>
      <body>${content}</body>
    </html>
  `);

  win.document.close();
  win.focus();
  win.print();
});

/* SUBMIT CASH SALE */
form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!selectedStock) {
    alert("Please select a produce.");
    return;
  }

  const qty = Number(tonnageInput.value);
  if (!qty || qty <= 0) {
    alert("Enter a valid quantity.");
    return;
  }

  if (qty > selectedStock.tonnage) {
    alert("Quantity exceeds available stock.");
    return;
  }

  const buyer = buyerNameInput.value.trim();
  if (buyer.length < 2) {
    alert("Enter a valid buyer name.");
    return;
  }

  /* UPDATE STOCK (IMMUTABLE SAFE) */
  allStock = allStock.map((item) => {
    if (
      item.branch === selectedStock.branch &&
      item.produceName === selectedStock.produceName
    ) {
      return {
        ...item,
        tonnage: item.tonnage - qty,
      };
    }
    return item;
  });

  localStorage.setItem("kglStock", JSON.stringify(allStock));

  /* SAVE SALE RECORD */
  const sales = JSON.parse(localStorage.getItem("kglSales")) || [];

  const saleRecord = {
    id: crypto.randomUUID(),
    produceName: selectedStock.produceName,
    branch: selectedStock.branch,
    tonnageSold: qty,
    pricePerKg: selectedStock.sellingPrice,
    amountPaid: qty * selectedStock.sellingPrice,
    buyerName: buyer,
    salesAgent: user.username,
    date: new Date().toISOString(),
    type: "cash",
  };

  sales.push(saleRecord);
  localStorage.setItem("kglSales", JSON.stringify(sales));

  /* STOCK ALERT + RECEIPT */
  if (selectedStock.tonnage - qty <= 0) {
    alert(`Stock Alert: ${selectedStock.produceName} is now OUT OF STOCK`);
  }

  showReceipt(saleRecord);
});
