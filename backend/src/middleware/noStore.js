const CACHEABLE_PUBLIC_GETS = [
  /^\/trips\/public\/cards\/?$/,
  /^\/trips\/public\/slug\/[^/]+\/?$/,
  /^\/blogs\/public\/cards\/?$/,
  /^\/blogs\/public\/slug\/[^/]+\/?$/,
  /^\/reviews\/public\/cards\/?$/,
  /^\/page-builder\/public\/[^/]+\/?$/,
  /^\/settings\/public\/?$/,
  /^\/theme\/public\/?$/,
];

const isCacheablePublicGet = (req) => (
  req.method === 'GET' && CACHEABLE_PUBLIC_GETS.some((pattern) => pattern.test(req.path))
);

const apiNoStore = (req, res, next) => {
  if (isCacheablePublicGet(req)) return next();

  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};

module.exports = { apiNoStore, isCacheablePublicGet };
