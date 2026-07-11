const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Change editGuideName initial state
content = content.replace(
  'const [editGuideName, setEditGuideName] = useState(leadGuideName);',
  'const [editGuideName, setEditGuideName] = useState("");'
);

// 2. Insert useEffect to sync editGuideName
const guideMemoEnd = `  const leadGuideName = useMemo(() => {
    const lead = tripVendors.find(v => v.vendorType === 'guide');
    return lead ? lead.vendor.name : "Assign Guide";
  }, [tripVendors]);`;

const guideSyncEffect = `\n\n  useEffect(() => {
    if (leadGuideName) {
      setEditGuideName(leadGuideName);
    }
  }, [leadGuideName]);`;

content = content.replace(guideMemoEnd, guideMemoEnd + guideSyncEffect);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Guide initialization fixed successfully!");
