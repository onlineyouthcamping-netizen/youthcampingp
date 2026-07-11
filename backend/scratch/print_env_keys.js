console.log("ENVIRONMENT KEYS:");
for (const key of Object.keys(process.env)) {
  if (key.toLowerCase().includes('supabase') || key.toLowerCase().includes('storage') || key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')) {
    console.log(`${key}: ${process.env[key] ? 'PRESENT (length ' + process.env[key].length + ')' : 'EMPTY'}`);
  }
}
