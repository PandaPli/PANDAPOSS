import fs from 'fs';
import path from 'path';

const directoryToSearch = process.cwd();
const searchString = 'RESTAURANTE';
const replaceString = 'RESTAURANTE';

const ignoreDirs = ['node_modules', '.next', '.git', 'prisma', 'public', '.vscode'];
const includeExts = ['.ts', '.tsx', '.js', '.jsx'];

function walkAndReplace(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        walkAndReplace(fullPath);
      }
    } else {
      const ext = path.extname(fullPath);
      if (includeExts.includes(ext)) {
        let content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes(searchString)) {
          content = content.replace(new RegExp(searchString, 'g'), replaceString);
          fs.writeFileSync(fullPath, content, 'utf-8');
          console.log(`Updated: ${fullPath}`);
        }
      }
    }
  }
}

console.log('Starting replacement...');
walkAndReplace(directoryToSearch);
console.log('Replacement finished.');
