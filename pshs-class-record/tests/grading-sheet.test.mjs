import test from 'node:test';
import assert from 'node:assert/strict';
import {schoolDemo} from '../public/school-demo.js';
import {gradingSheetModel,sheetPreview} from '../public/grading-sheet.js';
test('row 28 keeps completed Q1 grade while missing Q2 long test blocks Q2 final',()=>{
 const db=schoolDemo(),c=db.classes[0],q1=gradingSheetModel(db,c,1).rows[27],q2=gradingSheetModel(db,c,2).rows[27];
 assert.equal(q2.name,'Scholar 026, Demo');assert.equal(q1.final,1.5);assert.equal(q2.previous,1.5);assert.equal(q2.final,null);assert.match(q2.reason,/Long Tests 9: missing/);assert.match(sheetPreview(gradingSheetModel(db,c,2)),/Previous quarter: 1.50/);
 const a=db.assignments.find(a=>a.classId===c.id&&a.quarter===2&&a.name==='Long Tests 9');db.scores[a.id][q2.profileId]={score:40,status:'submitted'};
 const fixed=gradingSheetModel(db,c,2).rows[27];assert.equal(fixed.previous,1.5);assert.notEqual(fixed.final,null);assert.equal(fixed.reason,'');
});
