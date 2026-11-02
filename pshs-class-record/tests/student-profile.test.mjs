import test from 'node:test';
import assert from 'node:assert/strict';
import {studentPerformance} from '../public/student-profile.js';
const subject={id:'c',name:'Science',students:['s'],units:1,base:0,weights:[{name:'Work',weight:100,mode:'points'}]};
function fixture(){return {classes:[subject,{...subject,id:'other',students:['other']}],assignments:[],scores:{}};}
function add(db,id,status,score,due='2026-01-01',quarter=1){db.assignments.push({id,classId:'c',category:'Work',points:10,due,quarter});db.scores[id]={s:{status,score}};}
test('profile distinguishes missing, future work, awaiting marking, zero scores and excused work',()=>{
 const db=fixture();add(db,'missing','missing',null);add(db,'future','unsubmitted',null,'2026-12-01');add(db,'ungraded','submitted',null);add(db,'zero','submitted',0);add(db,'excused','excused',0);add(db,'later','missing',null,'2026-01-01',2);
 const p=studentPerformance(db,'s',1,'2026-11-02');assert.equal(p.subjects.length,1);assert.equal(p.missing,1);assert.equal(p.pending,1);assert.equal(p.ungraded,1);assert.equal(p.low,1);assert.equal(p.gwa,null);assert.equal(p.subjects[0].outputs.length,5);assert.equal(p.subjects[0].outputs.find(a=>a.id==='excused').score,null);
});
test('profile includes only enrolled subjects and uses calculated quarter grades for GWA',()=>{
 const db=fixture();add(db,'full','submitted',10);const p=studentPerformance(db,'s',1,'2026-11-02');assert.equal(p.gwa,1);assert.equal(p.subjects[0].quarters[0],1);assert.equal(p.subjects[0].components[0].weighted,100);assert.equal(p.subjects[0].quarters[1],null);assert.equal(studentPerformance(db,'unknown',1,'2026-11-02').subjects.length,0);
});
test('overdue unsubmitted work is missing but submitted late work is not',()=>{const db=fixture();add(db,'overdue','unsubmitted',null);add(db,'late','late',5);const p=studentPerformance(db,'s',1,'2026-11-02');assert.equal(p.missing,1);assert.equal(p.low,1);assert.equal(p.pending,0);});
