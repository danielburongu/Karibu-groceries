// cashSale.js

const user = JSON.parse(localStorage.getItem("kglUser"));

// ===============================
// Role protection
// ===============================
if (!user || user.role !== "sales") {
  alert("Access denied. Sales agents only.");
  window.location.href = "../index.html";
}

// ===============================
// Initialize fixed fields
// ===============================
document.getElementById("salesAgent").value = user.username;

const produceSelect = document.getElementById("produceSelect");
const availableStockText = document.getElementById("availableStock");
const priceInput = document.getElementById("price");
const branchInput = document.getElementById("branch");

let stock = JSON.parse(localStorage.getItem("kglStock")) || [];
let selectedProduce = null;

// ===============================
// Populate produce dropdown
// (only produce with stock > 0)
// ===============================
if (stock.length === 0) {
  availableStockText.textContent = "No stock available.";
} else {
  stock.forEach((item, index) => {
    if (item.tonnage > 0) {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = `${item.produceName} (${item.branch})`;
      produceSelect.appendChild(option);
    }
  });
}

// ===============================
// Handle produce selection
// ===============================
produceSelect.addEventListener("change", function () {
  const index = this.value;

  if (index === "") {
    selectedProduce = null;
    availableStockText.textContent = "";
    priceInput.value = "";
    branchInput.value = "";
    return;
  }

  selectedProduce = stock[index];

  availableStockText.textContent =
    `Available stock: ${selectedProduce.tonnage} KG`;

  priceInput.value = selectedProduce.sellingPrice;
  branchInput.value = selectedProduce.branch;
});

// ===============================
// Handle sale submission
// ===============================
document
  .getElementById("cashSaleForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    if (!selectedProduce) {
      alert("Please select a produce.");
      return;
    }

    const tonnageSold = Number(
      document.getElementById("tonnageSold").value
    );
    const amountPaid = Number(
      document.getElementById("amountPaid").value
    );
    const buyerName = document.getElementById("buyerName").value.trim();

    // ===============================
    // Validations (document-aligned)
    // ===============================
    if (tonnageSold <= 0 || tonnageSold > selectedProduce.tonnage) {
      alert("Invalid tonnage. Cannot exceed available stock.");
      return;
    }

    if (amountPaid < 10000) {
      alert("Amount paid must be at least 5 digits (UGX).");
      return;
    }

    if (!/^[a-zA-Z0-9 ]{2,}$/.test(buyerName)) {
      alert("Buyer name must be at least 2 characters.");
      return;
    }

    // ===============================
    // Reduce stock
    // ===============================
    selectedProduce.tonnage -= tonnageSold;
    localStorage.setItem("kglStock", JSON.stringify(stock));

    // ===============================
    // Record sale (explicit date & time)
    // ===============================
    const saleRecord = {
      produceName: selectedProduce.produceName,
      branch: selectedProduce.branch,
      tonnageSold,
      amountPaid,
      buyerName,
      salesAgent: user.username,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    };

    let sales = JSON.parse(localStorage.getItem("kglSales")) || [];
    sales.push(saleRecord);
    localStorage.setItem("kglSales", JSON.stringify(sales));

    alert("Sale recorded successfully.");

    // ===============================
    // Reset form state
    // ===============================
    document.getElementById("cashSaleForm").reset();
    selectedProduce = null;
    availableStockText.textContent = "";
    priceInput.value = "";
    branchInput.value = "";
    produceSelect.selectedIndex = 0;
  });
