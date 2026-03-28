import { readFileSync } from 'fs';
import { resolve } from 'path';
import { supabase } from './supabaseClient.js';

async function ingest() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: npm run ingest <file-path> <device-id> <device-name> [brand]');
    console.log('Example: npm run ingest ./manuals/malm.txt IKEA-MALM-AA2301456 "IKEA MALM 6-drawer dresser" IKEA');
    process.exit(1);
  }

  const filePath = args[0];
  const deviceId = args[1];
  // Device name might be split across args if quotes weren't preserved by npm
  // Last arg is brand if it looks like a single word, otherwise it's part of the name
  const lastArg = args[args.length - 1];
  const hasBrand = args.length > 3 && !lastArg.includes(' ') && lastArg.length < 20;
  const brand = hasBrand ? lastArg : null;
  const nameArgs = args.slice(2, hasBrand ? -1 : undefined);
  const deviceName = nameArgs.join(' ');
  const resolvedPath = resolve(filePath);

  // 1. Read manual — supports .txt directly, .pdf via pdf-parse
  let manualText: string;
  if (resolvedPath.endsWith('.pdf')) {
    console.log(`Reading PDF: ${filePath}`);
    const pdfParse = (await import('pdf-parse')).default;
    const pdfBuffer = readFileSync(resolvedPath);
    const pdf = await pdfParse(pdfBuffer);
    manualText = pdf.text;
    console.log(`Extracted ${manualText.length} characters from ${pdf.numpages} pages`);
  } else {
    console.log(`Reading text file: ${filePath}`);
    manualText = readFileSync(resolvedPath, 'utf-8');
    console.log(`Read ${manualText.length} characters`);
  }

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
