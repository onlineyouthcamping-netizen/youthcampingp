const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Declare state for leadGuideNameState
const leadGuideStateDecl = `  const [leadGuideNameState, setLeadGuideNameState] = useState("Assign Guide");

  useEffect(() => {
    const lead = tripVendors.find(v => v.vendorType === 'guide');
    if (lead) {
      setLeadGuideNameState(lead.vendor.name);
    }
  }, [tripVendors]);`;

// Insert right after useState("") of editGuideName
content = content.replace(
  '  const [editGuideName, setEditGuideName] = useState("");',
  `  const [editGuideName, setEditGuideName] = useState("");\n${leadGuideStateDecl}`
);

// 2. Remove the old leadGuideName useMemo block
const oldMemo = `  // Find lead guide and vehicles from tripVendors
  const leadGuideName = useMemo(() => {
    const lead = tripVendors.find(v => v.vendorType === 'guide');
    return lead ? lead.vendor.name : "Assign Guide";
  }, [tripVendors]);`;

content = content.replace(oldMemo, '');

// 3. Replace all remaining occurrences of leadGuideName with leadGuideNameState
content = content.replace(/leadGuideName/g, 'leadGuideNameState');

// 4. Correct the submit handler to call setLeadGuideNameState
content = content.replace(
  'setLeadGuideNameState(editGuideName);',
  'setLeadGuideNameState(editGuideName);'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("leadGuideName state migration completed successfully!");
