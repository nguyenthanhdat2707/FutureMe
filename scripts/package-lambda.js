const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const buildDir = path.join(rootDir, 'dist');
const stagingDir = path.join(rootDir, 'dist_lambda');
const infraDir = path.join(rootDir, 'infra', 'terraform');
const outputZip = path.join(infraDir, 'lambda.zip');

console.log("Building TypeScript...");
execSync('npm run build', { stdio: 'inherit', cwd: rootDir });

if (!fs.existsSync(infraDir)) {
  fs.mkdirSync(infraDir, { recursive: true });
}

console.log("Preparing staging directory...");
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// Copy dist
execSync(`cp -r dist dist_lambda/dist`, { cwd: rootDir });
// Copy manifests
execSync(`cp package.json package-lock.json dist_lambda/`, { cwd: rootDir });

console.log("Installing production dependencies in staging...");
execSync('npm ci --omit=dev --no-fund --no-audit', { stdio: 'inherit', cwd: stagingDir });

function getDirSize(dirPath) {
  let size = 0;
  if (!fs.existsSync(dirPath)) return 0;
  const files = fs.readdirSync(dirPath);
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(dirPath, files[i]);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      size += getDirSize(filePath);
    } else {
      size += stats.size;
    }
  }
  return size;
}

const totalUncompressed = getDirSize(stagingDir);
console.log(`Uncompressed size: ${totalUncompressed} bytes`);

if (totalUncompressed > 250 * 1024 * 1024) {
  console.error("Error: Uncompressed size exceeds 250 MB Lambda limit.");
  process.exit(1);
}

console.log("Normalizing timestamps for deterministic zip...");
// Use 2026-01-01 00:00:00 as timestamp
execSync('find . -exec touch -t 202601010000.00 {} +', { cwd: stagingDir });

console.log("Zipping...");
if (fs.existsSync(outputZip)) {
  fs.rmSync(outputZip);
}

// zip deterministically
execSync(`find . -mindepth 1 | LC_ALL=C sort | zip -q -9 -X -@ "${outputZip}"`, { cwd: stagingDir });

const compressedSize = fs.statSync(outputZip).size;
console.log(`Lambda ZIP created: ${outputZip}`);
console.log(`Compressed size: ${compressedSize} bytes`);

if (compressedSize > 50 * 1024 * 1024) {
  console.error("Error: Compressed size exceeds 50 MB Lambda limit.");
  process.exit(1);
}
