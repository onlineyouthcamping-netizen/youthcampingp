const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function safeWriteFile(targetPath, content) {
  const tempPath = `${targetPath}.tmp`;
  const dir = path.dirname(targetPath);

  // Ensure dir exists
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Write to temp
  fs.writeFileSync(tempPath, content, 'utf8');

  // Syntax check if JS
  if (targetPath.endsWith('.js')) {
    try {
      execSync(`node --check "${tempPath}"`, { stdio: 'pipe' });
    } catch (err) {
      fs.unlinkSync(tempPath);
      throw new Error(`❌ Syntax invalid in ${targetPath}:\n${err.message}`);
    }
  }

  // Atomic swap
  fs.renameSync(tempPath, targetPath);
  console.log(`✅ Safe write: ${targetPath}`);
}

module.exports = { safeWriteFile };
