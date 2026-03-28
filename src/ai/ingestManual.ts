import { readFileSync } from 'fs';
import { resolve } from 'path';
import pdfParse from 'pdf-parse';
import { supabase } from './supabaseClient.js';

async function ingest() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: npm run ingest <pdf-path> <device-id> <device-name> [brand]');
    console.log('Example: npm run ingest ./manuals/malm.pdf IKEA-MALM-AA2301456 "IKEA MALM 6-drawer dresser" IKEA');
    process.exit(1);
  }

  const [pdfPath, deviceId, deviceName, brand] = args;

  // 1. Read and parse PDF
  console.log(`Reading PDF: ${pdfPath}`);
  const pdfBuffer = readFileSync(resolve(pdfPath));
  const pdf = await pdfParse(pdfBuffer);
  const manualText = pdf.text;
  console.log(`Extracted ${manualText.length} characters from ${pdf.numpages} pages`);

  // 2. Upsert device with manual text
  const { error } = await supabase
    .from('devices')
    .upsert({
      id: deviceId,
      name: deviceName,
      brand: brand ?? null,
      manual_text: manualText,
    });

  if (error) {
    console.error('Failed to save:', error.message);
    process.exit(1);
  }

  console.log(`Saved device "${deviceName}" (${deviceId}) with ${manualText.length} chars of manual text`);
}

ingest();
