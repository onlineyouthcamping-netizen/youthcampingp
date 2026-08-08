const { prisma } = require("../lib/prisma");

exports.getVendorContracts = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const contracts = await prisma.vendorContract.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: contracts });
  } catch (error) {
    next(error);
  }
};

exports.createVendorContract = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const {
      destination,
      hotelName,
      roomCategory,
      season,
      twinRate,
      tripleRate,
      quadRate,
      extraBedRate,
      mealPlan,
      cancellationRules,
      startDate,
      endDate,
    } = req.body;

    const contract = await prisma.vendorContract.create({
      data: {
        vendorId,
        destination,
        hotelName,
        roomCategory,
        season,
        twinRate: twinRate ? Number(twinRate) : null,
        tripleRate: tripleRate ? Number(tripleRate) : null,
        quadRate: quadRate ? Number(quadRate) : null,
        extraBedRate: extraBedRate ? Number(extraBedRate) : null,
        mealPlan,
        cancellationRules,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    res.status(201).json({ success: true, data: contract });
  } catch (error) {
    next(error);
  }
};

exports.deleteVendorContract = async (req, res, next) => {
  try {
    const { contractId } = req.params;
    await prisma.vendorContract.delete({
      where: { id: contractId },
    });
    res.json({ success: true, message: "Contract deleted" });
  } catch (error) {
    next(error);
  }
};
