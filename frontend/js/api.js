// api.js Centralized API client with JWT & 401 handling

// Prevent redeclaration if loaded multiple times
if (typeof window.apiRequest === "undefined") {
  const API_BASE = "http://localhost:5000/api";

  function getToken() {
    try {
      const session = JSON.parse(localStorage.getItem("kglSession") || "{}");
      return session?.token || null;
    } catch {
      return null;
    }
  }

  async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const defaultHeaders = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const config = {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    };

    // Normalize endpoint path
    const url = `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    try {
      const res = await fetch(url, config);

      if (res.status === 401) {
        localStorage.removeItem("kglSession");
        window.location.href = "/frontend/login.html";
        throw new Error("Unauthorized – session expired");
      }

      if (!res.ok) {
        let errorMessage = `Request failed (${res.status})`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      if (res.status === 204) return null;
      return await res.json();
    } catch (err) {
      console.error(`API error [${endpoint}]:`, err);
      throw err; // let caller handle/display
    }
  }

  // Shorthand methods
  apiRequest.get = (endpoint, opts = {}) =>
    apiRequest(endpoint, { method: "GET", ...opts });
  apiRequest.post = (endpoint, body, opts = {}) =>
    apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      ...opts,
    });
  apiRequest.patch = (endpoint, body, opts = {}) =>
    apiRequest(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...opts,
    });
  apiRequest.delete = (endpoint, opts = {}) =>
    apiRequest(endpoint, { method: "DELETE", ...opts });

  window.apiRequest = apiRequest;
}
