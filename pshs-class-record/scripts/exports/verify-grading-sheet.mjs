import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {gradingSheetModel,generatePdf,generateXlsx} from '../../public/grading-sheet.js';
const require=createRequire(import.meta.url);
const PDFLib=require('/Users/tomsecundo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdf-lib');
const sandbox={console,setTimeout,clearTimeout,setImmediate,clearImmediate,Buffer,Uint8Array,ArrayBuffer,TextEncoder,TextDecoder,Promise,Date};sandbox.global=sandbox;sandbox.window=sandbox;sandbox.self=sandbox;
vm.runInNewContext(await fs.readFile('public/vendor/exceljs.min.js','utf8'),sandbox);
const ExcelJS=sandbox.ExcelJS;
const c={id:'c',name:'Computer Science 4',section:'10-Photon',students:[],base:0,units:1,method:'cumulative',weights:[{name:'Formative Assessments',weight:25,mode:'formative'},{name:'Long Test 1',weight:25,mode:'average'},{name:'Long Test 2',weight:25,mode:'average'},{name:'Alternative Assessment',weight:25,mode:'average'}]};
const db={year:'2026–2027',teacher:'Tom Jordan G. Secundo',classes:[c],students:[],assignments:[],scores:{}};
for(let i=0;i<31;i++){const id='s'+i;c.students.push(id);db.students.push({id,studentId:'TEST-'+String(i+1).padStart(4,'0'),name:i===0?'Dela Cruz, María Isabel':'Sample Student '+String(i+1).padStart(2,'0'),sex:i<15?'M':'F'});}
for(let q=1;q<=4;q++)c.weights.forEach((w,k)=>{const a={id:`a${q}-${k}`,classId:'c',quarter:q,category:w.name,points:100};db.assignments.push(a);db.scores[a.id]=Object.fromEntries(c.students.map((s,i)=>[s,{status:'submitted',score:70+(i+k+q)%30}]));});
const assets={pshs:await fs.readFile('public/branding/pshs.jpg'),dost:await fs.readFile('public/branding/dost.jpg')};
const options={teacher:db.teacher,adviser:'Sample Class Adviser',unitHead:'Sample Unit Head',cidChief:'Sample CID Chief',documentCode:'R-07-CID(CS)-203B',paper:'legal',demo:true};
for(const q of [1,2]){const m=gradingSheetModel(db,c,q,options);assert.equal(m.rows.length,31);assert.equal(m.rows[0].previous,q===1?null:gradingSheetModel(db,c,1,options).rows[0].final);const pdf=await generatePdf(m,PDFLib,assets);await fs.writeFile(`outputs/grading-sheet/quarter-${q}.pdf`,pdf);const bytes=await generateXlsx(m,ExcelJS,assets);await fs.writeFile(`outputs/grading-sheet/quarter-${q}.xlsx`,bytes);const check=new ExcelJS.Workbook();await check.xlsx.load(bytes);const sheet=check.worksheets[0];assert.equal(sheet.getCell('A6').value,'G R A D I N G   S H E E T');assert.equal(sheet.getCell('C20').value.result,m.rows[0].components[0].weighted);assert.equal(sheet.getCell('N20').value.result,m.rows[0].final);assert.equal((await PDFLib.PDFDocument.load(pdf)).getPageCount(),1);console.log(`Q${q}: PDF one page, XLSX component/final values verified; ${m.rows.length} students`);}
// Pagination is checked with a larger roster and non-Legal paper.
const m=gradingSheetModel(db,c,2,{...options,paper:'a4-landscape'});m.rows=[...m.rows,...m.rows,...m.rows];const multi=await generatePdf(m,PDFLib,assets);const count=(await PDFLib.PDFDocument.load(multi)).getPageCount();assert.ok(count>1);await fs.writeFile('outputs/grading-sheet/multipage.pdf',multi);console.log(`93-student landscape PDF: ${count} pages`);
// An incomplete score must never turn into a final grade in either export model.
db.scores['a2-0'].s0.score=null;const incomplete=gradingSheetModel(db,c,2,options);assert.equal(incomplete.rows.find(r=>r.id==='TEST-0001').final,null);assert.equal(incomplete.incomplete,1);console.log('Incomplete-grade withholding verified');
