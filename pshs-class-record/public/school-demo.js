// Synthetic capacity fixture. No real student records or staff accounts.
export function schoolDemo(){
 const db={version:1,year:'2026–2027',teacher:'Demo Teacher 01',adviserSection:'7-Section A',students:[],classes:[],assignments:[],scores:{},notes:{},teachers:Array.from({length:70},(_,i)=>({id:`t${i}`,name:`Demo Teacher ${String(i+1).padStart(2,'0')}`}))};
 const names=['Mathematics','Integrated Science','English','Filipino','Social Science','Computer Science','Physical Education','Health','Arts','Technology','Research','Values Education'];
 const weights=[{name:'Formative Assessments',weight:25,mode:'formative'},{name:'Long Tests',weight:35,mode:'average'},{name:'Alternative Assessment',weight:40,mode:'average'}];
 for(let level=7;level<=12;level++)for(let section=0;section<4;section++){
  const label=`${level}-Section ${'ABCD'[section]}`,ids=[];
  for(let n=1;n<=30;n++){const id=`demo-${level}-${section}-${n}`;ids.push(id);db.students.push({id,studentId:`DEMO-${level}${section}${String(n).padStart(3,'0')}`,name:`Scholar ${String((level-7)*120+section*30+n).padStart(3,'0')}, Demo`,section:label,sex:n%2?'M':'F',email:''});}
  names.forEach((name,j)=>{const index=db.classes.length,teacherIndex=index%70,c={id:`demo-c${index}`,name:`${name} ${level}`,section:label,gradeLevel:level,units:j<2?1.5:1,base:0,method:'cumulative',teacher:teacherIndex===0?'self':`t${teacherIndex}`,teacherId:`t${teacherIndex}`,schedule:'Mon, Wed · 9:00–10:00',weights:weights.map(w=>({...w})),students:ids};db.classes.push(c);
   for(let q=1;q<=4;q++)for(let k=0;k<12;k++){
    const id=`${c.id}-q${q}-a${k}`,points=k<6?20:k<9?50:100,category=k<6?weights[0].name:k<9?weights[1].name:weights[2].name;
    db.assignments.push({id,classId:c.id,name:`${category} ${k+1}`,category,quarter:q,points,due:`${q===4?2027:2026}-${['08','10','12','03'][q-1]}-${String(5+k).padStart(2,'0')}`,rubric:[]});db.scores[id]={};
    ids.forEach((sid,n)=>{const h=(index*31+n*17+k*7+q*11)%100,missing=q===2&&n%5===0&&h<4,pending=q>=3&&h<12,ungraded=q===2&&n%13===0&&h===7,excused=h===99;db.scores[id][sid]={status:excused?'excused':missing?'missing':pending?'unsubmitted':h<10?'late':'submitted',score:missing||pending||ungraded||excused?null:Math.round(points*(n%10===1?.40+(h%20)/100:n%10===2?.98:.72+(h%28)/100))};});
   }
  });
 }
 return db;
}
