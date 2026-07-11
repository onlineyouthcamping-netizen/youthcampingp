const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Define handlePrintManifest after handleDownloadCSV
const printHandler = `  const handlePrintManifest = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocker prevented printing. Please allow popups.");
      return;
    }
    
    const rowsHtml = allPassengers.map((p, i) => \`
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 10px; text-align: center; font-size: 11px;">\${i + 1}</td>
        <td style="padding: 10px; font-weight: bold; font-size: 11px;">\${p.name}</td>
        <td style="padding: 10px; font-size: 11px;">\${p.bookingId}</td>
        <td style="padding: 10px; font-size: 11px; font-weight: bold; color: #1E293B;">\${p.phone}</td>
        <td style="padding: 10px; font-size: 11px;">\${p.gender} (\${p.age})</td>
        <td style="padding: 10px; font-size: 11px;">\${p.pickupPoint}</td>
        <td style="padding: 10px; font-family: monospace; font-size: 11px; font-weight: bold;">\${p.roomNo}</td>
      </tr>
    \`).join("");

    const manifestHtml = \`
      <html>
        <head>
          <title>Passenger Manifest - \${tripId} (\${departureDateStr})</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 25px; color: #1E293B; }
            table { width: 100%; border-collapse: collapse; margin-top: 25px; border: 1px solid #E2E8F0; }
            th { background-color: #F8FAFC; border-bottom: 2px solid #E2E8F0; padding: 12px 10px; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #475569; text-align: left; }
            h1 { font-size: 22px; margin: 0; font-weight: 800; color: #0F172A; letter-spacing: -0.5px; }
            .header-meta { display: flex; gap: 30px; margin-top: 12px; font-size: 11px; color: #475569; border-bottom: 2px dashed #E2E8F0; padding-bottom: 18px; }
            .meta-item { display: flex; flex-direction: column; gap: 3px; }
            .meta-label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #94A3B8; }
            .meta-val { font-size: 12px; font-weight: bold; color: #0F172A; }
          </style>
        </head>
        <body>
          <h1>DEPARTURE MANIFEST</h1>
          <div class="header-meta">
            <div class="meta-item"><span class="meta-label">Trip Code</span><span class="meta-val">\${tripId}</span></div>
            <div class="meta-item"><span class="meta-label">Itinerary</span><span class="meta-val">\${tripDetails?.title || "Spiti Valley Road Trip"}</span></div>
            <div class="meta-item"><span class="meta-label">Date</span><span class="meta-val">\${departureDateStr}</span></div>
            <div class="meta-item"><span class="meta-label">Tour Lead</span><span class="meta-val">\${leadGuideName}</span></div>
            <div class="meta-item"><span class="meta-label">Pax Count</span><span class="meta-val">\${allPassengers.length} Verified</span></div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">S.No</th>
                <th>Passenger Name</th>
                <th>Booking ID</th>
                <th>Phone Number</th>
                <th>Gender (Age)</th>
                <th>Pickup Point</th>
                <th>Room Allocation</th>
              </tr>
            </thead>
            <tbody>
              \${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    \`;
    printWindow.document.write(manifestHtml);
    printWindow.document.close();
  };`;

content = content.replace(
  '  const handleDownloadCSV = (data: any[], filename: string) => {',
  `${printHandler}\n\n  const handleDownloadCSV = (data: any[], filename: string) => {`
);

// 2. Link handlePrintManifest to Print button
content = content.replace(
  `                  <button\n                    onClick={() => { window.print(); setMoreActionsOpen(false); }}\n                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"\n                  >\n                    Print Manifest\n                  </button>`,
  `                  <button\n                    onClick={() => { handlePrintManifest(); setMoreActionsOpen(false); }}\n                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"\n                  >\n                    Print Manifest\n                  </button>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Print manifest handler added and bound successfully!");
