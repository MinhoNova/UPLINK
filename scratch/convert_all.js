const sharp = require('sharp');
const fs = require('fs');

const dungeons = [
   "Algeth'ar Academy",
   "Magisters Terrace",
   "Maisara Caverns",
   "Nexus-Point Xenas",
   "Pit of Saron",
   "Seat of the Triumvirate",
   "Skyreach",
   "Windrunner Spire"
];

async function convertAll() {
   for (const name of dungeons) {
      const svgPath = `public/classes/${name}.svg`;
      const webpPath = `public/classes/${name}.webp`;
      try {
         if (fs.existsSync(svgPath)) {
            await sharp(svgPath).webp({ quality: 80 }).toFile(webpPath);
            fs.unlinkSync(svgPath); // delete the old massive SVG
            console.log(`Converted ${name}`);
         } else {
            console.log(`File not found: ${svgPath}`);
         }
      } catch (e) {
         console.error(`Failed for ${name}:`, e.message);
      }
   }
   // Also delete test file
   if (fs.existsSync("public/classes/test_academy.webp")) {
      fs.unlinkSync("public/classes/test_academy.webp");
   }
}
convertAll();
