const fs = require('fs');
const files = ['frontend/public/index.html', 'frontend/public/products.html', 'frontend/public/farmer-dashboard.html'];
const faviconTag = '<link rel="icon" type="image/svg+xml" href="favicon.svg" />';

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('rel="icon"')) {
      content = content.replace('</head>', `  ${faviconTag}\n</head>`);
      fs.writeFileSync(file, content);
      console.log('Added favicon to ' + file);
    }
  }
}
