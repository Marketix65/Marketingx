const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const htmlPath = path.join(__dirname, 'MarketingX-download.html');
const outputDir = path.join(__dirname, 'unpacked');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Extract Manifest
const manifestMatch = htmlContent.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
if (!manifestMatch) {
  console.error('Manifest not found');
  process.exit(1);
}
const manifest = JSON.parse(manifestMatch[1].trim());

// Extract Template
const templateMatch = htmlContent.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
if (!templateMatch) {
  console.error('Template not found');
  process.exit(1);
}
let template = JSON.parse(templateMatch[1].trim());

console.log(`Found ${Object.keys(manifest).length} assets in manifest.`);

// Decompress/write assets
async function unpack() {
  const assetMap = {};
  for (const [uuid, entry] of Object.entries(manifest)) {
    const buffer = Buffer.from(entry.data, 'base64');
    let finalBuffer = buffer;
    if (entry.compressed) {
      finalBuffer = zlib.gunzipSync(buffer);
    }
    
    // Determine a filename/extension from mime type
    let ext = 'bin';
    if (entry.mime === 'text/html') ext = 'html';
    else if (entry.mime === 'text/css') ext = 'css';
    else if (entry.mime === 'application/javascript' || entry.mime === 'text/javascript') ext = 'js';
    else if (entry.mime === 'image/png') ext = 'png';
    else if (entry.mime === 'image/jpeg') ext = 'jpg';
    else if (entry.mime === 'image/svg+xml') ext = 'svg';
    else if (entry.mime === 'application/json') ext = 'json';
    
    const filename = `${uuid}.${ext}`;
    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, finalBuffer);
    console.log(`Wrote ${filename} (MIME: ${entry.mime}, Size: ${finalBuffer.length} bytes)`);
    assetMap[uuid] = { filename, mime: entry.mime };
  }
  
  // Write the template to a file
  fs.writeFileSync(path.join(outputDir, 'template.html'), template);
  console.log('Wrote template.html');
  
  // Save mapping metadata
  fs.writeFileSync(path.join(outputDir, 'mapping.json'), JSON.stringify(assetMap, null, 2));
}

unpack().catch(console.error);
