import {grade,gwa,componentResults} from './grade.js';
// Evidence from the selected quarter only; raw-score flags are not grade decisions.
export function studentPerformance(db,id,quarter,today){
 const enrolled=db.classes.filter(c=>c.students.includes(id));
 const subjects=enrolled.map(c=>{
  const outputs=db.assignments.filter(a=>a.classId===c.id&&a.quarter===quarter).map(a=>{
   const r=db.scores[a.id]?.[id],status=r?.status||'unsubmitted',excused=status==='excused',scored=!excused&&Number.isFinite(r?.score),submitted=['submitted','late'].includes(status);
   const percent=scored?r.score/a.points*100:null;
   return {...a,status,score:scored?r.score:null,percent,missing:!excused&&!submitted&&(status==='missing'||!!a.due&&a.due<today),pending:!excused&&!submitted&&status!=='missing'&&(!a.due||a.due>=today),ungraded:submitted&&!scored,low:percent!==null&&percent<60};
  });
  return {class:c,grade:grade(db,c,id,quarter),quarters:[1,2,3,4].map(q=>grade(db,c,id,q).final),components:componentResults(db,c,id,quarter),outputs};
 });
 const outputs=subjects.flatMap(s=>s.outputs);
 return {subjects,gwa:gwa(db,enrolled,id,quarter),missing:outputs.filter(a=>a.missing).length,low:outputs.filter(a=>a.low).length,ungraded:outputs.filter(a=>a.ungraded).length,pending:outputs.filter(a=>a.pending).length};
}
