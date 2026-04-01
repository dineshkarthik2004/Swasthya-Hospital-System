import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const filePath = path.join(__dirname, '..', 'Medicine_List.xlsb');
  console.log('Reading file from:', filePath);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // sheet_to_json with limited rows
  const data = xlsx.utils.sheet_to_json(sheet, { range: 0 }); // headers + data
  
  console.log('Sheet Name:', sheetName);
  if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
    console.log('First 2 rows (parsed):');
    console.log(JSON.stringify(data.slice(0, 2), null, 2));
  } else {
    console.log('No data found in sheet.');
  }
} catch (err) {
  console.error('Error reading xlsb:', err);
  console.error(err.stack);
}
