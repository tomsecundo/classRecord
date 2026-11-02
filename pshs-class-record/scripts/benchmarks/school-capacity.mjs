import {performance} from 'node:perf_hooks';
import {schoolDemo} from '../../public/school-demo.js';
import {grade,withGradeCache} from '../../public/grade.js';
import {studentPerformance} from '../../public/student-profile.js';
const start=performance.now(),db=schoolDemo(),generation=performance.now()-start;
let t=performance.now();const results=withGradeCache(db,()=>db.classes.flatMap(c=>c.students.map(id=>grade(db,c,id,2))));const calculation=performance.now()-t;
t=performance.now();withGradeCache(db,()=>studentPerformance(db,db.students[0].id,2,'2026-11-02'));const profile=performance.now()-t;
const bytes=Buffer.byteLength(JSON.stringify(db));
console.log(JSON.stringify({students:db.students.length,teacherLabels:db.teachers.length,sections:24,subjectClasses:db.classes.length,assignments:db.assignments.length,scoreRecords:414720,quarterSubjectGrades:results.length,generationMs:Math.round(generation),allQuarterGradesMs:Math.round(calculation),individualProfileMs:Math.round(profile),jsonBytes:bytes,estimatedEncryptedBase64Bytes:Math.ceil((bytes+16)/3)*4,syncLimitBytes:4000000},null,2));
