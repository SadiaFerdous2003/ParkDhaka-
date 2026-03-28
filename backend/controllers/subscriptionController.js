const Subscription = require("../models/subscription");
const Payment = require("../models/payment");

exports.purchasePass = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { garageSpaceId, price, slotType } = req.body;

    if (!garageSpaceId || !price) {
      return res.status(400).json({ message: "Garage Space ID and Price are required." });
    }

    // Check if user already has an active subscription ANYWHERE (Limit to 1)
    const existingSub = await Subscription.findOne({ user: userId, status: "active", endDate: { $gt: new Date() } });
    if (existingSub) {
      return res.status(400).json({ message: "You already have an active subscription." });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30); // 30 days validity

    const newSubscription = new Subscription({
      user: userId,
      garageSpace: garageSpaceId,
      passType: "monthly",
      slotType: slotType || "Reserved",
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
    // Find all subscriptions for this user
    const subscriptions = await Subscription.find({ user: userId })
      .populate({ path: "garageSpace", populate: { path: "host", select: "name email" } })
      .sort({ endDate: -1 });

    // Auto update expired status
    for (const sub of subscriptions) {
      const isExpired = sub.endDate <= new Date();
      if (isExpired && sub.status === "active") {
        sub.status = "expired";
        await sub.save();
      }
    }

    res.status(200).json({ subscriptions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
