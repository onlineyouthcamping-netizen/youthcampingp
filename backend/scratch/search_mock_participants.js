const { execSync } = require('child_process');

try {
  const output = execSync('git log -S MOCK_PARTICIPANTS -p -n 1', { encoding: 'utf8' });
  console.log(output);
} catch (err) {
  console.error(err);
}
