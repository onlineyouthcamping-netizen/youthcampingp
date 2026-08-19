| Controller | Referenced in routes | Status |
|-----------|---------------------|--------|
| `auditController.js` | yes | USED |
| `couponController.js` | yes | USED |
| `creditController.js` | yes | USED |
| `routePricingController.js` | yes | USED |
| `serviceRegistryController.js` | yes | USED |
| `taskAllotmentController.js` | yes | USED |
| `travelDeskCoreController.js` | yes | USED |

Notes:
- `auditController.js`, `couponController.js`, `creditController.js`, `serviceRegistryController.js`, and `taskAllotmentController.js` are imported in `backend/src/routes/financeRoutes.js`.
- `routePricingController.js` is imported in both `backend/src/routes/tripRoutes.js` and `backend/src/routes/vendorRoutes.js`.
- `travelDeskCoreController.js` is imported in `backend/src/routes/travelDeskRoutes.js`.
