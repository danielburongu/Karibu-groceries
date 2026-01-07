// stock.js

const user = JSON.parse(localStorage.getItem("kglUser"));

// ===============================
// Role protection
// ===============================
if (!user || user.role !== "manager") {
  alert("Access denied. Manager only.");
  window.location.href = "../index.html";
}

const stockTableBody = document.querySelector("#stockTable tbody");
const stock = JSON.parse(localStorage.getItem("kglStock")) || [];

let outOfStockItems = [];

if (stock.length === 0) {
  stockTableBody.innerHTML =
    "<tr><td colspan='6'>No stock records found.</td></tr>";
} else {
  stock.forEach((item) => {
    const row = document.createElement("tr");

    let status = "Available";
    let statusColor = "green";

    if (item.tonnage <= 0) {
      status = "Out of Stock";
      statusColor = "red";
      outOfStockItems.push(item.produceName);
    } else if (item.tonnage <= 500) {
      status = "Low Stock";
      statusColor = "orange";
    }

    row.innerHTML = `
      <td>${item.produceName}</td>
      <td>${item.produceType}</td>
      <td>${item.branch}</td>
      <td>${item.tonnage}</td>
      <td>${item.sellingPrice}</td>
      <td style="color:${statusColor}; font-weight:bold;">
        ${status}
      </td>
    `;

    stockTableBody.appendChild(row);
  });
}

// ===============================
// Single stock alert (manager)
// ===============================
if (outOfStockItems.length > 0) {
  alert(
    "Stock Alert:\nThe following items are out of stock:\n- " +
      outOfStockItems.join("\n- "),
  );
}
