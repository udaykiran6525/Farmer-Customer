const fs = require('fs');
const html = fs.readFileSync('frontend/public/farmer-dashboard.html', 'utf8');
const lines = html.split('\n');
lines.forEach((line, index) => {
    if (line.toLowerCase().includes('settings')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
    }
});
