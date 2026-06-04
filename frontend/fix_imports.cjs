const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fp = path.join(dir, file);
    if (fs.statSync(fp).isDirectory()) {
      replaceInDir(fp);
    } else if (fp.endsWith('.tsx') || fp.endsWith('.ts')) {
      let content = fs.readFileSync(fp, 'utf8');
      
      content = content.replace(/from '\.\.\/\.\.\/\.\.\/components/g, "from '../../components");
      content = content.replace(/from '\.\.\/\.\.\/\.\.\/hooks/g, "from '../../hooks");
      content = content.replace(/from '\.\.\/\.\.\/\.\.\/context/g, "from '../../context");
      content = content.replace(/from '\.\.\/\.\.\/\.\.\/lib/g, "from '../../lib");
      content = content.replace(/from '\.\.\/\.\.\/\.\.\/types/g, "from '../../types");
      
      fs.writeFileSync(fp, content);
    }
  }
}

replaceInDir('./src/pages');
console.log('Fixed imports!');
