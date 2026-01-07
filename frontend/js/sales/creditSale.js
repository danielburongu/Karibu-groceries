// creditSale.js - Enhanced Credit Sale Recording

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
const PRICE_PER_KG = 3500; // Adjust this based on actual pricing logic (could be per produce later)

// Populate produce dropdown
function populateProduceOptions() {
  produceSelect.innerHTML = '<option value="" disabled selected>Select produce...</option>';

  if (stock.length === 0) {
    produceSelect.innerHTML += '<option disabled>No stock available</option>';
    return;
  }

  const availableItems = stock.filter(item => item.tonnage > 0);

  if (availableItems.length === 0) {
    produceSelect.innerHTML += '<option disabled>All stock depleted</option>';
    return;
  }

  availableItems.forEach((item, index) => {
    const originalIndex = stock.indexOf(item);
    const option = document.createElement("option");
    option.value = originalIndex;
    option.textContent = `${item.produceName} - ${item.produceType} (${item.tonnage} KG @ ${item.branch})`;
    produceSelect.appendChild(option);
  });
}

populateProduceOptions();

// ===============================
// PRODUCE SELECTION HANDLER
// ===============================
produceSelect.addEventListener("change", function () {
  const index = parseInt(this.value);

  // Reset fields
  removeError(this.parentElement);
  clearCalculatedFields();

  if (isNaN(index)) {
    selectedProduce = null;
    return;
  }

  selectedProduce = stock[index];

  branchInput.value = selectedProduce.branch;
  produceTypeInput.value = selectedProduce.produceType;
  availableStockInput.value = `${selectedProduce.tonnage} KG`;

  // Trigger tonnage recalculation if already entered
  if (tonnageInput.value) {
    calculateAmountDue();
    checkStockAvailability();
  }
});

// ===============================
// REAL-TIME CALCULATIONS & VALIDATION
// ===============================
tonnageInput.addEventListener("input", function () {
  removeError(this.parentElement);
  stockWarning.style.display = "none";

  if (!selectedProduce) {
    this.value = "";
    return;
  }

  const tonnage = parseFloat(this.value);

  if (isNaN(tonnage) || tonnage <= 0) {
    amountDueInput.value = "";
    return;
  }

  calculateAmountDue();
  checkStockAvailability();
});

function calculateAmountDue() {
  const tonnage = parseFloat(tonnageInput.value);
  if (tonnage > 0 && selectedProduce) {
    const total = tonnage * PRICE_PER_KG;
    amountDueInput.value = total.toLocaleString("en-UG") + " UGX";
  }
}

function checkStockAvailability() {
  const tonnage = parseFloat(tonnageInput.value);
  if (tonnage > selectedProduce.tonnage) {
    stockWarning.style.display = "flex";
    addError(tonnageInput.parentElement);
  } else {
    stockWarning.style.display = "none";
    removeError(tonnageInput.parentElement);
  }
}

// Helper functions for error states
function addError(formGroup) {
  formGroup.classList.add("has-error");
}

function removeError(formGroup) {
  formGroup.classList.remove("has-error");
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

  // Clear previous success
  successMessage.style.display = "none";

  // Basic required field check
  const requiredFields = [
    { field: document.getElementById("buyerName"), name: "Buyer Name" },
    { field: document.getElementById("nin"), name: "National ID (NIN)" },
    { field: document.getElementById("location"), name: "Location" },
    { field: document.getElementById("contact"), name: "Phone Contact" },
    { field: produceSelect, name: "Produce" },
    { field: tonnageInput, name: "Tonnage" },
    { field: dueDateInput, name: "Due Date" }
  ];

  let hasError = false;

  requiredFields.forEach(item => {
    if (!item.field.value.trim()) {
      addError(item.field.parentElement);
      hasError = true;
    } else {
      removeError(item.field.parentElement);
    }
  });

  if (!selectedProduce) {
    alert("Please select a produce from the list.");
    addError(produceSelect.parentElement);
    return;
  }

  const tonnage = parseFloat(tonnageInput.value);
  if (tonnage > selectedProduce.tonnage) {
    alert("Tonnage cannot exceed available stock!");
    addError(tonnageInput.parentElement);
    return;
  }

  const contact = document.getElementById("contact").value.trim();
  if (!/^07[0-9]{8}$/.test(contact)) {
    alert("Please enter a valid Ugandan mobile number (e.g., 077XXXXXXX)");
    addError(document.getElementById("contact").parentElement);
    return;
  }

  const nin = document.getElementById("nin").value.trim().toUpperCase();
  if (!/^[A-Z]{2}[A-Z0-9]{12,14}$/.test(nin)) {
    alert("Invalid National ID format.");
    addError(document.getElementById("nin").parentElement);
    return;
  }

  // ===============================
  // SAVE TRANSACTION
  // ===============================
  const creditSale = {
    id: Date.now(), // Simple unique ID
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
    dispatchDate: new Date().toLocaleDateString("en-GB"),
    dispatchTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    recordedAt: new Date().toISOString()
  };

  // Update stock
  selectedProduce.tonnage -= tonnage;
  localStorage.setItem("kglStock", JSON.stringify(stock));

  // Save sale
  let creditSales = JSON.parse(localStorage.getItem("kglCreditSales")) || [];
  creditSales.unshift(creditSale); // Add to beginning for recent first
  localStorage.setItem("kglCreditSales", JSON.stringify(creditSales));

  // ===============================
  // SUCCESS FEEDBACK
  // ===============================
  savedAmountEl.textContent = creditSale.amountDue.toLocaleString("en-UG") + " UGX";
  savedDueDateEl.textContent = new Date(creditSale.dueDate).toLocaleDateString("en-GB");
  successMessage.style.display = "flex";

  // Scroll to success message
  successMessage.scrollIntoView({ behavior: "smooth", block: "center" });

  // Reset form
  form.reset();
  clearCalculatedFields();
  produceSelect.selectedIndex = 0;
  selectedProduce = null;

  // Refresh produce list (in case stock depleted)
  setTimeout(populateProduceOptions, 300);
});