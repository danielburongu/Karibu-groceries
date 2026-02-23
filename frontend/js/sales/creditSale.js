/**
 * creditSale.js
 * Sales/Manager/Director role | Branch-safe | JWT Protected
 */

document.addEventListener("DOMContentLoaded", () => {
  /* SESSION & ROLE VALIDATION */
  const session = JSON.parse(localStorage.getItem("kglSession") || "null");

  if (
    !session?.token ||
    !["sales", "manager", "director"].includes(
      session.user?.role?.toLowerCase(),
    )
  ) {
    alert("Access denied.");
    window.location.href = "/frontend/login.html";
    return;
  }

  const token = session.token;
  const user = session.user;

  const API_BASE = "http://localhost:5000/api";
  const CREDIT_ENDPOINT = `${API_BASE}/credits`;

  const NIN_REGEX = /^[A-Z]{2}[A-Z0-9]{12,14}$/i;

  /* DOM REFERENCES */
  const form = document.getElementById("creditSaleForm");
  const produceSelect = document.getElementById("produceSelect");
  const availableStock = document.getElementById("availableStock");
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

  /* INIT USER CONTEXT */
  salesAgentInput.value = user.name || "Sales Agent";
  branchInput.value = (user.branch || "").toUpperCase();
  branchInput.readOnly = true;

  ninInput.addEventListener("input", () => {
    ninInput.value = ninInput.value.toUpperCase().replace(/\s+/g, "");
  });

  let branchStock = [];
  let selectedStock = null;

  /* HELPERS */
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

  /* LOAD BRANCH STOCK */
  async function loadBranchStock() {
    try {
      const res = await fetch(
        `${API_BASE}/stock?branch=${encodeURIComponent(user.branch)}`,
        {
          headers: authHeaders(),
        },
      );

      if (!res.ok) throw new Error("Failed to load stock");

      const data = await res.json();

      return data.map((item) => ({
        id: item._id,
        produceName: item.produceName,
        tonnage: Number(item.tonnage),
        sellingPrice: Number(item.currentSellingPrice || 0),
        branch: item.branch,
        produceType: item.produceType || "-",
      }));
    } catch (err) {
      alert("Unable to load stock.\n" + err.message);
      return [];
    }
  }

  function populateProduceSelect() {
    produceSelect.innerHTML = `<option disabled selected>Select produce</option>`;

    if (!branchStock.length) {
      produceSelect.innerHTML += `<option disabled>No stock available</option>`;
      return;
    }

    branchStock.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = `${item.produceName} (${item.tonnage.toLocaleString()} KG)`;
      produceSelect.appendChild(opt);
    });
  }

  /* INITIAL LOAD */
  (async () => {
    branchStock = await loadBranchStock();
    populateProduceSelect();
  })();

  /* PRODUCE SELECTION */
  produceSelect.addEventListener("change", () => {
    selectedStock = branchStock.find((s) => s.id === produceSelect.value);
    if (!selectedStock) return;

    availableStock.value = `${selectedStock.tonnage.toLocaleString()} KG`;
    produceTypeInput.value = selectedStock.produceType;
    tonnageInput.value = "";
    amountDueInput.value = "";
  });

  /* AUTO CALCULATE PREVIEW */
  tonnageInput.addEventListener("input", () => {
    if (!selectedStock) return;

    let qty = Number(tonnageInput.value) || 0;

    if (qty > selectedStock.tonnage) {
      alert("Cannot exceed available stock.");
      qty = selectedStock.tonnage;
      tonnageInput.value = qty;
    }

    amountDueInput.value = formatUSh(qty * selectedStock.sellingPrice);
  });

  /* SUBMIT CREDIT SALE */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!selectedStock) return alert("Select produce first.");

    const qty = Number(tonnageInput.value);
    if (qty <= 0 || qty > selectedStock.tonnage)
      return alert("Invalid quantity.");

    if (!NIN_REGEX.test(ninInput.value.trim()))
      return alert("Invalid NIN format.");

    const due = new Date(dueDateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (due <= today) return alert("Due date must be in the future.");

    const payload = {
      produceId: selectedStock.id,
      tonnage: qty,
      customerName: buyerNameInput.value.trim(),
      contact: contactInput.value.trim(),
      nin: ninInput.value.trim(),
      location: locationInput.value.trim(),
      dueDate: due.toISOString(),
    };

    try {
      const res = await fetch(CREDIT_ENDPOINT, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Credit sale failed");
      }

      const createdCredit = data.credit;

      alert(
        `Credit recorded successfully!\n\n` +
          `Amount Due: USh ${createdCredit.amountDue.toLocaleString()}\n` +
          `Due Date: ${new Date(createdCredit.dueDate).toLocaleDateString("en-GB")}`,
      );

      /* Reset UI */
      form.reset();
      selectedStock = null;

      branchStock = await loadBranchStock();
      populateProduceSelect();

      branchInput.value = (user.branch || "").toUpperCase();
      availableStock.value = "";
      produceTypeInput.value = "";
      amountDueInput.value = "";
    } catch (err) {
      console.error("Credit submission error:", err);
      alert("Failed:\n" + err.message);
    }
  });
});
