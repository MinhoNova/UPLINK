const sharp = require('sharp');
const fs = require('fs');

async function convert() {
   try {
      await sharp("public/classes/Algeth'ar Academy.svg")
         .webp({ quality: 80 })
         .toFile("public/classes/test_academy.webp");
      console.log("Success! File size:", fs.statSync("public/classes/test_academy.webp").size);
   } catch (e) {
      console.error("Failed:", e.message);
   }
}
convert();
