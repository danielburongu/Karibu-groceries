// ===============================
// PROCUREMENT FORM LOGIC (FINAL)
// ===============================

// Fetch logged-in user
const user = JSON.parse(localStorage.getItem("kglUser"));

// ------------------------------------------------
// LOGICAL FIX #1: Role protection
// Only managers are allowed to procure produce
// ------------------------------------------------
if (!user || user.role !== "manager") {
  alert("Access denied. Managers only.");
  window.location.href = "../index.html";
}

// Get procurement form
const form = document.getElementById("procurementForm");

// ------------------------------------------------
// RUNTIME ERROR HANDLING #1:
// Ensure form exists before attaching events
// ------------------------------------------------
if (!form) {
  console.error("Procurement form not found in DOM");
  alert("System error: Procurement form failed to load.");
  throw new Error("Procurement form missing");
}

// Handle form submission
form.addEventListener("submit", function (e) {
  e.preventDefault(); // SYNTAX FIX #1: prevent page reload

  try {
    // ===============================
    // GET FORM VALUES
    // ===============================
    const produceName = document.getElementById("produceName").value.trim();
    const produceType = document.getElementById("produceType").value.trim();
    const sourceType = document.getElementById("sourceType").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const tonnage = Number(document.getElementById("tonnage").value);
    const cost = Number(document.getElementById("cost").value);
    const dealerName = document.getElementById("dealerName").value.trim();
    const dealerContact = document.getElementById("dealerContact").value.trim();
    const branch = document.getElementById("branch").value;
    const sellingPrice = Number(document.getElementById("sellingPrice").value);

    // ===============================
    // VALIDATIONS (SPEC-ALIGNED)
    // ===============================

    // FIX #2: Produce name must be alphanumeric and not empty
    if (!/^[a-zA-Z0-9 ]+$/.test(produceName)) {
      alert("Produce name must be alphanumeric and not empty.");
      return;
    }

    // FIX #3: Produce type must contain alphabets only and be at least 2 characters
    if (!/^[a-zA-Z ]{2,}$/.test(produceType)) {
      alert(
        "Produce type must contain letters only and be at least 2 characters.",
      );
      return;
    }

    // FIX #4: Date and time must not be empty
    if (!date || !time) {
      alert("Date and time of produce must not be empty.");
      return;
    }

    // FIX #5: Tonnage must be numeric and at least 3 digits (≥100 KG)
    if (isNaN(tonnage) || tonnage < 100) {
      alert("Tonnage must be numeric and at least 3 digits (100 KG or more).");
      return;
    }

    // FIX #6: Cost must be numeric and at least 5 digits
    if (isNaN(cost) || cost < 10000) {
      alert("Cost must be numeric and at least 5 digits (UGX).");
      return;
    }

    // FIX #7: Dealer name must be alphanumeric and at least 2 characters
    if (!/^[a-zA-Z0-9 ]{2,}$/.test(dealerName)) {
      alert("Dealer name must be alphanumeric and at least 2 characters.");
      return;
    }

    // FIX #8: Dealer contact must be a valid Ugandan phone number
    if (!/^07\d{8}$/.test(dealerContact)) {
      alert("Enter a valid Ugandan phone number (07XXXXXXXX).");
      return;
    }

    // FIX #9: Branch must be selected (already known)
    if (!branch) {
      alert("Please select a branch to stock the produce.");
      return;
    }

    // FIX #10: Selling price must be numeric
    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      alert("Selling price must be a valid numeric value.");
      return;
    }

    // ===============================
    // LOAD & UPDATE STOCK
    // ===============================
    let stock = JSON.parse(localStorage.getItem("kglStock")) || [];

    // LOGICAL FIX:
    // Merge stock if same produce exists in same branch
    const existingStock = stock.find(
      (item) => item.produceName === produceName && item.branch === branch,
    );

    if (existingStock) {
      existingStock.tonnage += tonnage;
    } else {
      stock.push({
        produceName,
        produceType,
        sourceType,
        date,
        time,
        tonnage,
        cost,
        dealerName,
        dealerContact,
        branch,
        sellingPrice,
      });
    }

    // Save updated stock
    localStorage.setItem("kglStock", JSON.stringify(stock));

    alert("Produce procurement recorded successfully.");
    form.reset();
  } catch (error) {
    // ------------------------------------------------
    // RUNTIME ERROR HANDLING #2:
    // Catch unexpected execution errors
    // ------------------------------------------------
    console.error("Procurement error:", error);
    alert("An unexpected system error occurred. Please try again.");
  }
});
