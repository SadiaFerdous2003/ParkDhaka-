const Subscription = require("../models/subscription");
const Payment = require("../models/payment");

exports.purchasePass = async (req, res) => {
  try {
    const userId = req.user.userId;

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
    // Find all active subscriptions that haven't expired
    const subscriptions = await Subscription.find({ 
      user: userId, 
      status: "active", 
      endDate: { $gt: new Date() } 
    }).sort({ startDate: -1 }); // Sort by start date descending
    
    res.status(200).json({ subscriptions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const subscriptionId = req.params.id;

    // Find the subscription and ensure it belongs to the user
    const subscription = await Subscription.findOne({ 
      _id: subscriptionId, 
      user: userId, 
      status: "active" 
    });

    if (!subscription) {
      return res.status(404).json({ message: "Active subscription not found." });
    }

    // Update status to cancelled
    subscription.status = "cancelled";
    await subscription.save();

    res.status(200).json({ message: "Subscription cancelled successfully", subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
