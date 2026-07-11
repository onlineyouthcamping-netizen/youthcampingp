const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const PageLayoutSchema = new mongoose.Schema({
  name: String,
  sections: Array,
  publishedAt: Date
});
const PageLayout = mongoose.models.PageLayout || mongoose.model('PageLayout', PageLayoutSchema);

async function checkLayout() {
  await mongoose.connect(process.env.MONGODB_URI);
  const layout = await PageLayout.findOne({ name: 'home' });
  if (layout) {
    layout.sections.forEach(s => {
      if (s.type === 'bestie') {
        console.log(`- Bestie ID: ${s.id}, Visible: ${s.visible}`);
        console.log('  Content Reasons:', JSON.stringify(s.content?.reasons, null, 2));
        console.log('  Draft Reasons:', JSON.stringify(s.draft?.reasons, null, 2));
      }
    });
  }
  await mongoose.disconnect();
}

checkLayout().catch(console.error);
