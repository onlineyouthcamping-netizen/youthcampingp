const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dirs = ['frontend', 'ADMIN-PANEL', 'backend'];
dirs.forEach(d => {
  const fullPath = path.join('d:\\os', d);
  try {
    const remote = execSync('git config --get remote.origin.url', { cwd: fullPath, encoding: 'utf8' }).trim();
    console.log(`Git Remote for ${d}: ${remote}`);
  } catch (e) {
    console.log(`Git Remote for ${d}: Error / None`);
  }
});
