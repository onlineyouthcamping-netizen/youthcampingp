const express = require('express');
const app = require('../src/app');

function printRoutes(app) {
  const routes = [];
  
  function getRoutesFromRouter(router, prefix = '') {
    if (router.stack) {
      router.stack.forEach(layer => {
        if (layer.route) {
          const path = prefix + layer.route.path;
          const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
          const middleware = layer.route.stack.map(h => h.name || 'anonymous');
          routes.push({ path, methods, middleware });
        } else if (layer.name === 'router' && layer.handle.stack) {
          let newPrefix = prefix;
          if (layer.regexp) {
            // Reconstruct prefix if possible, or use regexp description
            const match = layer.regexp.toString().match(/^\/\^\\(\/api\\\/[a-z0-9-]+)/);
            if (match) {
              newPrefix = match[1].replace(/\\/g, '');
            } else {
              newPrefix = prefix + '/*';
            }
          }
          getRoutesFromRouter(layer.handle, newPrefix);
        }
      });
    }
  }

  getRoutesFromRouter(app._router);
  return routes;
}

const allRoutes = printRoutes(app);
const target = allRoutes.filter(r => r.path.includes('view') || r.path.includes('documents'));
console.log('Document Routes Stack:', JSON.stringify(target, null, 2));
