const user = JSON.parse(localStorage.getItem("kglUser") || "{}");

/* ROLE PROTECTION */
if (!user || user.role !== "sales") {
  alert("Access denied. Sales agents only.");
  window.location.href = "../index.html";
}

document.getElementById("salesAgent").value = user.username;

/* LOAD STOCK — BRANCH SAFE */
let stock = JSON.parse(localStorage.getItem("kglStock")) || [];
stock = stock.filter((s) => s.branch === user.branch && s.tonnage > 0);

const produceSelect = document.getElementById("produceSelect");
const availableStock = document.getElementById("availableStock");
const produceType = document.getElementById("produceType");
const branch = document.getElementById("branch");
const tonnageInput = document.getElementById("tonnage");
const amountDue = document.getElementById("amountDue");

let selectedStock = null;

/* POPULATE PRODUCE */
stock.forEach((item) => {
  const opt = document.createElement("option");
  opt.value = item.produceName;
  opt.textContent = `${item.produceName} (${item.tonnage} KG)`;
  produceSelect.appendChild(opt);
});

/* SELECT PRODUCE */
produceSelect.addEventListener("change", () => {
  selectedStock = stock.find((s) => s.produceName === produceSelect.value);

  if (!selectedStock) return;

  availableStock.value = `${selectedStock.tonnage} KG`;
  produceType.value = selectedStock.produceType;
  branch.value = selectedStock.branch;
  amountDue.value = "";
});

/* AUTO CALCULATE */
tonnageInput.addEventListener("input", () => {
  if (!selectedStock) return;

  const qty = Number(tonnageInput.value);
  if (qty > 0) {
    amountDue.value = (qty * selectedStock.sellingPrice).toLocaleString(
      "en-UG",
    );
  }
});

/* SUBMIT */
document.getElementById("creditSaleForm").addEventListener("submit", (e) => {
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

  if (!/^07\d{8}$/.test(contact.value)) {
    return alert("Invalid phone number");
  }

  if (!/^[A-Z]{2}[A-Z0-9]{12,14}$/.test(nin.value.toUpperCase())) {
    return alert("Invalid NIN format");
  }

  /* REDUCE STOCK */
  selectedStock.tonnage -= qty;
  localStorage.setItem("kglStock", JSON.stringify(stock));

  /* SAVE CREDIT SALE */
  const creditSales = JSON.parse(localStorage.getItem("kglCreditSales")) || [];

  creditSales.push({
    produceName: selectedStock.produceName,
    produceType: selectedStock.produceType,
    branch: selectedStock.branch,
    tonnage: qty,
    amountDue: qty * selectedStock.sellingPrice,
    buyerName: buyer,
    nin: nin.value.toUpperCase(),
    location: location.value,
    contact: contact.value,
    salesAgent: user.username,
    dueDate: dueDate.value,
    date: new Date().toLocaleDateString("en-GB"),
    time: new Date().toLocaleTimeString("en-GB"),
  });

  localStorage.setItem("kglCreditSales", JSON.stringify(creditSales));

  /* STOCK ALERT */
  if (selectedStock.tonnage === 0) {
    alert(`Stock Alert: ${selectedStock.produceName} is now OUT OF STOCK`);
  }

  alert("Credit sale recorded successfully.");
  location.reload();
});
