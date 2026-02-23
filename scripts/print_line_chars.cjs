const fs=require('fs');
const s=fs.readFileSync('src/pages/doctor/DoctorDashboard.tsx','utf8');
const lines=s.split(/\r?\n/);
for(let i=1247;i<1260;i++){
  const l=lines[i]||'';
  console.log('LINE',i+1,':',l);
  const codes=[...l].map(ch=>ch.charCodeAt(0));
  console.log(codes.join(' '));
}
