export const SCALE = [[96,1],[90,1.25],[84,1.5],[78,1.75],[72,2],[66,2.25],[60,2.5],[55,2.75],[50,3],[40,4],[0,5]];
export function equivalent(percent,base=0) { const scale=base===50?[[98,1],[95,1.25],[92,1.5],[89,1.75],[86,2],[83,2.25],[80,2.5],[77,2.75],[74,3],[70,4],[0,5]]:SCALE; return scale.find(([min])=>percent>min-.01)?.[1] ?? null; }
export function transmute(value) { return [[1.13,1],[1.38,1.25],[1.63,1.5],[1.88,1.75],[2.13,2],[2.38,2.25],[2.63,2.5],[2.88,2.75],[3.5,3],[4.5,4],[5,5]].find(([max])=>value<=max)?.[1]??5; }
export function weightsFor(c,q){return c.quarterWeights?.[q]||c.weights;}
export function componentResults(db,c,student,q) {
 const base=c.quarterBases?.[q]??c.base;
 return weightsFor(c,q).filter(category=>category.weight>0).map(category=>{
  let complete=true;
  const assignments=db.assignments.filter(a=>a.classId===c.id&&a.quarter===q&&a.category===category.name);
  let points=0,total=0,ratios=0,count=0,marked=0;
  for(const a of assignments){const r=db.scores[a.id]?.[student];if(r?.status==='excused')continue;total+=a.points;count++;if(r?.score!=null){points+=r.score;ratios+=r.score/a.points;marked++;}else complete=false;}
  if(!total)return {...category,percent:null,weighted:null,complete:false};
  const ratio=category.mode==='average'?ratios/count:points/total;
  const pct=category.mode==='formative'?40*marked/count+60*points/total:base===50?50+50*ratio:100*ratio;
  return {...category,percent:pct,weighted:pct*category.weight/100,complete};
 });
}
export function tentative(db,c,student,q) {
 const parts=componentResults(db,c,student,q),base=c.quarterBases?.[q]??c.base;
 const covered=parts.filter(p=>p.percent!==null).reduce((s,p)=>s+p.weight,0);
 const percent=parts.reduce((s,p)=>s+(p.weighted??0),0),complete=parts.length>0&&parts.every(p=>p.complete);
 return {percent:covered?percent:null,grade:covered?equivalent(percent,base):null,complete:complete&&Math.abs(covered-100)<.001};
}
export function grade(db,c,student,q) {
 const t=tentative(db,c,student,q);if(t.grade==null)return {...t,final:null,reason:'No assessment data'};
 if(!t.complete)return {...t,final:null,reason:'Incomplete scores or categories'};
 if(q===1||c.method==='independent')return {...t,final:t.grade,reason:''};
 const prev=grade(db,c,student,q-1);if(prev.final==null)return {...t,final:null,reason:'Previous quarter incomplete'};
 return {...t,final:transmute((2*t.grade+prev.final)/3),reason:''};
}
export function gwa(db,classes,student,q){const enrolled=classes.filter(c=>c.students.includes(student));if(!enrolled.length)return null;const values=enrolled.map(c=>({value:grade(db,c,student,q).final,units:c.units}));if(values.some(v=>v.value==null))return null;return values.reduce((s,v)=>s+v.value*v.units,0)/values.reduce((s,v)=>s+v.units,0);}
export function csv(rows){return rows.map(row=>row.map(v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"').join(',')).join('\r\n');}
