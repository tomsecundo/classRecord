import fs from 'node:fs/promises';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load('outputs/grading-sheet/quarter-2.xlsx'));
console.log((await wb.inspect({kind:'table',range:'Grading Sheet!J20:N22',include:'values,formulas',tableMaxRows:3,tableMaxCols:5})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?',options:{useRegex:true,maxResults:10}})).ndjson);
const img=await wb.render({sheetName:'Grading Sheet',range:'A1:N34',scale:1});
await fs.writeFile('outputs/grading-sheet/excel-preview.png',new Uint8Array(await img.arrayBuffer()));
