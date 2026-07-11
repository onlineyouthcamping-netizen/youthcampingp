const dns = require('dns');

dns.resolve4('admin.youthcamping.online', (err, addresses) => {
  if (err) console.error("DNS Error admin:", err);
  else console.log("admin.youthcamping.online IP:", addresses);
});

dns.resolve4('api.youthcamping.online', (err, addresses) => {
  if (err) console.error("DNS Error api:", err);
  else console.log("api.youthcamping.online IP:", addresses);
});
