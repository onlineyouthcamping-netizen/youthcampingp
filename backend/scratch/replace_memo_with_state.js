const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the leadGuideName memo block
const memoStartToken = 'const leadGuideName = useMemo(';
const memoIdx = content.indexOf(memoStartToken);

if (memoIdx !== -1) {
  const memoEndIdx = content.indexOf('}, [tripVendors]);', memoIdx) + '}, [tripVendors]);'.length;
  
  const stateAndEffectCode = `const [leadGuideName, setLeadGuideName] = useState("Assign Guide");

  useEffect(() => {
    const lead = tripVendors.find(v => v.vendorType === 'guide');
    if (lead) {
      setLeadGuideName(lead.vendor.name);
    }
  }, [tripVendors]);`;

  content = content.substring(0, memoIdx) + stateAndEffectCode + content.substring(memoEndIdx);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("leadGuideName memo replaced with state successfully!");
} else {
  console.log("leadGuideName memo not found!");
}
