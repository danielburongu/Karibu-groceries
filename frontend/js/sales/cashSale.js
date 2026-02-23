document.addEventListener("DOMContentLoaded", () => {
  const session = JSON.parse(localStorage.getItem("kglSession") || "null");

  if (!session?.token || !["sales", "manager"].includes(session.user.role)) {
    alert("Access denied.");
    window.location.href = "/frontend/login.html";
    return;
  }

  const token = session.token;
  const user = session.user;

  const API_BASE = "http://localhost:5000/api";

  const form = document.getElementById("cashSaleForm");
  const produceSelect = document.getElementById("produceSelect");
  const availableStockInput = document.getElementById("availableStock");
  const priceInput = document.getElementById("price");
  const branchInput = document.getElementById("branch");
  const amountPaidInput = document.getElementById("amountPaid");
  const tonnageInput = document.getElementById("tonnageSold");
  const buyerNameInput = document.getElementById("buyerName");
  const salesAgentInput = document.getElementById("salesAgent");
  const receiptContent = document.getElementById("receiptContent");

  salesAgentInput.value = user.name;
  branchInput.value = user.branch.toUpperCase();

  let branchStock = [];
  let selectedStock = null;

  function authHeaders() {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  function formatUSh(amount) {
    return (
      "USh " + new Intl.NumberFormat("en-UG").format(Math.round(amount || 0))
    );
  }

  async function loadBranchStock() {
    const res = await fetch(`${API_BASE}/stock?branch=${user.branch}`, {
      headers: authHeaders(),
    });

    const data = await res.json();

    return data.map((item) => ({
      id: item._id,
      produceName: item.produceName,
      tonnage: item.tonnage,
      sellingPrice: item.currentSellingPrice,
      branch: item.branch,
    }));
  }

  function populateProduceSelect() {
    produceSelect.innerHTML = `<option disabled selected>Select produce</option>`;
    branchStock.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = `${item.produceName} (${item.tonnage} KG)`;
      produceSelect.appendChild(opt);
    });
  }

  (async () => {
    branchStock = await loadBranchStock();
    populateProduceSelect();
  })();

  produceSelect.addEventListener("change", () => {
    selectedStock = branchStock.find((s) => s.id === produceSelect.value);
    if (!selectedStock) return;

    availableStockInput.value = `${selectedStock.tonnage} KG`;
    priceInput.value = formatUSh(selectedStock.sellingPrice);
    tonnageInput.value = "";
    amountPaidInput.value = "";
  });

  tonnageInput.addEventListener("input", () => {
    if (!selectedStock) return;
    const qty = Number(tonnageInput.value) || 0;
    amountPaidInput.value = formatUSh(qty * selectedStock.sellingPrice);
  });

  function showReceipt(sale) {
    receiptContent.innerHTML = `
      <h5 class="text-center">Karibu Groceries</h5>
      <hr>
      <p><strong>Receipt No:</strong> #${sale.receiptNumber}</p>
      <p><strong>Date:</strong> ${new Date(sale.createdAt).toLocaleString()}</p>
      <hr>
      <p>Produce: ${sale.produce}</p>
      <p>Qty: ${sale.tonnageSold} KG</p>
      <p>Price: ${formatUSh(sale.pricePerKg)}</p>
      <hr>
      <p>Subtotal: ${formatUSh(sale.subtotal)}</p>
      <p>Discount: -${formatUSh(sale.discount)}</p>
      <p>Total After Discount: ${formatUSh(sale.totalAfterDiscount)}</p>
      <p>VAT (18%): ${formatUSh(sale.vatAmount)}</p>
      <h5 class="text-success">Total Paid: ${formatUSh(sale.amountPaid)}</h5>
      <hr>
      <p>Buyer: ${sale.buyerName}</p>
      <p>Sales Agent: ${sale.salesAgent}</p>
    `;

    new bootstrap.Modal(document.getElementById("receiptModal")).show();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      produceId: selectedStock.id,
      tonnageSold: Number(tonnageInput.value),
      buyerName: buyerNameInput.value,
      discount: 0,
    };

    const res = await fetch(`${API_BASE}/sales`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (!res.ok) return alert(result.message);

    showReceipt(result.sale);
    form.reset();
  });
});
