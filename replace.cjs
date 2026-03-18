const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const initialContent = content;
  
  // Replace all emerald references with primary CSS variables.
  // E.g., bg-emerald-500 -> bg-[var(--color-primary-500)]
  // We match common prefixes like bg, text, border, etc.
  content = content.replace(/(bg|text|border|ring|shadow|hover:bg|hover:text|hover:border|active:bg|active:text)-emerald-([0-9]{2,3})/g, '$1-[var(--color-primary-$2)]');
  
  if (content !== initialContent) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
console.log('Done replacement');
