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
  
  // Rule 1: focus:-[var(--color-primary-)] -> focus:ring-[var(--color-primary-500)]
  content = content.replace(/focus:-\[var\(--color-primary-\)\]/g, 'focus:ring-[var(--color-primary-500)]');
  
  // Rule 2: group--[var(--color-primary-)] -> group-hover:text-[var(--color-primary-600)]
  content = content.replace(/group--\[var\(--color-primary-\)\]/g, 'group-hover:text-[var(--color-primary-600)]');
  
  // Rule 3: -[var(--color-primary-)]/20 -> shadow-[var(--color-primary-500)]/20
  content = content.replace(/-\[var\(--color-primary-\)\]\/20/g, 'shadow-[var(--color-primary-500)]/20');
  
  // Rule 4: Border context
  content = content.replace(/border -\[var\(--color-primary-\)\]/g, 'border border-[var(--color-primary-500)]');
  
  // Rule 5: Hover text context (hover--[var... wait, hover:-[var...
  content = content.replace(/hover:-\[var\(--color-primary-\)\]/g, 'hover:bg-[var(--color-primary-700)]');
  
  // Generic replacements based on surrounding text inside className
  // For text context
  content = content.replace(/className="([^"]*)text-(sm|xs|lg|xl)\s+-\[var\(--color-primary-\)\]([^"]*)"/g, 'className="$1text-$2 text-[var(--color-primary-600)]$3"');
  content = content.replace(/className="([^"]*)-\[var\(--color-primary-\)\]\s+font-bold([^"]*)"/g, 'className="$1text-[var(--color-primary-600)] font-bold$2"');
  content = content.replace(/className=\{`text-sm \$\{([^ ]+) \? '-\[var\(--color-primary-\)\] font-bold' : 'text-stone-500'\}`\}/g, 'className={`text-sm ${$1 ? \'text-[var(--color-primary-600)] font-bold\' : \'text-stone-500\'}`}');
  
  // For background contexts (buttons, icons, etc)
  content = content.replace(/className="([^"]*)-\[var\(--color-primary-\)\]\s+text-white([^"]*)"/g, 'className="$1bg-[var(--color-primary-600)] text-white$2"');
  content = content.replace(/className="w-12 h-12 rounded-xl -\[var\(--color-primary-\)\]/g, 'className="w-12 h-12 rounded-xl bg-[var(--color-primary-500)]');
  content = content.replace(/className=\{`font-bold \$\{result\.score >= 7 \? '-\[var\(--color-primary-\)\]' : 'text-red-500'\}`\}/g, 'className={`font-bold ${result.score >= 7 ? \'text-[var(--color-primary-600)]\' : \'text-red-500\'}`}');
  content = content.replace(/color="-\[var\(--color-primary-\)\]"/g, 'color="bg-[var(--color-primary-500)]"');
  
  // Clean up any remaining -[var(--color-primary-)] safely
  content = content.replace(/-\[var\(--color-primary-\)\]/g, 'text-[var(--color-primary-600)]'); // Fallback to text

  if (content !== initialContent) {
    fs.writeFileSync(file, content);
    console.log('Fixed ' + file);
  }
});
console.log('Fix script complete');
