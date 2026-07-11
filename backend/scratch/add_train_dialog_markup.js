const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const transportDialogIdx = content.lastIndexOf('editTransportOpen');
if (transportDialogIdx !== -1) {
  const dialogCloseIdx = content.indexOf('</Dialog>', transportDialogIdx);
  if (dialogCloseIdx !== -1) {
    const enclosingBraceIdx = content.indexOf('}', dialogCloseIdx);
    if (enclosingBraceIdx !== -1) {
      const insertPosition = enclosingBraceIdx + 2; // right after the closing brace
      
      const trainDialogMarkup = `\n\n      {editTrainOpen && (
        <Dialog open={editTrainOpen} onOpenChange={setEditTrainOpen}>
          <DialogContent className="max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-800">Edit Train Booking details</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Update train name, PNR number, routing stations, schedules, or booked seats.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditTrainSubmit} className="space-y-3.5 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Train Name / No.</label>
                  <input
                    type="text"
                    required
                    value={trainNameForm}
                    onChange={e => setTrainNameForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">PNR Number</label>
                  <input
                    type="text"
                    required
                    value={trainPnrForm}
                    onChange={e => setTrainPnrForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">From (Station)</label>
                  <input
                    type="text"
                    required
                    value={trainFromForm}
                    onChange={e => setTrainFromForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">To (Station)</label>
                  <input
                    type="text"
                    required
                    value={trainToForm}
                    onChange={e => setTrainToForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Departure Time</label>
                  <input
                    type="text"
                    required
                    value={trainDepTimeForm}
                    onChange={e => setTrainDepTimeForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Arrival Time</label>
                  <input
                    type="text"
                    required
                    value={trainArrTimeForm}
                    onChange={e => setTrainArrTimeForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Date</label>
                  <input
                    type="text"
                    required
                    value={trainDateForm}
                    onChange={e => setTrainDateForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Booked Seats</label>
                  <input
                    type="text"
                    required
                    value={trainSeatsForm}
                    onChange={e => setTrainSeatsForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Status</label>
                <select
                  value={trainStatusForm}
                  onChange={e => setTrainStatusForm(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-none bg-white"
                >
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTrainOpen(false)}
                  className="text-xs font-bold border border-slate-200 rounded-[4px] px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-5 py-2 transition-colors"
                >
                  Save Train Details
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
`;

      content = content.substring(0, insertPosition) + trainDialogMarkup + content.substring(insertPosition);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log("Train edit dialog markup injected successfully!");
    }
  }
} else {
  console.log("editTransportOpen dialog not found!");
}
