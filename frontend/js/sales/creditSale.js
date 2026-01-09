// creditSale.js — Credit / Deferred Sales
// Sales role only | Demo-friendly validation

/* CONFIG */
const DEMO_MODE = true; //  set to false in production

const NIN_REGEX = DEMO_MODE
  ? /^[A-Z]{2}[A-Z0-9 ]{8,14}$/i // relaxed (demo)
  : /^[A-Z]{2}[A-Z0-9]{12,14}$/; // strict (production)

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

/* DOM REFERENCES */
const form = document.getElementById("creditSaleForm");

const produceSelect = document.getElementById("produceSelect");
const availableStockInput = document.getElementById("availableStock");
const produceTypeInput = document.getElementById("produceType");
const branchInput = document.getElementById("branch");

const tonnageInput = document.getElementById("tonnage");
const amountDueInput = document.getElementById("amountDue");

const buyerNameInput = document.getElementById("buyerName");
const contactInput = document.getElementById("contact");
const ninInput = document.getElementById("nin");
const locationInput = document.getElementById("location");
const dueDateInput = document.getElementById("dueDate");
const salesAgentInput = document.getElementById("salesAgent");

/* INITIALIZE USER DATA*/
salesAgentInput.value = user.displayName || user.username || "Sales Agent";

/* Auto-uppercase NIN */
ninInput.addEventListener("input", () => {
  ninInput.value = ninInput.value.toUpperCase();
});

/*LOAD & FILTER STOCK (BRANCH SAFE) */
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
  opt.textContent = `${item.produceName} (${item.tonnage.toLocaleString()} KG)`;
  produceSelect.appendChild(opt);
});

let selectedStock = null;

/* HANDLE PRODUCE SELECTION */
produceSelect.addEventListener("change", () => {
  selectedStock = branchStock.find(
    (s) => s.produceName === produceSelect.value,
  );

  if (!selectedStock) return;

  availableStockInput.value = `${selectedStock.tonnage.toLocaleString()} KG`;
  produceTypeInput.value = selectedStock.produceType;
  branchInput.value = selectedStock.branch.toUpperCase();

  tonnageInput.value = "";
  amountDueInput.value = "";
});

/*
   AUTO CALCULATE AMOUNT DUE */
tonnageInput.addEventListener("input", () => {
  if (!selectedStock) return;

  const qty = Number(tonnageInput.value);
  if (qty > 0) {
    amountDueInput.value = formatCurrency(qty * selectedStock.sellingPrice);
  } else {
    amountDueInput.value = "";
  }
});

/*SUBMIT CREDIT SALE */
form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!selectedStock) {
    alert("Please select a produce.");
    return;
  }

  const qty = Number(tonnageInput.value);
  if (!qty || qty <= 0 || qty > selectedStock.tonnage) {
    alert("Invalid quantity. Check available stock.");
    return;
  }

  const buyer = buyerNameInput.value.trim();
  if (!/^[a-zA-Z0-9 ]{2,}$/.test(buyer)) {
    alert("Buyer name must be at least 2 characters.");
    return;
  }

  if (!/^07\d{8}$/.test(contactInput.value)) {
    alert("Enter a valid Ugandan phone number (07XXXXXXXX).");
    return;
  }

  if (!NIN_REGEX.test(ninInput.value.trim())) {
    alert(
      DEMO_MODE
        ? "Invalid NIN format (example: CM1234567890)"
        : "Invalid NIN format.",
    );
    return;
  }

  if (!dueDateInput.value) {
    alert("Please select a payment due date.");
    return;
  }

  /* UPDATE STOCK (IMMUTABLE) */
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

  /* SAVE CREDIT SALE*/
  const creditSales = JSON.parse(localStorage.getItem("kglCreditSales")) || [];

  creditSales.push({
    id: crypto.randomUUID(),
    type: "credit",
    produceName: selectedStock.produceName,
    produceType: selectedStock.produceType,
    branch: selectedStock.branch,
    tonnage: qty,
    pricePerKg: selectedStock.sellingPrice,
    amountDue: qty * selectedStock.sellingPrice,
    buyerName: buyer,
    nin: ninInput.value.trim().toUpperCase(),
    location: locationInput.value.trim(),
    contact: contactInput.value,
    salesAgent: user.username,
    dueDate: dueDateInput.value,
    createdAt: new Date().toISOString(),
  });

  localStorage.setItem("kglCreditSales", JSON.stringify(creditSales));

  /* ALERTS & RESET */
  if (selectedStock.tonnage - qty <= 0) {
    alert(`Stock Alert: ${selectedStock.produceName} is now OUT OF STOCK`);
  }

  alert("Credit sale recorded successfully.");
  window.location.reload();
});

/* HELPERS */
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}
