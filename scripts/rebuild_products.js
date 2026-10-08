const fs = require('fs');
const s = fs.readFileSync('frontend/public/script.js', 'utf8');
const p = fs.readFileSync('frontend/public/products.js', 'utf8');

const uniqueP = p.split('\n').slice(0, 197).join('\n');
const sharedMatch = s.match(/(function openAuthModal.*?)(?=\n*document\.addEventListener\(['"]DOMContentLoaded['"])/s);
const bottomP = `document.addEventListener("DOMContentLoaded", async () => {
  initCatalogPlaceholder();
  await fetchCatalogProducts();
  const token = getToken();
  if (token) {
    const d = await apiRequest('/api/auth/me');
    if (d.success) { currentUser = d.user; updateNavForUser(currentUser); loadCart(); }
  }
  console.log('%c📦 Farmigo Catalog Page Loaded!', 'color:#f97316;font-size:1.2rem;font-weight:bold;');
});`;

fs.writeFileSync('frontend/public/products.js', uniqueP + '\n\n' + sharedMatch[1] + '\n\n' + bottomP);
