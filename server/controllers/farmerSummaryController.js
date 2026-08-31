const Crop = require('../models/Crop');
const Order = require('../models/Order');

const LOW_STOCK_LIMIT = 5;

// @desc    Get marketplace sales and inventory summary for the authenticated farmer
// @route   GET /api/farmer-summary
// @access  Private (farmer)
exports.getFarmerMarketplaceSummary = async (req, res) => {
  try {
    const farmerId = req.user?.id || req.user?._id;
    const [crops, orders] = await Promise.all([
      Crop.find({ farmerId }).sort({ createdAt: -1 }),
      Order.find({ 'items.farmerId': farmerId }).sort({ createdAt: -1 }),
    ]);

    const cropPerformance = new Map(
      crops.map((crop) => [
        String(crop._id),
        {
          cropId: crop._id,
          cropName: crop.name,
          unit: crop.unit,
          unitsSold: 0,
          currentStock: crop.quantity,
          currentPrice: crop.price,
          revenue: 0,
        },
      ])
    );

    let unitsSold = 0;
    let totalRevenue = 0;
    let completedOrders = 0;
    let pendingOrders = 0;
    const recentOrders = [];

    for (const order of orders) {
      const farmerItems = order.items.filter((item) => String(item.farmerId) === String(farmerId));
      const isCancelled = order.status === 'cancelled';

      if (order.status === 'delivered') completedOrders += 1;
      if (!isCancelled && order.status !== 'delivered') pendingOrders += 1;

      for (const item of farmerItems) {
        recentOrders.push({
          orderId: order._id,
          orderNumber: order.orderNumber,
          cropId: item.cropId,
          cropName: item.name,
          quantity: item.quantity,
          unit: item.unit,
          amount: item.subtotal,
          status: order.status,
          createdAt: order.createdAt,
        });

        if (isCancelled) continue;

        unitsSold += item.quantity;
        totalRevenue += item.subtotal;

        const performance = cropPerformance.get(String(item.cropId));
        if (performance) {
          performance.unitsSold += item.quantity;
          performance.revenue += item.subtotal;
        }
      }
    }

    return res.json({
      success: true,
      sales: {
        totalRevenue,
        totalOrders: orders.length,
        unitsSold,
        completedOrders,
        pendingOrders,
      },
      inventory: {
        totalListedCrops: crops.length,
        lowStockCrops: crops.filter((crop) => crop.quantity > 0 && crop.quantity <= LOW_STOCK_LIMIT).length,
        outOfStockCrops: crops.filter((crop) => crop.quantity <= 0).length,
      },
      cropPerformance: Array.from(cropPerformance.values()),
      recentOrders: recentOrders.slice(0, 10),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
