const fs=require('fs');
const path='src/pages/doctor/DoctorDashboard.tsx';
const out='src/pages/doctor/DoctorDashboard.sanitized.tsx';
let s=fs.readFileSync(path,'utf8');
// remove control chars except tab(9), LF(10), CR(13)
s = s.split('').filter(ch=>{
  const code=ch.charCodeAt(0);
  if(code===9||code===10||code===13) return true;
  if(code>=32) return true;
  return false;
}).join('');
fs.writeFileSync(out,s,'utf8');
console.log('Wrote',out, 'length', s.length);
