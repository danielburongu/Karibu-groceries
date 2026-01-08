const user = JSON.parse(localStorage.getItem("kglUser") || "{}");

/* ROLE PROTECTION */
if (!user || user.role !== "sales") {
  alert("Access denied. Sales agents only.");
  window.location.href = "../index.html";
}

document.getElementById("salesAgent").value = user.username;

/* LOAD STOCK (branch-specific) */
let stock = JSON.parse(localStorage.getItem("kglStock")) || [];
stock = stock.filter((s) => s.branch === user.branch && s.tonnage > 0);

const produceSelect = document.getElementById("produceSelect");
const availableStock = document.getElementById("availableStock");
const price = document.getElementById("price");
const branch = document.getElementById("branch");
const amountPaid = document.getElementById("amountPaid");
const tonnageInput = document.getElementById("tonnageSold");

let selectedStock = null;

/* POPULATE DROPDOWN */
stock.forEach((item) => {
  const opt = document.createElement("option");
  opt.value = item.produceName;
  opt.textContent = `${item.produceName} (${item.tonnage} KG)`;
  produceSelect.appendChild(opt);
});

/* HANDLE SELECTION */
produceSelect.addEventListener("change", () => {
  selectedStock = stock.find((s) => s.produceName === produceSelect.value);

  if (!selectedStock) return;

  availableStock.value = `${selectedStock.tonnage} KG`;
  price.value = selectedStock.sellingPrice;
  branch.value = selectedStock.branch;
  amountPaid.value = "";
});

/* AUTO CALCULATE AMOUNT */
tonnageInput.addEventListener("input", () => {
  if (!selectedStock) return;

  const qty = Number(tonnageInput.value);
  if (qty > 0) {
    amountPaid.value = (qty * selectedStock.sellingPrice).toLocaleString();
  }
});

/* SUBMIT SALE */
document.getElementById("cashSaleForm").addEventListener("submit", (e) => {
  e.preventDefault();

  if (!selectedStock) return alert("Select produce");

  const qty = Number(tonnageInput.value);
  if (qty <= 0 || qty > selectedStock.tonnage) {
    return alert("Invalid tonnage");
  }

  const buyer = buyerName.value.trim();
  if (!/^[a-zA-Z0-9 ]{2,}$/.test(buyer)) {
    return alert("Invalid buyer name");
  }

  /* REDUCE STOCK */
  selectedStock.tonnage -= qty;
  localStorage.setItem("kglStock", JSON.stringify(stock));

  /* RECORD SALE */
  const sales = JSON.parse(localStorage.getItem("kglSales") || "[]");
  sales.push({
    produceName: selectedStock.produceName,
    branch: selectedStock.branch,
    tonnageSold: qty,
    amountPaid: qty * selectedStock.sellingPrice,
    buyerName: buyer,
    salesAgent: user.username,
    date: new Date().toLocaleDateString("en-GB"),
    time: new Date().toLocaleTimeString("en-GB"),
  });
  localStorage.setItem("kglSales", JSON.stringify(sales));

  /* STOCK ALERT */
  if (selectedStock.tonnage === 0) {
    alert(`Stock Alert: ${selectedStock.produceName} is now OUT OF STOCK`);
  }

  alert("Cash sale recorded successfully.");
  location.reload();
});
