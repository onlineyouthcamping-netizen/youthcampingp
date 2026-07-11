const cheerio = require('cheerio');

function sanitizeHtml(html) {
  if (!html) return '';
  const $ = cheerio.load(html, null, false); // Load without adding <html>/<body> wrappers
  
  const allowedTags = new Set([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr', 'blockquote',
    'span', 'div', 'pre', 'code',
    'ul', 'ol', 'li',
    'b', 'i', 'strong', 'em', 'u', 'strike', 'sub', 'sup',
    'a', 'img', 'iframe',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td'
  ]);
  
  const allowedAttributes = {
    'a': ['href', 'title', 'target', 'class'],
    'img': ['src', 'alt', 'title', 'width', 'height', 'class'],
    'iframe': ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'class'],
    'span': ['class', 'style'],
    'div': ['class', 'style'],
    'p': ['class', 'style']
  };

  $('*').each((i, el) => {
    const tagName = el.name.toLowerCase();
    
    // 1. Remove if tag is not allowed
    if (!allowedTags.has(tagName)) {
      $(el).remove();
      return;
    }
    
    // 2. Remove all attributes that are not allowed or have javascript: protocols
    const attrs = el.attribs || {};
    const allowedAttrs = allowedAttributes[tagName] || [];
    
    for (const attrName in attrs) {
      const lowerAttrName = attrName.toLowerCase();
      
      if (lowerAttrName.startsWith('on')) {
        $(el).removeAttr(attrName);
        continue;
      }
      
      if (!allowedAttrs.includes(lowerAttrName) && lowerAttrName !== 'style' && lowerAttrName !== 'class') {
        $(el).removeAttr(attrName);
        continue;
      }
      
      const attrVal = attrs[attrName];
      if ((lowerAttrName === 'href' || lowerAttrName === 'src') && /^\s*(javascript|data):/i.test(attrVal)) {
        $(el).removeAttr(attrName);
      }

      if (lowerAttrName === 'style') {
        const val = attrVal.toLowerCase();
        if (val.includes('javascript:') || val.includes('data:') || val.includes('expression') || val.includes('<script')) {
          $(el).removeAttr(attrName);
        }
      }
      
      if (tagName === 'iframe' && lowerAttrName === 'src') {
        const isSafeVideo = attrVal.includes('youtube.com') || 
                            attrVal.includes('youtu.be') || 
                            attrVal.includes('vimeo.com') ||
                            attrVal.includes('google.com/maps');
        if (!isSafeVideo) {
          $(el).removeAttr(attrName);
        }
      }
    }
  });

  return $.html();
}

module.exports = { sanitizeHtml };
