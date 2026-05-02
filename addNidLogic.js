const fs = require('fs');
let c = fs.readFileSync('frontend/js/app.js', 'utf8');

// 1. Add listeners to maps
c = c.replace('"nav-payment-history":  loadPaymentHistory', '"nav-payment-history":  loadPaymentHistory,\n      "nav-nid-verify":       loadNidVerification');
c = c.replace('"host-nav-earnings":     loadHostEarnings', '"host-nav-earnings":     loadHostEarnings,\n      "host-nav-nid":          loadNidVerification');

// 2. Add implementation functions
const nidLogic = `
  async function loadNidVerification() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(\`\${API_BASE_URL}/users/nid-status\`, {
        headers: { "Authorization": \`Bearer \${token}\` }
      });
      if (res.ok) {
        const data = await res.json();
        parkingView.renderNidVerification(data);
        setupBackToDashboardListener();
        setupLogoutButton();
        
        const submitBtn = document.getElementById("submit-nid-btn");
        if (submitBtn) submitBtn.addEventListener("click", handleVerifyNid);
      }
    } catch (err) { console.error("Error loading NID status:", err); }
  }

  async function handleVerifyNid() {
    const nidInput = document.getElementById("nid-number-input");
    const errorEl = document.getElementById("nid-error");
    const nid = nidInput.value.trim();

    if (!nid || nid.length < 10) {
      if (errorEl) { errorEl.textContent = "Please enter a valid 10-digit NID number."; errorEl.style.display = "block"; }
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(\`\${API_BASE_URL}/users/verify-nid\`, {
        method: "POST",
        headers: { "Authorization": \`Bearer \${token}\`, "Content-Type": "application/json" },
        body: JSON.stringify({ nidNumber: nid })
      });
      const data = await res.json();
      if (res.ok) {
        loadNidVerification(); // Refresh view
      } else {
        if (errorEl) { errorEl.textContent = data.message || "Verification failed"; errorEl.style.display = "block"; }
      }
    } catch (err) { console.error("NID verification error:", err); }
  }
`;

// Insert before the init/return block
c = c.replace('  // ── Init ──', nidLogic + '\n  // ── Init ──');

fs.writeFileSync('frontend/js/app.js', c, 'utf8');
console.log("NID Verification logic added to app.js");
