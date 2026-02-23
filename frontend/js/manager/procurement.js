/**
 * Procurement Module
 * JWT Protected and Branch Locked
 */

document.addEventListener("DOMContentLoaded", () => {
  const session = JSON.parse(localStorage.getItem("kglSession") || "null");

  if (!session?.token || session.user.role !== "manager") {
    redirectToLogin();
    return;
  }

  const user = session.user;

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

  if (branchInput) {
    branchInput.value = user.branch?.toUpperCase() || "-";
    branchInput.disabled = true;
  }

  const now = new Date();
  dateInput.value = now.toISOString().split("T")[0];
  timeInput.value = now.toTimeString().slice(0, 5);

  function redirectToLogin() {
    localStorage.removeItem("kglSession");
    window.location.href = "/frontend/login.html";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const produceName = produceNameInput.value.trim();
    const produceType = produceTypeInput.value.trim();
    const sourceType = sourceTypeInput.value;
    const deliveryDate = dateInput.value;
    const deliveryTime = timeInput.value;
    const tonnage = Number(tonnageInput.value) || 0;
    const totalCost = Number(costInput.value) || 0;
    const dealerName = dealerNameInput.value.trim();
    const dealerContact = dealerContactInput.value.trim();
    const sellingPrice = Number(sellingPriceInput.value) || 0;

    if (!produceName || produceName.length < 2) {
      alert("Produce name is required (min 2 characters).");
      produceNameInput.focus();
      return;
    }

    if (!produceType || produceType.length < 2) {
      alert("Produce type/variety is required.");
      produceTypeInput.focus();
      return;
    }

    if (!sourceType) {
      alert("Please select source type.");
      sourceTypeInput.focus();
      return;
    }

    if (!deliveryDate || !deliveryTime) {
      alert("Delivery date and time are required.");
      return;
    }

    if (tonnage < 1000) {
      alert("Minimum procurement quantity is 1000 KG.");
      tonnageInput.focus();
      return;
    }

    if (totalCost < 10000) {
      alert("Total cost must be at least USh 10,000.");
      costInput.focus();
      return;
    }

    if (sellingPrice <= 0) {
      alert("Selling price per KG must be greater than 0.");
      sellingPriceInput.focus();
      return;
    }

    if (!dealerName || dealerName.length < 2) {
      alert("Supplier name is required.");
      dealerNameInput.focus();
      return;
    }

    if (!/^07\d{8}$/.test(dealerContact)) {
      alert("Supplier contact must be a valid Ugandan number (07XXXXXXXX).");
      dealerContactInput.focus();
      return;
    }

    const payload = {
      produceName,
      produceType,
      sourceType,
      deliveryDate,
      deliveryTime,
      tonnage,
      cost: totalCost,
      sellingPrice,
      supplierName: dealerName,
      supplierContact: dealerContact,
      branch: user.branch?.toLowerCase() || "",
    };

    try {
      await apiRequest("procurements", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      alert("Procurement recorded successfully!");

      form.reset();

      if (branchInput) {
        branchInput.value = user.branch?.toUpperCase() || "-";
        branchInput.disabled = true;
      }
    } catch (err) {
      console.error("PROCUREMENT ERROR:", err);
      alert(err.message || "Failed to record procurement. Please try again.");
    }
  });
});

/* MULTI-TAB SESSION SYNC */
window.addEventListener("storage", (e) => {
  if (e.key === "kglSession" && !e.newValue) {
    window.location.href = "/frontend/login.html";
  }
});
