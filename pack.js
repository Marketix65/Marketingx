const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'MarketingX-download.html');
const templatePath = path.join(__dirname, 'unpacked', 'template.html');

if (!fs.existsSync(templatePath)) {
  console.error('unpacked/template.html not found! Run "node unpack.js" first.');
  process.exit(1);
}

const originalHtml = fs.readFileSync(htmlPath, 'utf8');

// Find the index of <script type="__bundler/template">
const target = '<script type="__bundler/template">';
const idx = originalHtml.indexOf(target);
if (idx === -1) {
  console.error('Template tag not found in MarketingX-download.html');
  process.exit(1);
}

// Slice the HTML up to the start tag (including the start tag itself)
const header = originalHtml.slice(0, idx + target.length);

// Read the modified template
const templateContent = fs.readFileSync(templatePath, 'utf8');

// Escape </script> as <\/script> in JSON string to prevent HTML parser premature closing
const newTemplateJson = JSON.stringify(templateContent).replace(/<\/script>/gi, '<\\/script>');

// Construct the new HTML content
const newHtml = header + newTemplateJson + '\n  </script>\n</body>\n</html>';

// Write it back
fs.writeFileSync(htmlPath, newHtml, 'utf8');
console.log('Successfully repacked MarketingX-download.html!');
