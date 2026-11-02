import {grade,componentResults,weightsFor,SCALE} from './grade.js';
export const QUARTERS=['FIRST','SECOND','THIRD','FOURTH'];
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(n,d=3)=>n==null?'':n.toFixed(d);
export function gradingSheetModel(db,c,q,settings={}){
 const components=weightsFor(c,q).filter(w=>w.weight>0);
 const rows=c.students.map(id=>{const s=db.students.find(s=>s.id===id);if(!s)throw Error('A roster entry is missing its student profile.');const g=grade(db,c,id,q),previous=q>1?grade(db,c,id,q-1).final:null;const present=g.complete?g.grade:null;return {profileId:s.id,id:s.studentId,name:s.name,sex:({M:'MALE',MALE:'MALE',F:'FEMALE',FEMALE:'FEMALE'})[String(s.sex||'').toUpperCase()]||'',components:componentResults(db,c,id,q),total:g.percent,present,previous,raw:g.final==null?null:q===1?present:(2*present+previous)/3,final:g.final,reason:g.reason};});
 rows.sort((a,b)=>((a.sex==='MALE'?0:a.sex==='FEMALE'?1:2)-(b.sex==='MALE'?0:b.sex==='FEMALE'?1:2))||a.name.localeCompare(b.name,'en'));
 const incomplete=rows.filter(r=>r.final==null).length;
 return {subject:c.name,section:c.section,quarter:q,year:db.year,teacher:settings.teacher||db.teacher,adviser:settings.adviser||'',unitHead:settings.unitHead||'',cidChief:settings.cidChief||'',documentCode:settings.documentCode||'',paper:settings.paper||'legal',components,rows,incomplete,draft:incomplete>0||!rows.length||!!settings.demo||rows.some(r=>/^DEMO-/.test(r.id)),base:c.quarterBases?.[q]??c.base};
}
export function groupedRows(model){let last=null;const out=[];const grouped=model.rows.some(r=>r.sex);model.rows.forEach((row,i)=>{const label=grouped?(row.sex||'SEX NOT SPECIFIED'):'STUDENTS';if(label!==last){out.push({group:label});last=label;}out.push({...row,number:i+1});});return out;}
export function sheetPreview(m){return `<article class="official-sheet"><header><img src="/branding/pshs.jpg" alt="Philippine Science High School logo"><div>Republic of the Philippines<br><strong class="dost-name">Department of Science and Technology</strong><br>PHILIPPINE SCIENCE HIGH SCHOOL — BICOL REGION CAMPUS<br><small>Tagongtong, Goa, Camarines Sur 4422</small><h2>G R A D I N G &nbsp; S H E E T</h2>School Year ${escape(m.year)}</div><img src="/branding/dost.jpg" alt="Department of Science and Technology logo"></header><div class="sheet-context"><div class="grading-key"><strong>Grading System · Base ${m.base}</strong><div>${scale(m).map(([label,value])=>`<div><span>${label}</span><b>${value.toFixed(2)}</b></div>`).join('')}</div></div><dl><dt>Subject</dt><dd>${escape(m.subject)}</dd><dt>Class Adviser</dt><dd>${escape(m.adviser)||'____________________'}</dd><dt>Year & Section</dt><dd>${escape(m.section)}</dd><dt>Grading Period</dt><dd>${QUARTERS[m.quarter-1]} QUARTER</dd></dl></div>${m.draft?`<p class="sheet-draft">DRAFT${m.incomplete?` · ${m.incomplete} student grade(s) incomplete`:''}</p>`:''}<table class="official-table"><thead><tr><th rowspan="2">Name of Student</th>${m.components.map(c=>`<th colspan="2">${escape(c.name)}<br><b>${c.weight}%</b></th>`).join('')}<th rowspan="2">Total</th><th rowspan="2">Pres.<br>Grade</th><th rowspan="2">Prev.<br>Grade</th><th colspan="2">Final Grade</th></tr><tr>${m.components.map(()=>'<th>%</th><th>Weighted</th>').join('')}<th>Total</th><th>Stanine</th></tr></thead><tbody>${groupedRows(m).map(r=>r.group?`<tr class="student-group"><td colspan="${6+m.components.length*2}">${r.group}</td></tr>`:`<tr><td>${r.number}. <button class="student-link" data-profile="${escape(r.profileId)}">${escape(r.name)}</button></td>${r.components.map(c=>`<td>${num(c.percent)}${!c.complete?'*':''}</td><td>${num(c.weighted)}</td>`).join('')}<td>${num(r.total)}</td><td>${num(r.present,2)}</td><td>${m.quarter===1?'N/A':num(r.previous,2)}</td><td>${num(r.raw)}</td><td>${r.final==null?'INC':num(r.final,2)}</td></tr>`).join('')}</tbody></table><p class="sheet-footnote">* Provisional component. INC: incomplete grade. Q1 has no previous grade. Generated values reflect the current class record.</p><div class="sheet-signatures"><section>Prepared by:<div class="signature-space"></div><strong>${escape(m.teacher)||'________________________'}</strong><br>Subject Teacher<br>Date: __________________</section><section>Checked and Approved by:<div class="signature-space"></div><strong>${escape(m.unitHead)||'________________________'}</strong><br>Unit Head<br>Date: __________________</section><section>Counterchecked and Approved E-Based System Data:<div class="signature-space"></div><strong>${escape(m.cidChief)||'________________________'}</strong><br>Curriculum and Instruction Division Chief<br>Date: __________________</section></div><footer>${escape(m.documentCode)}<br>Re: Grading Sheet, ${QUARTERS[m.quarter-1]} Quarter, SY ${escape(m.year)}</footer></article>`;}
function scale(m){const mins=m.base===50?[98,95,92,89,86,83,80,77,74,70,0]:SCALE.map(s=>s[0]);return mins.map((min,i)=>[i===10?`Below ${mins[9]}`:i===0?`${min} – 100`:`${min} – ${(mins[i-1]-.01).toFixed(2)}`,SCALE[i][1]]);}
export const filename=(m,ext)=>`${m.section}-${m.subject}-Q${m.quarter}-${m.year}${m.draft?'-DRAFT':''}.${ext}`.replace(/[<>:"/\\|?*\x00-\x1f]/g,'-');
export function saveDownload(bytes,name,type){const url=URL.createObjectURL(new Blob([bytes],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}
export async function generatePdf(m,PDFLib,assets){
 const {PDFDocument,StandardFonts,rgb}=PDFLib,pdf=await PDFDocument.create();pdf.setTitle(`${m.subject} · ${QUARTERS[m.quarter-1]} QUARTER grading sheet`);pdf.setAuthor(m.teacher);
 const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold),italic=await pdf.embedFont(StandardFonts.HelveticaOblique);
 const logos=await Promise.all([pdf.embedJpg(assets.pshs),pdf.embedJpg(assets.dost)]);
 const dimensions=m.paper==='a4-landscape'?[841.89,595.28]:m.paper==='a4'?[595.28,841.89]:[612,1008];
 const [W,H]=dimensions,margin=28,area=W-margin*2,n=m.components.length;
 const nameWidth=area*.27,numeric=(area-nameWidth)/(n*2+5),widths=[nameWidth,...Array(n*2+5).fill(numeric)],xs=[margin];widths.forEach(w=>xs.push(xs.at(-1)+w));
 const fs=Math.min(8.2,Math.max(6.5,numeric/4.5)),rowHeight=fs*1.7,black=rgb(0,0,0),blue=rgb(0,.1,.45);
 let page,y,pageNo=0;const allPages=[];
 const clean=s=>String(s??'').replace(/\u2011/g,'-');
 function text(s,x,top,size=9,face=font,color=black){page.drawText(clean(s),{x,y:H-top-size,size,font:face,color});}
 function center(s,left,top,width,size=9,face=font,color=black){text(s,left+(width-face.widthOfTextAtSize(clean(s),size))/2,top,size,face,color);}
 function wrap(s,width,size=fs,face=font){const words=clean(s).split(/\s+/),lines=[];let line='';for(const word of words){if(face.widthOfTextAtSize((line?line+' ':'')+word,size)>width&&line){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines.length?lines:[''];}
 function fit(s,width,size=fs,face=font){return Math.min(size,width/Math.max(face.widthOfTextAtSize(clean(s),1),1));}
 function rect(x,top,w,h){page.drawRectangle({x,y:H-top-h,width:w,height:h,borderWidth:.45,borderColor:black});}
 function line(x1,top,x2){page.drawLine({start:{x:x1,y:H-top},end:{x:x2,y:H-top},thickness:.4,color:black});}
 function header(){page=pdf.addPage([W,H]);allPages.push(page);pageNo++;
  page.drawImage(logos[0],{x:margin+4,y:H-85,width:64,height:57});page.drawImage(logos[1],{x:W-margin-60,y:H-81,width:55,height:55});
  center('Republic of the Philippines',margin,26,area,10);center('Department of Science and Technology',margin,40,area,9,bold,blue);center('PHILIPPINE SCIENCE HIGH SCHOOL — BICOL REGION CAMPUS',margin,54,area,Math.min(9,area/65));center('Tagongtong, Goa, Camarines Sur 4422',margin,68,area,8);
  center('G R A D I N G   S H E E T',margin,H<700?81:91,area,14,bold,rgb(.8,.56,0));center(`School Year ${m.year}`,margin,H<700?101:112,area,9);
  rect(margin,H<700?120:134,area*.39,H<700?77:91);center(`Grading System · Base ${m.base}`,margin,H<700?122:138,area*.39,8,bold);
  scale(m).forEach(([range,g],i)=>{const col=i<6?0:1,row=i<6?i:i-6,x=margin+7+col*area*.19;text(range,x,(H<700?135:153)+row*(H<700?9:10),6.8,font,rgb(0,.45,.15));text(g.toFixed(2),x+area*.145,(H<700?135:153)+row*(H<700?9:10),6.8,font,blue);});
  const metaX=margin+area*.47,metaWidth=area*.53;[['Subject',m.subject],['Class Adviser',m.adviser||'____________________'],['Year & Section',m.section],['Grading Period',QUARTERS[m.quarter-1]+' QUARTER']].forEach(([label,value],i)=>{text(label,metaX,(H<700?125:146)+i*(H<700?15:17),8);text(value,metaX+72,(H<700?125:146)+i*(H<700?15:17),fit(value,metaWidth-72,8,bold),bold,blue);});
  if(m.draft)text(`DRAFT${m.incomplete?' · '+m.incomplete+' incomplete grade(s)':''}`,margin,H<700?202:232,8,bold,rgb(.65,.16,.12));
  y=H<700?216:248;const headerHeight=44;
  rect(margin,y,nameWidth,headerHeight);center('Name of Student',margin,y+17,nameWidth,8,bold);
  m.components.forEach((c,i)=>{const x=xs[1+i*2],w=numeric*2;rect(x,y,w,headerHeight-12);const lines=wrap(c.name,w-5,7,bold);lines.slice(0,2).forEach((t,j)=>center(t,x,y+3+j*8,w,fit(t,w-4,7,bold),bold));center(c.weight+'%',x,y+21,w,8,bold,blue);['%','Weighted'].forEach((t,j)=>{rect(x+j*numeric,y+32,numeric,12);center(t,x+j*numeric,y+34,numeric,6.3);});});
  ['Total','Pres. Grade','Prev. Grade'].forEach((label,i)=>{const x=xs[1+n*2+i];rect(x,y,numeric,headerHeight);wrap(label,numeric-3,7).forEach((t,j)=>center(t,x,y+12+j*9,numeric,7));});
  const last=xs[4+n*2];rect(last,y,numeric*2,24);center('Final Grade',last,y+8,numeric*2,7,bold);['Total','Stanine'].forEach((t,i)=>{rect(last+i*numeric,y+24,numeric,20);center(t,last+i*numeric,y+31,numeric,6.8);});y+=headerHeight;
 }
 header();const reserve=200;const rows=groupedRows(m);
 for(let index=0;index<rows.length;index++){const row=rows[index];const names=row.group?[]:wrap(`${row.number}. ${row.name}`,nameWidth-7);const height=row.group?16:Math.max(rowHeight,names.length*(fs+2)+4);if(y+height>H-margin-(H<700?30:reserve)){header();if(!row.group){rect(margin,y,area,16);text(`${row.sex||'STUDENTS'} (continued)`,margin+5,y+3,8,bold,blue);y+=16;}}
  if(row.group){rect(margin,y,area,height);text(row.group,margin+5,y+3,8,bold,blue);}else{const cells=[null,...row.components.flatMap(c=>[num(c.percent)+(c.percent!=null&&!c.complete?'*':''),num(c.weighted)]),num(row.total),num(row.present,2),m.quarter===1?'N/A':num(row.previous,2),num(row.raw),row.final==null?'INC':num(row.final,2)];cells.forEach((value,i)=>{rect(xs[i],y,widths[i],height);if(i===0)names.forEach((t,j)=>text(t,xs[i]+4,y+3+j*(fs+2),fit(t,nameWidth-7),font));else center(value,xs[i],y+(height-fs)/2-1,widths[i],fit(value,widths[i]-3,fs),font,(i===cells.length-1||i>0&&i<=n*2&&i%2===0)?blue:black);});}y+=height;
 }
 if(!m.rows.length){rect(margin,y,area,22);center('No enrolled students',margin,y+6,area,9);y+=22;}
 if(y+190>H-margin){page=pdf.addPage([W,H]);allPages.push(page);center(m.subject+' · '+m.section+' · '+QUARTERS[m.quarter-1]+' QUARTER',margin,30,area,10,bold);y=65;}
 y+=9;text('* Provisional component. INC = incomplete. Q1 previous grade is not applicable.',margin,y,7,italic);y+=23;
 function signature(x,top,width,label,name,role){text(label,x,top,8,italic);line(x+12,top+33,x+width-12);center(name||'________________________',x,top+38,width,fit(name||'________________________',width,8,bold),bold);center(role,x,top+50,width,8);text('Date: ____________________',x+12,top+65,8);}
 signature(margin,y,area*.43,'Prepared by:',m.teacher,'Subject Teacher');signature(margin+area*.57,y,area*.43,'Checked and Approved by:',m.unitHead,'Unit Head');y+=91;
 center('Counterchecked and Approved E-Based System Data:',margin,y,area,8,italic);line(margin+area*.3,y+27,margin+area*.7);center(m.cidChief||'________________________',margin,y+31,area,8,bold);center('Curriculum and Instruction Division Chief',margin,y+43,area,8);center('Date: ____________________',margin,y+56,area,8);
 // On short paper, reserve enough room for all three signature blocks.
 allPages.forEach((p,i)=>{page=p;text(m.documentCode,margin,H-24,7);text(`Re: Grading Sheet, Q${m.quarter}, SY ${m.year}`,margin,H-14,7);text(`Page ${i+1} of ${allPages.length}`,W-margin-63,H-14,7);});
 return pdf.save();
}
function conversionFormula(cell,base){const mins=base===50?[98,95,92,89,86,83,80,77,74,70]:SCALE.slice(0,10).map(x=>x[0]);return mins.reduceRight((s,min,i)=>`IF(${cell}>${(min-.01).toFixed(2)},${SCALE[i][1]},${s})`,'5');}
function finalFormula(cell){return [[1.13,1],[1.38,1.25],[1.63,1.5],[1.88,1.75],[2.13,2],[2.38,2.25],[2.63,2.5],[2.88,2.75],[3.5,3],[4.5,4]].reduceRight((s,[max,g])=>`IF(${cell}<=${max},${g},${s})`,'5');}
export async function generateXlsx(m,ExcelJS,assets){
 const book=new ExcelJS.Workbook();book.creator=m.teacher;book.created=new Date();book.calcProperties.fullCalcOnLoad=true;
 const n=m.components.length,end=6+n*2,sheet=book.addWorksheet('Grading Sheet',{views:[{showGridLines:false}],pageSetup:{paperSize:m.paper==='legal'?5:9,orientation:m.paper==='a4-landscape'?'landscape':'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:.25,right:.25,top:.25,bottom:.3,header:.1,footer:.1},printTitlesRow:'1:18'}});
 sheet.getColumn(1).width=36;for(let i=2;i<=end;i++)sheet.getColumn(i).width=8.5;
 const merge=(r,c,r2,c2,value,style={})=>{if(r!==r2||c!==c2)sheet.mergeCells(r,c,r2,c2);const cell=sheet.getCell(r,c);cell.value=value;cell.font={name:'Arial',size:10,...style};cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};return cell;};
 const border={top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}};
 for(let r=1;r<200;r++)sheet.getRow(r).height=15;
 merge(1,2,1,end-1,'Republic of the Philippines');merge(2,2,2,end-1,'Department of Science and Technology',{bold:true,color:{argb:'FF0000FF'}});merge(3,2,3,end-1,'PHILIPPINE SCIENCE HIGH SCHOOL — BICOL REGION CAMPUS');merge(4,2,4,end-1,'Tagongtong, Goa, Camarines Sur 4422');merge(6,1,6,end,'G R A D I N G   S H E E T',{size:16,bold:true,color:{argb:'FFE7AC00'}});sheet.getRow(6).height=24;merge(7,1,7,end,`School Year ${m.year}`);
 const toBase64=bytes=>{let s='';for(const b of new Uint8Array(bytes))s+=String.fromCharCode(b);return btoa(s);};
 const left=book.addImage({base64:'data:image/jpeg;base64,'+toBase64(assets.pshs),extension:'jpeg'}),right=book.addImage({base64:'data:image/jpeg;base64,'+toBase64(assets.dost),extension:'jpeg'});sheet.addImage(left,{tl:{col:0,row:0},ext:{width:72,height:64}});sheet.addImage(right,{tl:{col:end-1,row:0},ext:{width:60,height:60}});
 merge(9,1,9,4,`Grading System · Base ${m.base}`,{bold:true,color:{argb:'FFE7AC00'}});scale(m).forEach(([range,g],i)=>{const r=10+i%6,c=i<6?1:3;sheet.getCell(r,c).value=range;sheet.getCell(r,c+1).value=g;sheet.getCell(r,c+1).numFmt='0.00';sheet.getCell(r,c).font={name:'Arial',size:9,color:{argb:'FF009C35'}};sheet.getCell(r,c+1).font={name:'Arial',size:9,color:{argb:'FF0000FF'}};});
 const metaStart=Math.max(6,end-5);[['Subject',m.subject],['Class Adviser',m.adviser||'____________________'],['Year & Section',m.section],['Grading Period',QUARTERS[m.quarter-1]+' QUARTER']].forEach(([label,value],i)=>{merge(10+i,metaStart,10+i,metaStart+1,label);merge(10+i,metaStart+2,10+i,end,value,{bold:true,color:{argb:'FF002060'}});});
 merge(16,1,16,end,m.draft?`DRAFT${m.incomplete?' · '+m.incomplete+' incomplete grade(s)':''}`:'',{bold:true,color:{argb:'FFB33A2F'}});
 merge(17,1,18,1,'Name of Student',{bold:true});sheet.getRow(17).height=32;sheet.getRow(18).height=20;
 m.components.forEach((c,i)=>{merge(17,2+i*2,17,3+i*2,c.name);merge(18,2+i*2,18,3+i*2,c.weight/100,{color:{argb:'FF0000FF'}}).numFmt='0%';});
 const total=2+n*2,present=total+1,prev=total+2,raw=total+3,final=total+4;
 [['Total',total],['Pres. Grade',present],['Prev. Grade',prev]].forEach(([label,col])=>merge(17,col,18,col,label));merge(17,raw,17,final,'Final Grade');sheet.getCell(18,raw).value='Total';sheet.getCell(18,final).value='Stanine';
 for(let r=17;r<=18;r++)for(let c=1;c<=end;c++){sheet.getCell(r,c).border=border;sheet.getCell(r,c).alignment={horizontal:'center',vertical:'middle',wrapText:true};}
 let row=19;for(const item of groupedRows(m)){if(item.group){merge(row,1,row,end,item.group,{bold:true,color:{argb:'FF002060'}});for(let c=1;c<=end;c++)sheet.getCell(row,c).border=border;row++;continue;}
  sheet.getRow(row).height=20;sheet.getCell(row,1).value=`${item.number}. ${item.name}`;const contributions=[];
  item.components.forEach((c,i)=>{const col=2+i*2,rawCell=sheet.getCell(row,col),weightedCell=sheet.getCell(row,col+1);rawCell.value=c.percent;rawCell.numFmt='0.000';if(c.percent!=null){weightedCell.value={formula:`${rawCell.address}*${sheet.getCell(18,col).address.replace(/(\d+)/,'$$$1')}`,result:c.weighted};contributions.push(weightedCell.address);}weightedCell.numFmt='0.000';weightedCell.font={name:'Arial',size:9,color:{argb:'FF0000FF'}};if(!c.complete)rawCell.note='Provisional component: required scores are incomplete.';});
  sheet.getCell(row,total).value=item.total==null?null:{formula:`SUM(${contributions.join(',')})`,result:item.total};
  sheet.getCell(row,present).value=item.present==null?null:{formula:conversionFormula(sheet.getCell(row,total).address,m.base),result:item.present};
  sheet.getCell(row,prev).value=m.quarter===1?'N/A':item.previous;
  sheet.getCell(row,raw).value=item.raw==null?null:{formula:m.quarter===1?sheet.getCell(row,present).address:`(2*${sheet.getCell(row,present).address}+${sheet.getCell(row,prev).address})/3`,result:item.raw};
  sheet.getCell(row,final).value=item.final==null?'INC':{formula:m.quarter===1?sheet.getCell(row,present).address:finalFormula(sheet.getCell(row,raw).address),result:item.final};
  for(let col=1;col<=end;col++){const cell=sheet.getCell(row,col);cell.border=border;cell.font={name:'Arial',size:9,...cell.font};cell.alignment={horizontal:col===1?'left':'center',vertical:'middle',wrapText:col===1};if(col>=total)cell.numFmt=(col===total||col===raw)?'0.000':'0.00';}row++;
 }
 merge(row+1,1,row+1,end,'INC = incomplete. Component values are a snapshot; update scores in the app and re-export.',{italic:true,size:9});
 const sig=row+4,mid=Math.floor(end/2);merge(sig,1,sig,mid,'Prepared by:',{italic:true});merge(sig,mid+2,sig,end,'Checked and Approved by:',{italic:true});
 merge(sig+2,1,sig+2,mid,m.teacher||'________________________',{bold:true});merge(sig+2,mid+2,sig+2,end,m.unitHead||'________________________',{bold:true});merge(sig+3,1,sig+3,mid,'Subject Teacher');merge(sig+3,mid+2,sig+3,end,'Unit Head');merge(sig+4,1,sig+4,mid,'Date: ____________________');merge(sig+4,mid+2,sig+4,end,'Date: ____________________');
 merge(sig+7,1,sig+7,end,'Counterchecked and Approved E-Based System Data:',{italic:true});merge(sig+9,1,sig+9,end,m.cidChief||'________________________',{bold:true});merge(sig+10,1,sig+10,end,'Curriculum and Instruction Division Chief');merge(sig+11,1,sig+11,end,'Date: ____________________');merge(sig+14,1,sig+14,end,m.documentCode);merge(sig+15,1,sig+15,end,`Re: Grading Sheet, ${QUARTERS[m.quarter-1]} Quarter, SY ${m.year}`);
 sheet.pageSetup.printArea=`A1:${sheet.getCell(sig+15,end).address}`;sheet.headerFooter.oddFooter='&RPage &P of &N';
 return book.xlsx.writeBuffer();
}
