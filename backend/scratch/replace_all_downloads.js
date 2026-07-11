const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Itinerary tab Download
content = content.replace(
  'onClick={() => toast.info("Download Itinerary")}',
  'onClick={() => handleDownloadCSV(itineraryList, "itinerary_details.csv")}'
);

// 2. Passengers tab Download
content = content.replace(
  `<button className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5">\n                  <Download className="w-3.5 h-3.5 text-slate-400" /> Download\n                </button>`,
  `<button onClick={() => handleDownloadCSV(allPassengers, "passengers_manifest.csv")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5">\n                  <Download className="w-3.5 h-3.5 text-slate-400" /> Download\n                </button>`
);

// 3. Hotels tab Download
content = content.replace(
  'onClick={() => toast.info("Download")}\n                  className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs"',
  'onClick={() => handleDownloadCSV(tripVendors.filter(v => v.vendorType === "hotel"), "hotels_reservations.csv")}\n                  className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs"'
);

// 4. Transport tab Download
// Let's do it in a general way for the remaining ones
const downloadReplacements = [
  {
    target: 'onClick={() => toast.info("Download")}\n                  className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs"',
    replacement: 'onClick={() => handleDownloadCSV(tripVendors.filter(v => v.vendorType === "transport"), "transport_fleet.csv")}\n                  className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs"'
  }
];

// Let's do exact replacements for specific blocks
content = content.replace(
  'onClick={() => toast.info("Download")}\n                  className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs"',
  'onClick={() => handleDownloadCSV(tripVendors.filter(v => v.vendorType === "transport"), "transport_fleet.csv")}\n                  className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs"'
);

// Let's search and replace remaining toast.info("Download") strings by their contexts
// Guides tab Download:
content = content.replace(
  'onClick={() => toast.info("Download")}\n                  className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs"',
  'onClick={() => handleDownloadCSV(tripVendors.filter(v => v.vendorType === "guide"), "guide_payments.csv")}\n                  className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs"'
);

// Activities tab Download:
content = content.replace(
  'onClick={() => toast.info("Download")}\n                  className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs"',
  'onClick={() => handleDownloadCSV(computedActivities, "activities_list.csv")}\n                  className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs"'
);

// Payments tab Download:
content = content.replace(
  '<button className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-slate-400" /> Download</button>',
  '<button onClick={() => handleDownloadCSV(computedPayments, "payments_log.csv")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-slate-400" /> Download</button>'
);

// Tasks tab Download:
content = content.replace(
  '<button className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-slate-400" /> Download</button>',
  '<button onClick={() => handleDownloadCSV(computedTasks, "checklist_tasks.csv")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-slate-400" /> Download</button>'
);

// Documents tab Download:
content = content.replace(
  '<button className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-slate-400" /> Download</button>',
  '<button onClick={() => handleDownloadCSV(computedDocuments, "documents_catalog.csv")} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-slate-400" /> Download</button>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("All replacements completed successfully!");
