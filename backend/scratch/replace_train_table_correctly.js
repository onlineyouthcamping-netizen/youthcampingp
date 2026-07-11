const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Declare Train Booking States and Handlers
const trainStates = `  // Train Booking States
  const [trainBookings, setTrainBookings] = useState(() => {
    const key = \`train_bookings_\${tripId}_\${departureDateStr}\`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: "train-1",
        trainName: "14416 / SHATABDI EXP",
        pnr: "2456 7890 1234",
        from: "Amritsar (ASR)",
        to: "Ahmedabad (ADI)",
        depTime: "04:10 PM",
        arrTime: "09:45 PM",
        depStation: "ASR",
        arrStation: "ADI",
        date: "13 Jul 2027",
        dayWd: "Sun",
        seats: "57 / 60",
        status: "CONFIRMED"
      }
    ];
  });

  const [editTrainOpen, setEditTrainOpen] = useState(false);
  const [selectedTrainId, setSelectedTrainId] = useState("");
  const [trainNameForm, setTrainNameForm] = useState("");
  const [trainPnrForm, setTrainPnrForm] = useState("");
  const [trainFromForm, setTrainFromForm] = useState("");
  const [trainToForm, setTrainToForm] = useState("");
  const [trainDepTimeForm, setTrainDepTimeForm] = useState("");
  const [trainArrTimeForm, setTrainArrTimeForm] = useState("");
  const [trainDateForm, setTrainDateForm] = useState("");
  const [trainSeatsForm, setTrainSeatsForm] = useState("");
  const [trainStatusForm, setTrainStatusForm] = useState("CONFIRMED");

  const handleOpenEditTrain = (train: any) => {
    setSelectedTrainId(train.id);
    setTrainNameForm(train.trainName);
    setTrainPnrForm(train.pnr);
    setTrainFromForm(train.from);
    setTrainToForm(train.to);
    setTrainDepTimeForm(train.depTime);
    setTrainArrTimeForm(train.arrTime);
    setTrainDateForm(train.date);
    setTrainSeatsForm(train.seats);
    setTrainStatusForm(train.status);
    setEditTrainOpen(true);
  };

  const handleEditTrainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = trainBookings.map((t: any) => {
      if (t.id === selectedTrainId) {
        return {
          ...t,
          trainName: trainNameForm,
          pnr: trainPnrForm,
          from: trainFromForm,
          to: trainToForm,
          depTime: trainDepTimeForm,
          arrTime: trainArrTimeForm,
          date: trainDateForm,
          seats: trainSeatsForm,
          status: trainStatusForm
        };
      }
      return t;
    });
    setTrainBookings(updated);
    localStorage.setItem(\`train_bookings_\${tripId}_\${departureDateStr}\`, JSON.stringify(updated));
    toast.success("Train booking details updated successfully!");
    setEditTrainOpen(false);
  };`;

content = content.replace(
  '  const handlePrintManifest = () => {',
  `${trainStates}\n\n  const handlePrintManifest = () => {`
);

// 2. Locate Train Bookings list section comment and replace its tbody
const trainListStartIdx = content.indexOf('{/* Train Bookings list */}');
if (trainListStartIdx !== -1) {
  const tbodyStartIdx = content.indexOf('<tbody', trainListStartIdx);
  const tbodyEndIdx = content.indexOf('</tbody>', tbodyStartIdx);
  
  if (tbodyStartIdx !== -1 && tbodyEndIdx !== -1) {
    const fullTbodyEndIdx = tbodyEndIdx + '</tbody>'.length;
    
    const newTrainTableTbody = `<tbody className="divide-y divide-[#E2E8F0]">
                    {trainBookings.map((train: any) => (
                      <tr key={train.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 text-center border-r border-slate-100"><CalendarCheck className="w-4 h-4 text-slate-400" /></td>
                        <td className="p-3 border-r border-slate-100">
                          <p className="font-bold text-slate-800">{train.trainName}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5 font-mono">PNR: {train.pnr}</p>
                        </td>
                        <td className="p-3 border-r border-slate-100">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-bold text-slate-800">{train.from}</p>
                              <p className="text-[9.5px] text-slate-450 font-semibold mt-0.5">{train.to}</p>
                            </div>
                            <span className="text-slate-400">→</span>
                          </div>
                        </td>
                        <td className="p-3 border-r border-slate-100">
                          <p className="font-bold text-slate-855">{train.depTime}</p>
                          <p className="text-[9.5px] text-slate-450 font-semibold mt-0.5">{train.depStation || "DEP"}</p>
                        </td>
                        <td className="p-3 border-r border-slate-100">
                          <p className="font-bold text-slate-855">{train.arrTime}</p>
                          <p className="text-[9.5px] text-slate-450 font-semibold mt-0.5">{train.arrStation || "ARR"}</p>
                        </td>
                        <td className="p-3 border-r border-slate-100">
                          <p className="font-bold text-slate-800">{train.date}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{train.dayWd || "Sun"}</p>
                        </td>
                        <td className="p-3 border-r border-slate-100">
                          <p className="font-bold text-slate-800">{train.seats}</p>
                          <p className="text-[9.5px] text-slate-400 font-bold">Booked</p>
                        </td>
                        <td className="p-3 border-r border-slate-100">
                          <span className={\`text-[8.5px] font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider block w-fit border \${
                            train.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }\`}>{train.status}</span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleOpenEditTrain(train)}
                            className="text-[11px] font-bold text-[#F97316] border border-[#F97316]/20 rounded-[4px] px-3 py-1 bg-[#F97316]/5 hover:bg-[#F97316]/10 transition-colors"
                          >
                            Edit Train
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>`;
                  
    content = content.substring(0, tbodyStartIdx) + newTrainTableTbody + content.substring(fullTbodyEndIdx);
    console.log("Train bookings table replaced successfully!");
  }
}

// 3. Inject Edit Train Dialog JSX Markup
const transportDialogIdx = content.lastIndexOf('editTransportOpen');
if (transportDialogIdx !== -1) {
  const dialogCloseIdx = content.indexOf('</Dialog>', transportDialogIdx);
  if (dialogCloseIdx !== -1) {
    const enclosingBraceIdx = content.indexOf('}', dialogCloseIdx);
    if (enclosingBraceIdx !== -1) {
      const insertPosition = enclosingBraceIdx + 2;
      
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
}

