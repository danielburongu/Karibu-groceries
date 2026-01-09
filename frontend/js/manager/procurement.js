// procurement.js — Produce Procurement (Manager Only)

/* AUTH & ROLE PROTECTION */
let user = null;
try {
  user = JSON.parse(localStorage.getItem("kglUser"));
} catch {
  user = null;
}

if (!user || user.role !== "manager") {
  alert("Access denied. Managers only.");
  window.location.href = "/index.html";
  throw new Error("Unauthorized access");
}

/* DOM REFERENCES (SAFE) */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("procurementForm");
  if (!form) return;

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
  form.addEventListener("submit", (e) => {
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
    if (!/^[a-zA-Z0-9 ]{2,}$/.test(produceName)) {
      alert("Produce name must be alphanumeric (min 2 characters).");
      return;
    }

    if (!/^[a-zA-Z ]{2,}$/.test(produceType)) {
      alert("Produce type must contain letters only (min 2 characters).");
      return;
    }

    if (!sourceType) {
      alert("Please select a source type.");
      return;
    }

    if (!dateVal || !timeVal) {
      alert("Delivery date and time are required.");
      return;
    }

    if (!Number.isFinite(tonnageVal) || tonnageVal < 1000) {
      alert("Minimum procurement quantity is 1000 KG (1 tonne).");
      return;
    }

    if (!Number.isFinite(costVal) || costVal < 10000) {
      alert("Total cost must be at least UGX 10,000.");
      return;
    }

    if (!/^[a-zA-Z0-9 ]{2,}$/.test(dealerName)) {
      alert("Supplier name must be at least 2 characters.");
      return;
    }

    if (!/^07\d{8}$/.test(dealerContact)) {
      alert("Enter a valid Ugandan phone number (07XXXXXXXX).");
      return;
    }

    if (!Number.isFinite(sellingPriceVal) || sellingPriceVal <= 0) {
      alert("Selling price per KG must be a valid number.");
      return;
    }

    if (!branchVal) {
      alert("Please select a receiving branch.");
      return;
    }

    /* LOAD & UPDATE STOCK (IMMUTABLE)*/
    let stock = JSON.parse(localStorage.getItem("kglStock") || "[]");

    const now = new Date().toISOString();
    let updated = false;

    stock = stock.map((item) => {
      if (
        item.produceName.toLowerCase() === produceName.toLowerCase() &&
        item.produceType.toLowerCase() === produceType.toLowerCase() &&
        item.branch === branchVal
      ) {
        updated = true;
        return {
          ...item,
          tonnage: item.tonnage + tonnageVal,
          cost: item.cost + costVal,
          sellingPrice: sellingPriceVal,
          lastUpdatedAt: now,
          lastUpdatedBy: user.username,
        };
      }
      return item;
    });

    if (!updated) {
      stock.push({
        id: crypto.randomUUID(),
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
        recordedAt: now,
      });
    }

    /* SAVE & CONFIRM */
    localStorage.setItem("kglStock", JSON.stringify(stock));

    alert("Produce procurement recorded successfully.");
    form.reset();
  });
});

/* SESSION EXPIRY HANDLING */
window.addEventListener("storage", (e) => {
  if (e.key === "kglUser" && !e.newValue) {
    alert("Session expired. Please login again.");
    window.location.href = "/index.html";
  }
});
