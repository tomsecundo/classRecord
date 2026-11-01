import test from 'node:test';
import assert from 'node:assert/strict';
import {equivalent,transmute,tentative,grade,gwa,csv} from '../public/grade.js';
test('Bicol workbook Base 0 and Base 50 boundaries',()=>{
 assert.equal(equivalent(96),1);assert.equal(equivalent(95.99),1.25);assert.equal(equivalent(40),4);assert.equal(equivalent(39.99),5);assert.equal(equivalent(98,50),1);assert.equal(equivalent(97.99,50),1.25);
});
test('Bicol workbook cumulative thresholds include failing grade bands',()=>{
 for(const [v,want] of [[1.13,1],[1.131,1.25],[2.88,2.75],[3.5,3],[3.501,4],[4.5,4],[4.501,5]])assert.equal(transmute(v),want);
});
const c={id:'c',students:['s'],units:1,base:0,method:'cumulative',weights:[{name:'FA',weight:25,mode:'formative'},{name:'LT',weight:75,mode:'average'}]};
const make=()=>({assignments:[{id:'a',classId:'c',quarter:1,category:'FA',points:20},{id:'b',classId:'c',quarter:1,category:'LT',points:50},{id:'b2',classId:'c',quarter:1,category:'LT',points:100}],scores:{a:{s:{score:10,status:'submitted'}},b:{s:{score:40,status:'submitted'}},b2:{s:{score:100,status:'submitted'}}}});
test('formative completion plus score; equal assessment percentage weights',()=>{const db=make();const g=tentative(db,c,'s',1);assert.equal(g.percent,85);assert.equal(g.grade,1.5);assert.equal(g.complete,true);assert.equal(grade(db,c,'s',1).final,1.5);});
test('blank scores stay incomplete, zero is a real grade, excused excluded',()=>{const db=make();db.scores.a.s.score=null;assert.equal(grade(db,c,'s',1).final,null);db.scores.a.s.score=0;assert.equal(tentative(db,c,'s',1).percent,77.5);assert.equal(tentative(db,c,'s',1).complete,true);db.scores.b2.s={score:null,status:'excused'};assert.equal(tentative(db,c,'s',1).percent,70);});
test('all-excused component does not invent a grade',()=>{const db=make();db.scores.a.s.status='excused';assert.equal(grade(db,c,'s',1).final,null);});
test('quarter calculation uses previous final, not raw percentage',()=>{const db=make();db.assignments.push(...db.assignments.map(a=>({...a,id:a.id+'q2',quarter:2})));for(const a of db.assignments.filter(a=>a.quarter===2))db.scores[a.id]={s:{score:a.points,status:'submitted'}};assert.equal(grade(db,c,'s',2).final,1.25);assert.equal(grade(db,c,'s',3).final,null);});
test('missing earlier quarter blocks cumulative final',()=>{const db=make();db.assignments.forEach(a=>a.quarter=2);assert.equal(grade(db,c,'s',2).reason,'Previous quarter incomplete');});
test('GWA uses enrolled subject units and requires all final grades',()=>{const db=make();const c2={...c,id:'d',units:2};db.assignments.push({id:'d1',classId:'d',quarter:1,category:'FA',points:10},{id:'d2',classId:'d',quarter:1,category:'LT',points:10});db.scores.d1={s:{score:10,status:'submitted'}};db.scores.d2={s:{score:10,status:'submitted'}};assert.equal(gwa(db,[c,c2],'s',1),(1.5+2)/3);db.scores.d2.s.score=null;assert.equal(gwa(db,[c,c2],'s',1),null);});
test('CSV quotes names and neutralizes formula injection',()=>{assert.equal(csv([['Cruz, Ana','0012','=1+1','a"b']]),'"Cruz, Ana","0012","\'=1+1","a""b"');});
