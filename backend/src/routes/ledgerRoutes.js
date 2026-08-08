const express = require("express");
const router = express.Router();
const ledgerCtrl = require("../controllers/ledgerController");

router.get("/", ledgerCtrl.getLedgerEntries);
router.post("/", ledgerCtrl.createLedgerEntry);

module.exports = router;
