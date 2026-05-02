const fs = require('fs');
let c = fs.readFileSync('frontend/js/views/parkingView.js', 'utf8');

const functions = `
  // ── FR-14: Digital Payment Modal ──
  function renderPaymentModal(bookingId, amount) {
    const modalHtml = \`
      <div id="payment-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(8px);">
        <div class="card" style="width: 90%; max-width: 500px; padding: 40px; text-align: center; position: relative; animation: slideUp 0.4s ease-out;">
          <button id="payment-modal-close" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #627d98;">&times;</button>
          
          <div style="font-size: 4rem; margin-bottom: 20px;">💳</div>
          <h2 style="color: #102a43; margin-bottom: 10px;">Select Payment Method</h2>
          <p style="color: #627d98; margin-bottom: 30px;">Total Amount to Pay: <span style="font-weight: bold; color: #102a43;">৳\${amount}</span></p>

          <div id="payment-error" class="error-message" style="display:none; margin-bottom: 15px;"></div>
          <div id="payment-success" class="success-message" style="display:none; margin-bottom: 15px; color: #00b569; font-weight: bold;"></div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; text-align: left;">
            <label class="payment-option" style="display: flex; align-items: center; gap: 10px; padding: 15px; border: 1px solid #dae1e7; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
              <input type="radio" name="payment-method" value="bKash" checked>
              <span>bKash</span>
            </label>
            <label class="payment-option" style="display: flex; align-items: center; gap: 10px; padding: 15px; border: 1px solid #dae1e7; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
              <input type="radio" name="payment-method" value="Nagad">
              <span>Nagad</span>
            </label>
            <label class="payment-option" style="display: flex; align-items: center; gap: 10px; padding: 15px; border: 1px solid #dae1e7; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
              <input type="radio" name="payment-method" value="Rocket">
              <span>Rocket</span>
            </label>
            <label class="payment-option" style="display: flex; align-items: center; gap: 10px; padding: 15px; border: 1px solid #dae1e7; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
              <input type="radio" name="payment-method" value="Card">
              <span>Debit/Credit Card</span>
            </label>
            <label class="payment-option" style="grid-column: span 2; display: flex; align-items: center; gap: 10px; padding: 15px; border: 1px solid #dae1e7; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: #f8fafc;">
              <input type="radio" name="payment-method" value="Cash">
              <span>Pay with Cash at Garage</span>
            </label>
          </div>

          <button id="pay-now-btn" class="btn btn-primary" data-booking-id="\${bookingId}" data-amount="\${amount}" style="width: 100%; padding: 15px; font-size: 1.1rem;">Proceed to Pay</button>
        </div>
      </div>
    \`;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
  }

  // ── FR-15: Digital Receipt ──
  function renderReceipt(payment) {
    const modalHtml = \`
      <div id="receipt-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(8px);">
        <div class="card" id="receipt-card" style="width: 90%; max-width: 450px; padding: 0; text-align: center; position: relative; overflow: hidden; background: white;">
           <div style="background: #102a43; color: white; padding: 20px;">
             <h2 style="margin: 0;">Payment Receipt</h2>
           </div>
           
           <div style="padding: 30px;">
             <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;">ParkDhaka - Smart Parking</div>
             <div style="color: #627d98; font-size: 0.9rem; margin-bottom: 25px;">Official Digital Transaction Copy</div>
             
             <div style="border-top: 2px dashed #dae1e7; border-bottom: 2px dashed #dae1e7; padding: 20px 0; margin-bottom: 25px; text-align: left;">
               <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                 <span style="color: #627d98;">Transaction ID:</span>
                 <span style="font-weight: bold;">\${payment.transactionId || "CASH_PAYMENT"}</span>
               </div>
               <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                 <span style="color: #627d98;">Date & Time:</span>
                 <span>\${new Date(payment.timestamp).toLocaleString()}</span>
               </div>
               <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                 <span style="color: #627d98;">Payment Method:</span>
                 <span style="font-weight: bold;">\${payment.paymentMethod}</span>
               </div>
               <div style="display: flex; justify-content: space-between;">
                 <span style="color: #627d98;">Status:</span>
                 <span style="color: #00b569; font-weight: bold;">\${payment.status}</span>
               </div>
             </div>

             <div style="text-align: left; margin-bottom: 30px;">
                <div style="color: #627d98; font-size: 0.8rem; margin-bottom: 5px;">Garage Details:</div>
                <div style="font-weight: bold;">\${payment.booking && payment.booking.garageSpace ? payment.booking.garageSpace.title : (payment.garage ? payment.garage.title : "N/A")}</div>
                <div style="color: #627d98; font-size: 0.9rem;">\${payment.booking && payment.booking.garageSpace ? payment.booking.garageSpace.location : (payment.garage ? payment.garage.location : "")}</div>
             </div>

             <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f8fafc; border-radius: 12px; margin-bottom: 30px;">
                <span style="font-size: 1.1rem; font-weight: bold;">Total Paid:</span>
                <span style="font-size: 1.5rem; font-weight: bold; color: #102a43;">৳\${payment.amount}</span>
             </div>

             <div style="display: flex; gap: 10px;">
               <button id="print-receipt-btn" class="btn btn-secondary" style="flex: 1; padding: 12px;">Print Receipt</button>
               <button id="receipt-modal-close" class="btn btn-primary" style="flex: 1; padding: 12px;">Close</button>
             </div>
           </div>
        </div>
      </div>
    \`;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
  }

  // ── FR-15: Driver Payment History ──
  function renderPaymentHistory(payments) {
    const containerEl = document.getElementById("app");
    
    let historyHtml = '<p style="text-align: center; color: #627d98; padding: 40px;">No transaction history found.</p>';
    
    if (payments && payments.length > 0) {
      historyHtml = \`
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction ID</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            \${payments.map(p => \\\`
              <tr>
                <td>\${new Date(p.timestamp).toLocaleString()}</td>
                <td>\${p.transactionId || "N/A"}</td>
                <td>\${p.paymentMethod}</td>
                <td style="font-weight: bold;">৳\${p.amount}</td>
                <td><span class="status-label \${p.status === 'Paid' ? 'status-Open' : (p.status === 'Pending' ? 'status-Pending' : 'status-Closed')}">\${p.status}</span></td>
                <td>
                  <button class="btn btn-secondary btn-view-receipt" data-id="\${p._id}" style="padding: 6px 12px; font-size: 12px;">🧾 Receipt</button>
                </td>
              </tr>
            \\\`).join("")}
          </tbody>
        </table>
      \`;
    }

    containerEl.innerHTML = \`
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>💳 Payment History</h1>
          <div class="header-actions">
            <button class="btn btn-secondary" id="back-to-hub">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        
        <div class="card" style="width: 100%; text-align: left;">
          <h2 style="color: #102a43; margin-bottom: 20px; font-size: 1.5rem;">Recent Transactions</h2>
          \${historyHtml}
        </div>
      </div>
    \`;
  }

  // ── FR-15: Host Earnings & Withdrawals ──
  function renderHostEarnings(stats) {
    const containerEl = document.getElementById("app");
    const d = stats.data;
    
    let historyHtml = '<p style="text-align: center; color: #627d98; padding: 20px;">No earnings history found.</p>';
    if (d.payments && d.payments.length > 0) {
      historyHtml = \`
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Guest</th>
              <th>Amount</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            \${d.payments.map(p => \\\`
              <tr>
                <td>\${new Date(p.timestamp).toLocaleDateString()}</td>
                <td>\${p.user ? p.user.name : "Guest"}</td>
                <td style="font-weight: bold; color: #00b569;">৳\${p.amount}</td>
                <td>\${p.paymentMethod}</td>
              </tr>
            \\\`).join("")}
          </tbody>
        </table>
      \`;
    }

    containerEl.innerHTML = \`
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>💸 Host Earnings</h1>
          <div class="header-actions">
            <button class="btn btn-secondary" id="back-to-hub">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>

        <div class="dashboard-content" style="margin-bottom: 30px;">
          <div class="card">
            <h3>Total Lifetime Earnings</h3>
            <p class="stat" style="color: #00b569;">৳\${d.totalEarnings}</p>
          </div>
          <div class="card">
            <h3>Available for Withdrawal</h3>
            <p class="stat" style="color: #667eea;">৳\${d.availableBalance}</p>
          </div>
        </div>

        <div class="card" style="width: 100%; margin-bottom: 30px;">
          <h2 style="color: #102a43; margin-bottom: 20px; font-size: 1.5rem;">Request Payout</h2>
          <p style="color: #627d98; margin-bottom: 20px;">Withdraw your earnings to your linked mobile banking account (bKash/Nagad).</p>
          <button id="withdraw-funds-btn" class="btn btn-primary" \${d.availableBalance <= 0 ? "disabled" : ""}>Request Withdrawal</button>
        </div>

        <div class="card" style="width: 100%; text-align: left;">
          <h2 style="color: #102a43; margin-bottom: 20px; font-size: 1.5rem;">Earnings History</h2>
          \${historyHtml}
        </div>
      </div>
    \`;
  }
`;

const returnBlock = `
  return {
    renderAuthPage,
    renderDriverDashboard,
    renderGarageHostDashboard,
    renderHostManageSpaces,
    renderHostStats,
    renderHostNotifications,
    renderAddGarageSpaceForm,
    renderAdminDashboard,
    renderGarageListing,
    filterAndRenderGarages,
    renderBookingForm,
    renderMyBookings,
    renderSubscriptionPasses,
    renderRescheduleModal,
    renderNotifications,
    renderRatingModal,
    renderMyRatings,
    renderPanicSection,
    renderPanicLogs,
    renderAdminGarageApprovals,
    renderAdminUsers,
    renderAdminBookings,
    renderAdminRevenue,
    renderAdminRatings,
    renderAdminComplaints,
    renderAdminPerformance,
    showError,
    renderFavoriteGarages,
    renderPaymentModal,
    renderPaymentHistory,
    renderReceipt,
    renderHostEarnings
  };
`;

c = c.replace(/return\s*\{[\s\S]*?\};/, functions + returnBlock);
c = c.replace(/\\\`/g, '`');

fs.writeFileSync('frontend/js/views/parkingView.js', c, 'utf8');
console.log("parkingView.js updated safely");
