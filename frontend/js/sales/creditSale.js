// creditSale.js - Credit Sale Recording

const user = JSON.parse(localStorage.getItem("kglUser"));

// ===============================
// ROLE PROTECTION
// ===============================
if (!user || user.role !== "sales") {
  alert("Access denied. Sales agents only.");
  window.location.href = "../index.html";
}

// ===============================
// DOM ELEMENTS
// ===============================
const form = document.getElementById("creditSaleForm");
const successMessage = document.getElementById("successMessage");
const savedAmountEl = document.getElementById("savedAmount");
const savedDueDateEl = document.getElementById("savedDueDate");

const produceSelect = document.getElementById("produceSelect");
const branchInput = document.getElementById("branch");
const availableStockInput = document.getElementById("availableStock");
const produceTypeInput = document.getElementById("produceType");
const salesAgentInput = document.getElementById("salesAgent");

const tonnageInput = document.getElementById("tonnage");
const amountDueInput = document.getElementById("amountDue");
const dueDateInput = document.getElementById("dueDate");
const stockWarning = document.getElementById("stockWarning");

// ===============================
// INITIAL SETUP
// ===============================
salesAgentInput.value = user.username || "Unknown Agent";

let stock = JSON.parse(localStorage.getItem("kglStock")) || [];
let selectedProduce = null;
const PRICE_PER_KG = 3500;

// ===============================
// POPULATE PRODUCE DROPDOWN
// ===============================
function populateProduceOptions() {
  produceSelect.innerHTML =
    '<option value="" disabled selected>Select produce...</option>';

  const availableItems = stock.filter((item) => item.tonnage > 0);

  if (availableItems.length === 0) {
    produceSelect.innerHTML += "<option disabled>No stock available</option>";
    return;
  }

  availableItems.forEach((item) => {
    const option = document.createElement("option");
    option.value = stock.indexOf(item);
    option.textContent = `${item.produceName} - ${item.produceType} (${item.tonnage} KG @ ${item.branch})`;
    produceSelect.appendChild(option);
  });
}

populateProduceOptions();

// ===============================
// PRODUCE SELECTION
// ===============================
produceSelect.addEventListener("change", function () {
  clearCalculatedFields();

  const index = Number(this.value);
  if (Number.isNaN(index)) {
    selectedProduce = null;
    return;
  }

  selectedProduce = stock[index];

  branchInput.value = selectedProduce.branch;
  produceTypeInput.value = selectedProduce.produceType;
  availableStockInput.value = `${selectedProduce.tonnage} KG`;

  if (tonnageInput.value) {
    calculateAmountDue();
    checkStockAvailability();
  }
});

// ===============================
// REAL-TIME CALCULATIONS
// ===============================
tonnageInput.addEventListener("input", function () {
  stockWarning.style.display = "none";
  removeError(this.parentElement);

  if (!selectedProduce) {
    this.value = "";
    return;
  }

  const tonnage = Number(this.value);
  if (Number.isNaN(tonnage) || tonnage <= 0) {
    amountDueInput.value = "";
    return;
  }

  calculateAmountDue();
  checkStockAvailability();
});

function calculateAmountDue() {
  const tonnage = Number(tonnageInput.value);
  if (tonnage > 0 && selectedProduce) {
    amountDueInput.value =
      (tonnage * PRICE_PER_KG).toLocaleString("en-UG") + " UGX";
  }
}

function checkStockAvailability() {
  const tonnage = Number(tonnageInput.value);
  if (tonnage > selectedProduce.tonnage) {
    stockWarning.style.display = "flex";
    addError(tonnageInput.parentElement);
  } else {
    stockWarning.style.display = "none";
    removeError(tonnageInput.parentElement);
  }
}

// ===============================
// FORM UTILITIES
// ===============================
function addError(group) {
  group.classList.add("has-error");
}

function removeError(group) {
  group.classList.remove("has-error");
}

function clearCalculatedFields() {
  tonnageInput.value = "";
  amountDueInput.value = "";
  availableStockInput.value = "";
  produceTypeInput.value = "";
  branchInput.value = "";
  stockWarning.style.display = "none";
}

// ===============================
// FORM SUBMISSION
// ===============================
form.addEventListener("submit", function (e) {
  e.preventDefault();
  successMessage.style.display = "none";

  const requiredFields = [
    document.getElementById("buyerName"),
    document.getElementById("nin"),
    document.getElementById("location"),
    document.getElementById("contact"),
    produceSelect,
    tonnageInput,
    dueDateInput,
  ];

  let hasError = false;

  requiredFields.forEach((field) => {
    if (!field.value.trim()) {
      addError(field.parentElement);
      hasError = true;
    } else {
      removeError(field.parentElement);
    }
  });

  if (hasError) {
    alert("Please fill in all required fields.");
    return;
  }

  if (!selectedProduce) {
    alert("Please select a produce.");
    return;
  }

  const tonnage = Number(tonnageInput.value);
  if (tonnage > selectedProduce.tonnage) {
    alert("Tonnage cannot exceed available stock.");
    return;
  }

  const contact = document.getElementById("contact").value.trim();
  if (!/^07\d{8}$/.test(contact)) {
    alert("Enter a valid Ugandan phone number.");
    return;
  }

  const nin = document.getElementById("nin").value.trim().toUpperCase();
  if (!/^[A-Z]{2}[A-Z0-9]{12,14}$/.test(nin)) {
    alert("Invalid National ID format.");
    return;
  }

  // ===============================
  // SAVE TRANSACTION
  // ===============================
  const creditSale = {
    id: Date.now(),
    buyerName: document.getElementById("buyerName").value.trim(),
    nin,
    location: document.getElementById("location").value.trim(),
    contact,
    produceName: selectedProduce.produceName,
    produceType: selectedProduce.produceType,
    branch: selectedProduce.branch,
    tonnage,
    amountDue: tonnage * PRICE_PER_KG,
    dueDate: dueDateInput.value,
    salesAgent: user.username,
    recordedAt: new Date().toISOString(),
  };

  selectedProduce.tonnage -= tonnage;
  localStorage.setItem("kglStock", JSON.stringify(stock));

  const creditSales = JSON.parse(localStorage.getItem("kglCreditSales")) || [];
  creditSales.unshift(creditSale);
  localStorage.setItem("kglCreditSales", JSON.stringify(creditSales));

  // ===============================
  // SUCCESS FEEDBACK
  // ===============================
  savedAmountEl.textContent =
    creditSale.amountDue.toLocaleString("en-UG") + " UGX";
  savedDueDateEl.textContent = new Date(creditSale.dueDate).toLocaleDateString(
    "en-GB",
  );

  successMessage.style.display = "flex";
  successMessage.scrollIntoView({ behavior: "smooth" });

  form.reset();
  clearCalculatedFields();
  produceSelect.selectedIndex = 0;
  selectedProduce = null;

  setTimeout(populateProduceOptions, 300);
});
