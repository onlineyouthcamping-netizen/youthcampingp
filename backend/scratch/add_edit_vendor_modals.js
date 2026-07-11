const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add id and rawAssignment to computedHotels
content = content.replace(
  `          amt: v.agreedCost?.toLocaleString('en-IN') || "0",
          amtSub: \`Paid: ₹\${v.paidAmount?.toLocaleString('en-IN') || 0}\`
        };`,
  `          amt: v.agreedCost?.toLocaleString('en-IN') || "0",
          amtSub: \`Paid: ₹\${v.paidAmount?.toLocaleString('en-IN') || 0}\`,
          id: v.id,
          rawAssignment: v
        };`
);

// 2. Add Form States and Submission Handlers
const formStatesAndHandlers = `  // Hotel Edit States
  const [editHotelOpen, setEditHotelOpen] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [hotelNameForm, setHotelNameForm] = useState("");
  const [hotelLocationForm, setHotelLocationForm] = useState("");
  const [hotelRoomTypeForm, setHotelRoomTypeForm] = useState("");
  const [hotelRoomsForm, setHotelRoomsForm] = useState(1);
  const [hotelCostForm, setHotelCostForm] = useState(0);
  const [hotelPaidForm, setHotelPaidForm] = useState(0);
  const [hotelConfirmedForm, setHotelConfirmedForm] = useState("UNCONFIRMED");
  const [hotelNotesForm, setHotelNotesForm] = useState("");

  // Transport Edit States
  const [editTransportOpen, setEditTransportOpen] = useState(false);
  const [selectedTransportId, setSelectedTransportId] = useState("");
  const [vehicleTypeForm, setVehicleTypeForm] = useState("");
  const [capacityForm, setCapacityForm] = useState(13);
  const [routeForm, setRouteForm] = useState("");
  const [driverNameForm, setDriverNameForm] = useState("");
  const [driverPhoneForm, setDriverPhoneForm] = useState("");
  const [transportCostForm, setTransportCostForm] = useState(0);
  const [transportPaidForm, setTransportPaidForm] = useState(0);
  const [transportNotesForm, setTransportNotesForm] = useState("");

  const handleOpenEditHotel = (row: any) => {
    const raw = row.rawAssignment || {};
    setSelectedHotelId(row.id);
    setHotelNameForm(raw.hotelName || row.hotel || "");
    setHotelLocationForm(raw.location || row.sub || "");
    setHotelRoomTypeForm(raw.roomType || row.type || "Deluxe Stay");
    setHotelRoomsForm(raw.numberOfRooms || 1);
    setHotelCostForm(raw.totalAmount || 0);
    setHotelPaidForm(raw.advancePaid || 0);
    setHotelConfirmedForm(raw.confirmed || (row.status === "CONFIRMED" ? "CONFIRMED" : "UNCONFIRMED"));
    setHotelNotesForm(raw.notes || "");
    setEditHotelOpen(true);
  };

  const handleOpenEditTransport = (row: any) => {
    const raw = row.rawAssignment || {};
    setSelectedTransportId(row.id);
    setVehicleTypeForm(raw.vehicleType || row.type || "");
    setCapacityForm(raw.capacity || 13);
    setRouteForm(raw.route || "");
    setDriverNameForm(raw.driverName || "");
    setDriverPhoneForm(raw.driverPhone || "");
    setTransportCostForm(raw.totalAmount || 0);
    setTransportPaidForm(raw.advancePaid || 0);
    setTransportNotesForm(raw.notes || "");
    setEditTransportOpen(true);
  };

  const handleEditHotelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(\`/ops/hotels/\${tripId}?departureDate=\${departureDateStr}\`, {
        id: selectedHotelId,
        hotelName: hotelNameForm,
        location: hotelLocationForm,
        roomType: hotelRoomTypeForm,
        numberOfRooms: hotelRoomsForm,
        totalAmount: hotelCostForm,
        advancePaid: hotelPaidForm,
        confirmed: hotelConfirmedForm,
        notes: hotelNotesForm
      });
      toast.success("Hotel details updated successfully!");
      setEditHotelOpen(false);
      // Refresh
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update hotel details.");
    }
  };

  const handleEditTransportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(\`/ops/transport/\${tripId}?departureDate=\${departureDateStr}\`, {
        id: selectedTransportId,
        vehicleType: vehicleTypeForm,
        capacity: capacityForm,
        route: routeForm,
        driverName: driverNameForm,
        driverPhone: driverPhoneForm,
        totalAmount: transportCostForm,
        advancePaid: transportPaidForm,
        notes: transportNotesForm
      });
      toast.success("Transport details updated successfully!");
      setEditTransportOpen(false);
      // Refresh
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update transport details.");
    }
  };`;

// Insert form states and handlers right above the render section
content = content.replace(
  '  const handlePrintManifest = () => {',
  `${formStatesAndHandlers}\n\n  const handlePrintManifest = () => {`
);

// 3. Replace Hotels table action cell with Edit button
const oldHotelActionCell = `                      <td className="p-3 text-center">
                        {row.status === "PENDING" ? (
                          <button onClick={() => toast.info("Booking flow")} className="text-[11px] font-bold text-blue-600 border border-blue-200 rounded-[4px] px-2.5 py-1 bg-white hover:bg-blue-50">Book Now</button>
                        ) : (
                          <div className="flex justify-center">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>`;

const newHotelActionCell = `                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleOpenEditHotel(row)}
                          className="text-[11px] font-bold text-[#F97316] border border-[#F97316]/20 rounded-[4px] px-3 py-1 bg-[#F97316]/5 hover:bg-[#F97316]/10 transition-colors"
                        >
                          Edit Stay
                        </button>
                      </td>`;

content = content.replace(oldHotelActionCell, newHotelActionCell);

// 4. Replace Transport table action cell with Edit button
const oldTransportActionCell = `                        <td className="p-3 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            <select className="h-7 text-[10px] font-bold border border-slate-200 rounded-[4px] px-1.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
                              <option>View</option>
                            </select>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>`;

const newTransportActionCell = `                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleOpenEditTransport(row)}
                            className="text-[11px] font-bold text-[#F97316] border border-[#F97316]/20 rounded-[4px] px-3 py-1 bg-[#F97316]/5 hover:bg-[#F97316]/10 transition-colors"
                          >
                            Edit Fleet
                          </button>
                        </td>`;

content = content.replace(oldTransportActionCell, newTransportActionCell);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Hotel/Transport Edit controls injected successfully!");
