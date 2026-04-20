const Payment = require("../models/payment");
const HostBanking = require("../models/hostBanking");
const Withdrawal = require("../models/withdrawal");
const mongoose = require("mongoose");

exports.getEarningsStats = async (req, res) => {
  try {
    const hostId = req.user.userId;

    // 1. Total Earnings (Status: "Paid")
    const totalEarningsResult = await Payment.aggregate([
      { $match: { host: new mongoose.Types.ObjectId(hostId), status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalEarnings = totalEarningsResult.length > 0 ? totalEarningsResult[0].total : 0;

    // 2. Earnings Today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayEarningsResult = await Payment.aggregate([
      { 
        $match: { 
          host: new mongoose.Types.ObjectId(hostId), 
          status: "Paid",
          timestamp: { $gte: startOfToday }
        } 
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const earningsToday = todayEarningsResult.length > 0 ? todayEarningsResult[0].total : 0;

    // 3. Earnings This Month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthEarningsResult = await Payment.aggregate([
      { 
        $match: { 
          host: new mongoose.Types.ObjectId(hostId), 
          status: "Paid",
          timestamp: { $gte: startOfMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const earningsMonth = monthEarningsResult.length > 0 ? monthEarningsResult[0].total : 0;

    // 4. Calculate Available Balance
    // Sum of all Approved and Pending withdrawals
    const totalWithdrawnResult = await Withdrawal.aggregate([
      { 
        $match: { 
          hostId: new mongoose.Types.ObjectId(hostId), 
          status: { $in: ["Approved", "Pending"] } 
        } 
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalWithdrawn = totalWithdrawnResult.length > 0 ? totalWithdrawnResult[0].total : 0;
    
    const availableBalance = totalEarnings - totalWithdrawn;

    res.json({
      totalEarnings,
      earningsToday,
      earningsMonth,
      availableBalance
    });
  } catch (error) {
    console.error("Error fetching earnings stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getBankingInfo = async (req, res) => {
  try {
    const banking = await HostBanking.findOne({ hostId: req.user.userId });
    res.json(banking || {});
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateBankingInfo = async (req, res) => {
  try {
    const { accountType, accountNumber, accountName } = req.body;
    
    if (!accountType || !accountNumber || !accountName) {
      return res.status(400).json({ message: "All banking fields are required" });
    }

    let banking = await HostBanking.findOne({ hostId: req.user.userId });

    if (banking) {
      banking.accountType = accountType;
      banking.accountNumber = accountNumber;
      banking.accountName = accountName;
      banking.updatedAt = Date.now();
      await banking.save();
    } else {
      banking = new HostBanking({
        hostId: req.user.userId,
        accountType,
        accountNumber,
        accountName
      });
      await banking.save();
    }

    res.json({ message: "Banking information updated successfully", banking });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.requestWithdrawal = async (req, res) => {
  try {
    const hostId = req.user.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Please enter a valid amount" });
    }

    // Check balance again on server side
    const totalEarningsResult = await Payment.aggregate([
      { $match: { host: new mongoose.Types.ObjectId(hostId), status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalEarnings = totalEarningsResult.length > 0 ? totalEarningsResult[0].total : 0;

    const totalWithdrawnResult = await Withdrawal.aggregate([
      { 
        $match: { 
          hostId: new mongoose.Types.ObjectId(hostId), 
          status: { $in: ["Approved", "Pending"] } 
        } 
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalWithdrawn = totalWithdrawnResult.length > 0 ? totalWithdrawnResult[0].total : 0;
    
    const availableBalance = totalEarnings - totalWithdrawn;

    if (amount > availableBalance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Ensure they have banking info
    const banking = await HostBanking.findOne({ hostId });
    if (!banking) {
      return res.status(400).json({ message: "Please add your banking information first" });
    }

    const withdrawal = new Withdrawal({
      hostId,
      amount,
      status: "Pending"
    });

    await withdrawal.save();

    res.status(201).json({ message: "Withdrawal request submitted successfully", withdrawal });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getHostWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ hostId: req.user.userId }).sort({ requestDate: -1 });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Simulation: Admin Approve Withdrawal
exports.adminApproveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawal = await Withdrawal.findById(id).populate("hostId", "name email");

    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    if (withdrawal.status !== "Pending") {
      return res.status(400).json({ message: `Withdrawal already ${withdrawal.status}` });
    }

    withdrawal.status = "Approved";
    withdrawal.processedDate = Date.now();
    await withdrawal.save();

    // Fetch host banking to show what account it was sent to (for the simulation message)
    const banking = await HostBanking.findOne({ hostId: withdrawal.hostId });
    const method = banking ? banking.accountType : "registered account";

    res.json({ 
      message: `${withdrawal.amount} টাকা sent to ${method}`,
      withdrawal 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
