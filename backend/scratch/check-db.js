const mongoose = require('mongoose');
const Page = require('../src/models/Page');

async function checkPages() {
  try {
    await mongoose.connect('mongodb+srv://parthyouthcamping_db_user:YouthCamp2026%21@cluster0.hnvatqo.mongodb.net/youthcamping?retryWrites=true&w=majority&appName=Cluster0');
    const ps = await Page.find();
    console.log('--- PAGES IN DB ---');
    ps.forEach(p => {
      console.log(`Slug: ${p.slug} | ID: ${p._id} | Status: ${p.status} | Sections: ${p.sections?.length || 0}`);
    });
    console.log('-------------------');
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkPages();
