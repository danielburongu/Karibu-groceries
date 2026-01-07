// auth.js - Authentication & Session Management

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (!loginForm) {
    console.warn("Login form not found. auth.js loaded on wrong page.");
    return;
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Get form values
    const username = document.getElementById("username").value.trim().toLowerCase();
    const role = document.getElementById("role").value;
    const branch = document.getElementById("branch").value;

    // Validation
    if (username.length < 3) {
      showAlert("Username must be at least 3 characters long.", "danger");
      return;
    }

    if (!role) {
      showAlert("Please select your role.", "danger");
      return;
    }

    if (!branch) {
      showAlert("Please select your branch.", "danger");
      return;
    }

    // Create user session object
    const userSession = {
      username: username,
      displayName: username.charAt(0).toUpperCase() + username.slice(1), // Nice display
      role: role,           // "director", "manager", "sales"
      branch: branch,       // "maganjo" or "matugga"
      loginTime: new Date().toISOString()
    };

    // Save session
    localStorage.setItem("kglUser", JSON.stringify(userSession));

    console.log("Login successful:", userSession);

    // ALL roles now go to the unified main dashboard
    setTimeout(() => {
      window.location.href = "./dashboard.html";
    }, 400);
  });

  // Bootstrap dismissible alert helper
  function showAlert(message, type = "danger") {
    // Remove existing alert
    const existing = document.querySelector(".alert");
    if (existing) existing.remove();

    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-4 mb-0`;
    alertDiv.role = "alert";
    alertDiv.innerHTML = `
      <strong>${type === "danger" ? "Error" : "Success"}:</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Insert before the form
    loginForm.parentElement.insertBefore(alertDiv, loginForm);

    // Auto-dismiss success alerts after 5 seconds
    if (type === "success") {
      setTimeout(() => {
        const bsAlert = bootstrap.Alert.getOrCreateInstance(alertDiv);
        bsAlert.close();
      }, 5000);
    }
  }
});