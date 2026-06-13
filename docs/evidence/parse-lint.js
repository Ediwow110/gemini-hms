const fs = require('fs');
const content = fs.readFileSync('docs/evidence/type-h1-lint-baseline-full.txt', 'utf8');
const lines = content.split('\n');
let currentFile = '';
const fileCounts = {};
for (const line of lines) {
  // Check for file header line (path followed by warnings on subsequent lines)
  const headerMatch = line.match(/^D:\\Vscode\\hms-login-OFFICIAL\\(.+\.ts)$/);
  if (headerMatch) {
    currentFile = headerMatch[1];
    continue;
  }
  // Check for inline path with warning
  const inlineMatch = line.match(/^D:\\Vscode\\hms-login-OFFICIAL\\(.+\.ts):\d+:/);
  if (inlineMatch) {
    currentFile = inlineMatch[1];
    if (line.includes('no-unsafe-argument')) {
      fileCounts[currentFile] = (fileCounts[currentFile] || 0) + 1;
    }
    continue;
  }
  // Check if current line is a warning under currentFile
  if (currentFile && line.includes('no-unsafe-argument') && !line.includes('D:\\Vscode')) {
    fileCounts[currentFile] = (fileCounts[currentFile] || 0) + 1;
  }
}
const sorted = Object.entries(fileCounts).sort((a, b) => b[1] - a[1]);
let total = 0;
for (const [f, c] of sorted) {
  console.log(c + '\t' + f);
  total += c;
}
console.log('---\nTOTAL\t' + total);
