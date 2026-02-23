const fs=require('fs');
const s=fs.readFileSync('src/pages/doctor/DoctorDashboard.tsx','utf8');
let inS=false,inD=false,inT=false,inC=false;
for(let i=0;i<s.length;i++){
  const ch=s[i];
  const prev=s[i-1];
  if(inC){
    if(ch==='*'&&s[i+1]==='/'){inC=false;i++;continue}
  } else if(inS){
    if(ch==="'"&&prev!=='\\') inS=false
  } else if(inD){
    if(ch==='"'&&prev!=='\\') inD=false
  } else if(inT){
    if(ch==='`'&&prev!=='\\') inT=false
  } else {
    if(ch==='/'){
      if(s[i+1]==='*'){inC=true;i++;continue}
      if(s[i+1]==='/'){ // line comment skip
        while(i<s.length && s[i] !== '\n') i++;
        continue;
      }
      const upTo=s.slice(Math.max(0,i-40),i+40).replace(/\n/g,'↩');
      const line=s.slice(0,i).split(/\r?\n/).length;
      console.log('SLASH at',line,i,upTo);
    }
    if(ch==="'") inS=true;
    if(ch==='"') inD=true;
    if(ch==='`') inT=true;
  }
}
console.log('done');
