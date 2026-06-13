const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

const errorSegment = '                               </div>\n\n<div className="flex flex-col gap-4 mt-4">';
const fixedSegment = '                               </div>\n                            </div>\n\n<div className="flex flex-col gap-4 mt-4">';

if (content.includes(errorSegment)) {
    content = content.replace(errorSegment, fixedSegment);
    console.log('Fixed unclosed Tactical Unit Deployment div');
} else {
    console.log('Error segment not found. Checking variations...');
}

fs.writeFileSync(path, content);
console.log('Manual Tag Alignment Complete');
