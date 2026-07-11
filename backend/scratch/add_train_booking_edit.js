const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Inject Train Booking States and Handlers
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

// Insert train states right above print manifest handler
content = content.replace(
  '  const handlePrintManifest = () => {',
  `${trainStates}\n\n  const handlePrintManifest = () => {`
);

// 2. Replace hardcoded <tbody> of Train Bookings
const oldTrainTable = `                  <tbody className="divide-y divide-[#E2E8F0]">
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-center border-r border-slate-100"><CalendarCheck className="w-4 h-4 text-slate-400" /></td>
                      <td className="p-3 border-r border-slate-100">
                        <p className="font-bold text-slate-800">14416 / SHATABDI EXP</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5 font-mono">PNR: 2456 7890 1234</p>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-bold text-slate-800">Amritsar (ASR)</p>
                            <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">Ahmedabad (ADI)</p>
                          </div>
                          <span className="text-slate-400">→</span>
                        </div>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <p className="font-bold text-slate-855">04:10 PM</p>
                        <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">ASR</p>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <p className="font-bold text-slate-855">09:45 PM</p>
                        <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">ADI</p>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <p className="font-bold text-slate-800">13 Jul 2027</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Sun</p>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <p className="font-bold text-slate-800">57 / 60</p>
                        <p className="text-[9.5px] text-slate-400 font-bold">Confirmed</p>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <span className="text-[8.5px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider block w-fit">CONFIRMED</span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <select className="h-7 text-[10px] font-bold border border-slate-200 rounded-[4px] px-1.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                            <option>View</option>
                          </select>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>`;

const newTrainTable = `                  <tbody className="divide-y divide-[#E2E8F0]">
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

// Check index of oldTrainTable using index matching to avoid line endings matching issues
const trainTableIdx = content.indexOf('14416 / SHATABDI EXP');
if (trainTableIdx !== -1) {
  const tbodyStart = content.lastIndexOf('<tbody', trainTableIdx);
  const tbodyEnd = content.indexOf('</tbody>', trainTableIdx) + '</tbody>'.length;
  if (tbodyStart !== -1 && tbodyEnd !== -1) {
    content = content.substring(0, tbodyStart) + newTrainTable + content.substring(tbodyEnd);
    console.log("Train table tbody replaced successfully!");
  }
} else {
  console.log("Train table target string not found!");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Train states and bindings injected successfully!");
