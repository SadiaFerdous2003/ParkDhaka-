const Subscription = require("../models/subscription");
const Payment = require("../models/payment");

exports.purchasePass = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Check if user already has an active subscription
    const existingSub = await Subscription.findOne({ user: userId, status: "active", endDate: { $gt: new Date() } });
    if (existingSub) {
      return res.status(400).json({ message: "You already have an active subscription." });
    }

    const price = 5000; // Fixed monthly pass price (e.g. 5000 BDT)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30); // 30 days validity

    const newSubscription = new Subscription({
      user: userId,
      passType: "monthly",
      price,
      startDate,
      endDate,
      status: "active"
    });

    await newSubscription.save();

    const payment = new Payment({
      subscription: newSubscription._id,
      paymentType: "subscription",
      amount: price,
      status: "completed"
    });

    await payment.save();

    res.status(201).json({ message: "Subscription purchased successfully", subscription: newSubscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getMySubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Find active subscription that hasn't expired
    const subscription = await Subscription.findOne({ user: userId, status: "active", endDate: { $gt: new Date() } });
    
    if (!subscription) {
      return res.status(200).json({ hasSubscription: false });
    }

    res.status(200).json({ hasSubscription: true, subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
