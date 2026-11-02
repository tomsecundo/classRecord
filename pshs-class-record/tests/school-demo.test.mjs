import test from 'node:test';
import assert from 'node:assert/strict';
import {schoolDemo} from '../public/school-demo.js';
import {grade,withGradeCache} from '../public/grade.js';
import {studentPerformance} from '../public/student-profile.js';
test('school fixture covers six grades, 720 students, 70 teacher labels and four full quarters',()=>{
 const db=schoolDemo();assert.equal(db.students.length,720);assert.equal(db.teachers.length,70);assert.equal(db.classes.length,288);assert.equal(db.assignments.length,13824);assert.equal(Object.values(db.scores).reduce((n,x)=>n+Object.keys(x).length,0),414720);
 for(let g=7;g<=12;g++)assert.equal(db.students.filter(s=>s.section.startsWith(g+'-')).length,120);
 assert.equal(db.classes.filter(c=>c.students.includes(db.students[0].id)).length,12);
 const c=db.classes[0],id=c.students[0],expected=grade(db,c,id,2);
 assert.deepEqual(withGradeCache(db,()=>grade(db,c,id,2)),expected);
 withGradeCache(db,()=>{const p=studentPerformance(db,id,2,'2026-11-02');assert.equal(p.subjects.length,12);assert.equal(p.subjects[0].outputs.length,12);});
 // Cache ends with each operation: a later edit must be reflected.
 const a=db.assignments.find(a=>a.classId===c.id&&a.quarter===1);db.scores[a.id][id]={status:'submitted',score:0};
 assert.deepEqual(withGradeCache(db,()=>grade(db,c,id,1)),grade(db,c,id,1));
});
