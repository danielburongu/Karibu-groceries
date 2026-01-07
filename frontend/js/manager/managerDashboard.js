// managerDashboard.js

const user = JSON.parse(localStorage.getItem("kglUser"));

// Role protection
if (!user || user.role !== "manager") {
  alert("Access denied. Manager only.");
  window.location.href = "../index.html";
}

// Logout logic
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("kglUser");
  window.location.href = "../index.html";
});

// Temporary placeholders for navigation
document.getElementById("openProcurement").addEventListener("click", () => {
  alert("Procurement form will open here.");
});

document.getElementById("viewStock").addEventListener("click", () => {
  alert("Stock list will open here.");
});

document.getElementById("managerSales").addEventListener("click", () => {
  alert("Manager sales form will open here.");
});
