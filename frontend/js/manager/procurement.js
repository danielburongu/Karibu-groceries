// procurement.js — Produce Procurement (Manager Only)

const user = JSON.parse(localStorage.getItem("kglUser") || "{}");

/* ROLE PROTECTION */
if (!user || user.role !== "manager") {
  alert("Access denied. Managers only.");
  window.location.href = "../index.html";
}

/* DOM REFERENCES */
const form = document.getElementById("procurementForm");

const produceNameInput = document.getElementById("produceName");
const produceTypeInput = document.getElementById("produceType");
const sourceTypeInput = document.getElementById("sourceType");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const tonnageInput = document.getElementById("tonnage");
const costInput = document.getElementById("cost");
const dealerNameInput = document.getElementById("dealerName");
const dealerContactInput = document.getElementById("dealerContact");
const branchInput = document.getElementById("branch");
const sellingPriceInput = document.getElementById("sellingPrice");

/* FORM SUBMISSION */
form.addEventListener("submit", function (e) {
  e.preventDefault();

  /* COLLECT VALUES */
  const produceName = produceNameInput.value.trim();
  const produceType = produceTypeInput.value.trim();
  const sourceType = sourceTypeInput.value;
  const dateVal = dateInput.value;
  const timeVal = timeInput.value;

  const tonnageVal = Number(tonnageInput.value);
  const costVal = Number(costInput.value);
  const sellingPriceVal = Number(sellingPriceInput.value);

  const dealerName = dealerNameInput.value.trim();
  const dealerContact = dealerContactInput.value.trim();
  const branchVal = branchInput.value;

  /* VALIDATIONS */
  // Produce name: alphanumeric, not empty
  if (!/^[a-zA-Z0-9 ]+$/.test(produceName)) {
    alert("Produce name must be alphanumeric and not empty.");
    return;
  }

  // Produce type: alphabets only, min 2 chars
  if (!/^[a-zA-Z ]{2,}$/.test(produceType)) {
    alert("Produce type must contain letters only (min 2 characters).");
    return;
  }

  // Date & time
  if (!dateVal || !timeVal) {
    alert("Delivery date and time are required.");
    return;
  }

  // Tonnage: numeric, minimum 1000 KG
  if (isNaN(tonnageVal) || tonnageVal < 1000) {
    alert("Minimum procurement quantity is 1000 KG (1 tonne).");
    return;
  }

  // Cost: numeric, min 5 digits
  if (isNaN(costVal) || costVal < 10000) {
    alert("Total cost must be at least UGX 10,000.");
    return;
  }

  // Dealer name: alphanumeric, min 2 chars
  if (!/^[a-zA-Z0-9 ]{2,}$/.test(dealerName)) {
    alert("Supplier name must be at least 2 characters.");
    return;
  }

  // Dealer contact: valid UG phone
  if (!/^07\d{8}$/.test(dealerContact)) {
    alert("Enter a valid Ugandan phone number (07XXXXXXXX).");
    return;
  }

  // Selling price
  if (isNaN(sellingPriceVal) || sellingPriceVal <= 0) {
    alert("Selling price per KG must be a valid number.");
    return;
  }

  // Branch
  if (!branchVal) {
    alert("Please select a receiving branch.");
    return;
  }

  /* LOAD & UPDATE STOCK */
  let stock = JSON.parse(localStorage.getItem("kglStock")) || [];

  const existingItem = stock.find(
    (item) =>
      item.produceName.toLowerCase() === produceName.toLowerCase() &&
      item.produceType.toLowerCase() === produceType.toLowerCase() &&
      item.branch === branchVal,
  );

  if (existingItem) {
    // Merge into existing stock
    existingItem.tonnage += tonnageVal;
    existingItem.cost += costVal;

    // Update price if manager changed it
    existingItem.sellingPrice = sellingPriceVal;

    // Keep audit info
    existingItem.lastUpdatedAt = new Date().toISOString();
    existingItem.lastUpdatedBy = user.username;
  } else {
    // Create new stock record
    stock.push({
      produceName,
      produceType,
      sourceType,
      date: dateVal,
      time: timeVal,
      tonnage: tonnageVal,
      cost: costVal,
      dealerName,
      dealerContact,
      branch: branchVal,
      sellingPrice: sellingPriceVal,
      recordedBy: user.username,
      recordedAt: new Date().toISOString(),
    });
  }

  /* SAVE & CONFIRM */
  localStorage.setItem("kglStock", JSON.stringify(stock));

  alert("Produce procurement recorded successfully.");

  form.reset();
});
