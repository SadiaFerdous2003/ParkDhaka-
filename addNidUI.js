const fs = require('fs');
let c = fs.readFileSync('frontend/js/views/parkingView.js', 'utf8');

// 1. Inject the NID card into Driver Dashboard
const driverAnchor = 'id="nav-payment-history"';
const driverEnd = '</div>';
const driverPos = c.indexOf(driverAnchor);
if (driverPos !== -1) {
    const endPos = c.indexOf(driverEnd, driverPos);
    if (endPos !== -1) {
        const insertPos = endPos + driverEnd.length;
        const nidCard = `\n\n          <div class="card admin-nav-card" id="nav-nid-verify" style="cursor: pointer; text-align: center; border-bottom: 4px solid #102a43;">\n            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">🆔</h3>\n            <h3>NID Verification</h3>\n            <p>Verify your identity for trusted profile.</p>\n          </div>`;
        c = c.slice(0, insertPos) + nidCard + c.slice(insertPos);
    }
}

// 2. Inject the NID card into Host Dashboard
const hostAnchor = 'id="host-nav-earnings"';
const hostEnd = '</div>';
const hostPos = c.indexOf(hostAnchor);
if (hostPos !== -1) {
    const endPos = c.indexOf(hostEnd, hostPos);
    if (endPos !== -1) {
        const insertPos = endPos + hostEnd.length;
        const nidCard = `\n\n          <div class="card admin-nav-card" id="host-nav-nid" style="cursor: pointer; text-align: center; border-bottom: 4px solid #102a43;">\n            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">🆔</h3>\n            <h3>NID Verification</h3>\n            <p>Mandatory for hosting your space.</p>\n          </div>`;
        c = c.slice(0, insertPos) + nidCard + c.slice(insertPos);
    }
}

// 3. Add the renderNidVerification function
const nidFunction = `
  // ── FR-20: NID Verification ──
  function renderNidVerification(status) {
    const containerEl = document.getElementById("app");
    
    let content = "";
    if (status.isNidVerified) {
      content = \`
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 5rem; margin-bottom: 20px;">✅</div>
          <h2 style="color: #102a43; margin-bottom: 10px;">Verified Identity</h2>
          <p style="color: #627d98; margin-bottom: 30px;">Your account is verified with NID: <strong>\${status.nidNumber.replace(/\\d(?=\\d{4})/g, "*")}</strong></p>
          <button class="btn btn-secondary" id="back-to-hub" style="width: auto; padding: 12px 30px;">Back to Hub</button>
        </div>
      \`;
    } else {
      content = \`
        <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="font-size: 4rem; text-align: center; margin-bottom: 20px;">🆔</div>
          <h2 style="color: #102a43; text-align: center; margin-bottom: 10px;">Identity Verification</h2>
          <p style="color: #627d98; text-align: center; margin-bottom: 30px;">Please enter your 10-digit National ID number for verification.</p>
          
          <div class="card" style="text-align: left; padding: 30px;">
            <div class="form-group">
              <label>NID Number</label>
              <input type="text" id="nid-number-input" placeholder="e.g., 1234567890" maxlength="10" />
              <small style="color: #829ab1; display: block; margin-top: 5px;">Must be exactly 10 digits.</small>
            </div>
            
            <div id="nid-error" class="error-message" style="display:none; margin-bottom: 15px;"></div>
            
            <button id="submit-nid-btn" class="btn btn-primary" style="width: 100%; margin-top: 20px;">Verify Now</button>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
             <button class="btn btn-secondary" id="back-to-hub" style="width: auto; background: none; color: #627d98; box-shadow: none;">Skip for now</button>
          </div>
        </div>
      \`;
    }

    containerEl.innerHTML = \`
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🆔 Identity Verification</h1>
          <div class="header-actions">
            <button class="btn btn-secondary" id="back-to-hub">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        
        <div class="card" style="width: 100%;">
          \${content}
        </div>
      </div>
    \`;
  }
`;

// Insert the function before the return statement
c = c.replace('  return {', nidFunction + '\n  return {');

// Add the export
c = c.replace('  return {', '  return {\n    renderNidVerification,');

fs.writeFileSync('frontend/js/views/parkingView.js', c, 'utf8');
console.log("NID Verification added to parkingView.js");
