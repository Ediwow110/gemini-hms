const fs = require('fs');
const file = 'hms-frontend/src/portals/lab/TurnaroundMonitorPage.tsx';
let content = fs.readFileSync(file, 'utf8');
const oldStr = `  const overallAvgMinutes = data
    ? data.metrics
        .filter((m) => m.field === 'specimenToRelease' && m.averageMinutes !== null)
        .reduce((_, m) => m.averageMinutes || 0, 0)
    : null;`;
const oldStrCRLF = `  const overallAvgMinutes = data\r\n    ? data.metrics\r\n        .filter((m) => m.field === 'specimenToRelease' && m.averageMinutes !== null)\r\n        .reduce((_, m) => m.averageMinutes || 0, 0)\r\n    : null;`;
const newStr = `  const overallAvgMinutes = data\n    ? data.metrics.find((m) => m.field === 'specimenToRelease')?.averageMinutes ?? null\n    : null;`;
const newStrCRLF = `  const overallAvgMinutes = data\r\n    ? data.metrics.find((m) => m.field === 'specimenToRelease')?.averageMinutes ?? null\r\n    : null;`;

if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
} else if (content.includes(oldStrCRLF)) {
    content = content.replace(oldStrCRLF, newStrCRLF);
} else {
    console.error("String not found!");
    process.exit(1);
}
fs.writeFileSync(file, content);
console.log("Replaced successfully!");
