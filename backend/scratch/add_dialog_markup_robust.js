const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const addPassengerIdx = content.lastIndexOf('addPassengerOpen');
if (addPassengerIdx !== -1) {
  const dialogCloseIdx = content.indexOf('</Dialog>', addPassengerIdx);
  if (dialogCloseIdx !== -1) {
    const enclosingBraceIdx = content.indexOf('}', dialogCloseIdx);
    if (enclosingBraceIdx !== -1) {
      const insertPosition = enclosingBraceIdx + 2; // right after the closing brace + newline
      
      const dialogMarkup = `\n\n      {editHotelOpen && (
        <Dialog open={editHotelOpen} onOpenChange={setEditHotelOpen}>
          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-800">Edit Hotel Stay Details</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Update arrangement, allocation, costs, or booking notes for this stay.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditHotelSubmit} className="space-y-3.5 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Hotel Name</label>
                  <input
                    type="text"
                    required
                    value={hotelNameForm}
                    onChange={e => setHotelNameForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Location / City</label>
                  <input
                    type="text"
                    required
                    value={hotelLocationForm}
                    onChange={e => setHotelLocationForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Room Type</label>
                  <input
                    type="text"
                    value={hotelRoomTypeForm}
                    onChange={e => setHotelRoomTypeForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">No. of Rooms</label>
                  <input
                    type="number"
                    value={hotelRoomsForm}
                    onChange={e => setHotelRoomsForm(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Total Cost (₹)</label>
                  <input
                    type="number"
                    value={hotelCostForm}
                    onChange={e => setHotelCostForm(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Advance Paid (₹)</label>
                  <input
                    type="number"
                    value={hotelPaidForm}
                    onChange={e => setHotelPaidForm(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Confirmation Status</label>
                <select
                  value={hotelConfirmedForm}
                  onChange={e => setHotelConfirmedForm(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none bg-white"
                >
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="UNCONFIRMED">PENDING / UNCONFIRMED</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Notes / Special Instructions</label>
                <textarea
                  value={hotelNotesForm}
                  onChange={e => setHotelNotesForm(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316] h-16 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditHotelOpen(false)}
                  className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 transition-colors"
                >
                  Save Stay Details
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {editTransportOpen && (
        <Dialog open={editTransportOpen} onOpenChange={setEditTransportOpen}>
          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-800">Edit Transport Asset</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Update vehicle details, route, driver profile, or vendor pricing.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditTransportSubmit} className="space-y-3.5 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Vehicle Type</label>
                  <input
                    type="text"
                    required
                    value={vehicleTypeForm}
                    onChange={e => setVehicleTypeForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Seating Capacity</label>
                  <input
                    type="number"
                    value={capacityForm}
                    onChange={e => setCapacityForm(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Route</label>
                <input
                  type="text"
                  required
                  value={routeForm}
                  onChange={e => setRouteForm(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Driver Name</label>
                  <input
                    type="text"
                    value={driverNameForm}
                    onChange={e => setDriverNameForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Driver Phone</label>
                  <input
                    type="text"
                    value={driverPhoneForm}
                    onChange={e => setDriverPhoneForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Total Cost (₹)</label>
                  <input
                    type="number"
                    value={transportCostForm}
                    onChange={e => setTransportCostForm(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Advance Paid (₹)</label>
                  <input
                    type="number"
                    value={transportPaidForm}
                    onChange={e => setTransportPaidForm(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Notes / Special Instructions</label>
                <textarea
                  value={transportNotesForm}
                  onChange={e => setTransportNotesForm(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316] h-16 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTransportOpen(false)}
                  className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 transition-colors"
                >
                  Save Fleet Details
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}`;

      content = content.substring(0, insertPosition) + dialogMarkup + content.substring(insertPosition);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log("Hotel/Transport Dialog markup robustly injected successfully!");
    }
  }
} else {
  console.log("addPassengerOpen not found!");
}
