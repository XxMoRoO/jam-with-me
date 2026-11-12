/* Jam With Me — MIDI melody/accompaniment separation. No copyrighted song data bundled. */
(function(global){
'use strict';
const NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const mod=n=>(n%12+12)%12;
const pct=(a,p)=>{if(!a.length)return 60;const x=[...a].sort((u,v)=>u-v);return x[Math.min(x.length-1,Math.max(0,Math.floor(p*(x.length-1))))]};
function groups(notes,gap=.09){
 const sorted=[...notes].sort((a,b)=>a.beat-b.beat||b.midi-a.midi),out=[];
 for(const n of sorted){const last=out[out.length-1];if(!last||n.beat-last.beat>gap)out.push({beat:n.beat,notes:[n]});else last.notes.push(n)}
 return out;
}
function read(buffer){
 const bytes=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer);
 if(bytes.byteLength<14)throw Error('File too short');
 const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const word=i=>String.fromCharCode(...bytes.subarray(i,i+4)),u16=i=>dv.getUint16(i),u32=i=>dv.getUint32(i);
 if(word(0)!=='MThd')throw Error('Not a MIDI file');
 const hlen=u32(4),ntracks=u16(10),division=u16(12);
 if(division&0x8000)throw Error('SMPTE MIDI timing is not supported');
 if(!division||!ntracks||ntracks>128)throw Error('Invalid MIDI header');
 let offset=8+hlen,tempo=500000,tempoTick=Infinity;const tracks=[];
 function variable(st){let v=0;for(let i=0;i<4;i++){if(st.i>=st.end)throw Error('Truncated MIDI');const b=bytes[st.i++];v=(v<<7)|(b&127);if(!(b&128))return v}throw Error('Invalid MIDI delta')}
 for(let k=0;k<ntracks;k++){
  if(offset+8>bytes.length||word(offset)!=='MTrk')throw Error('Invalid MIDI track');
  const end=offset+8+u32(offset+4);if(end>bytes.length)throw Error('Truncated track');
  const st={i:offset+8,end},active=new Map(),notes=[];let tick=0,status=0,name='Track '+(k+1);
  while(st.i<end){
   tick+=variable(st);
   let cur=bytes[st.i];if(cur&128){status=cur;st.i++}else{if(status<0x80||status>0xef)throw Error('Bad running status');cur=status}
   if(cur===0xff){const type=bytes[st.i++],len=variable(st),at=st.i;if(at+len>end)throw Error('Truncated meta event');
    if(type===3){name=Array.from(bytes.subarray(at,at+Math.min(len,80))).map(x=>String.fromCharCode(x)).join('')}
    if(type===0x51&&len===3&&tick<tempoTick){tempo=(bytes[at]<<16)|(bytes[at+1]<<8)|bytes[at+2];tempoTick=tick}
    st.i+=len;status=0;continue;
   }
   if(cur===0xf0||cur===0xf7){st.i+=variable(st);if(st.i>end)throw Error('Truncated sysex');status=0;continue}
   const cmd=cur&0xf0,ch=cur&15;
   if(cmd===0x80||cmd===0x90||cmd===0xa0||cmd===0xb0||cmd===0xe0){
    if(st.i+2>end)throw Error('Invalid MIDI event');const key=bytes[st.i++],vel=bytes[st.i++];
    if(cmd===0x90&&vel>0&&ch!==9){const id=ch+':'+key;const pending=active.get(id)||[];pending.push({tick,velocity:vel});active.set(id,pending)}
    if(cmd===0x80||(cmd===0x90&&vel===0)){const id=ch+':'+key,pending=active.get(id);if(pending?.length){const on=pending.shift();notes.push({midi:key,channel:ch,beat:on.tick/division,length:Math.max(.12,(tick-on.tick)/division),velocity:on.velocity})}}
   }else if(cmd===0xc0||cmd===0xd0){st.i++}else throw Error('Unknown MIDI status '+cur);
  }
  tracks.push({name,notes:notes.sort((a,b)=>a.beat-b.beat||b.midi-a.midi)});
  offset=end;
 }
 return {tracks,bpm:Math.max(55,Math.min(180,Math.round(60000000/(tempo||500000))))};
}
function chooseLead(tracks){
 const playable=tracks.map((t,i)=>({t,i})).filter(x=>x.t.notes.length>=4);
 if(!playable.length)throw Error('No playable melody track');
 const rank=x=>{
  const n=x.t.notes,g=groups(n),mono=g.filter(z=>z.notes.length===1).length/Math.max(1,g.length);
  const median=pct(n.map(y=>y.midi),.5),name=x.t.name.toLowerCase();
  let bonus=/melody|lead|vocal|voice|soprano|flute|solo|sing/.test(name)?55:0;
  if(/chord|accomp|bass|rhythm|drum|strings pad/.test(name))bonus-=35;
  return bonus+mono*45+Math.min(24,Math.max(-24,(median-60)*1.3))+Math.min(n.length,220)*.025;
 };
 return playable.sort((a,b)=>rank(b)-rank(a))[0];
}
function isolateMelody(source,all){
 const gs=groups(source),poly=gs.filter(g=>g.notes.length>1).length/Math.max(1,gs.length);
 if(poly<.06)return {lead:source.slice(0,650),rest:[]};
 const maxes=gs.map(g=>Math.max(...g.notes.map(n=>n.midi)));
 const register=Math.min(70,Math.max(56,pct(maxes,.68)-7));
 const picked=[];let previous=null;
 for(const g of gs){
  const high=Math.max(...g.notes.map(n=>n.midi));
  if(g.notes.length>1&&high<register&&previous!==null&&high<previous.midi-8)continue;
  const sorted=[...g.notes].sort((a,b)=>b.midi-a.midi);
  const pool=sorted.filter(n=>n.midi>=register-6).slice(0,3);
  const candidates=pool.length?pool:[sorted[0]];
  let best=candidates[0],score=-Infinity;
  for(const n of candidates){
   const leap=previous?Math.abs(n.midi-previous.midi):0;
   const rank=(n.midi-register)*.12-Math.max(0,leap-5)*.35+(n===sorted[0]?1:0);
   if(rank>score){score=rank;best=n}
  }
  if(g.notes.length>1&&best.midi<register-5&&previous&&Math.abs(best.midi-previous.midi)>10)continue;
  picked.push(best);previous=best;
  if(picked.length>=650)break;
 }
 const leadIDs=new Set(picked),rest=source.filter(n=>!leadIDs.has(n));
 return {lead:picked,rest};
}
function transposeForWhite(lead){
 const white=new Set([0,2,4,5,7,9,11]);let best=0,bestScore=-Infinity;
 for(let shift=-6;shift<=6;shift++){
  let score=-Math.abs(shift)*.38;
  for(const n of lead){score+=white.has(mod(n.midi+shift))?1:0}
  if(score>bestScore){best=shift;bestScore=score}
 }
 return best;
}
const TEMPLATES=[
 ['major',[0,4,7],''],['minor',[0,3,7],'m'],['maj7',[0,4,7,11],'maj7'],['minor7',[0,3,7,10],'m7'],['dom7',[0,4,7,10],'7'],['sus4',[0,5,7],'sus4']
];
function harmony(lead,accomp,shift,total){
 const labels=[],guitarEvents=[];const period=2;let prev=null;
 const hasAccomp=accomp.length>=4;
 for(let beat=0;beat<Math.min(total,1800);beat+=period){
  const heard=hasAccomp?accomp.filter(n=>n.beat<beat+period+.06&&n.beat+n.length>beat-.15):[];
  const basis=heard.length?heard:lead.filter(n=>n.beat<beat+period+.05&&n.beat+n.length>beat-.1);
  if(!basis.length&&prev===null)continue;
  let best=prev,bestScore=-Infinity;
  if(basis.length){
   const weights=Array(12).fill(0),low=Math.min(...basis.map(n=>n.midi));
   for(const n of basis){weights[mod(n.midi+shift)]+=Math.max(.3,Math.min(2,n.length))*((hasAccomp&&n.midi<64)?1.8:1)}
   for(let root=0;root<12;root++)for(const [quality,steps,suffix] of TEMPLATES){
    const pcs=steps.map(x=>mod(root+x));
    const matches=pcs.reduce((a,pc)=>a+weights[pc],0);
    const elsewhere=weights.reduce((a,b)=>a+b,0)-matches;
    const bass=mod(low+shift)===root?2:0;
    const continuity=prev?.root===root&&prev?.quality===quality?1.3:0;
    const score=matches*2-elsewhere*.7+bass+continuity+(quality==='major'||quality==='minor'?1:0);
    if(score>bestScore){bestScore=score;best={root,quality,steps,suffix}}
   }
  }
  if(!best)continue;prev=best;labels.push({beat,name:NAMES[best.root]+best.suffix});
  // Classical finger-picking: root bass on beats 1/3 with inner notes staggered.
  const toMidi=(pc,lo,hi)=>{let m=lo+mod(pc-lo);while(m>hi)m-=12;while(m<lo)m+=12;return m};
  const bass=toMidi(best.root,40,52),third=toMidi(mod(best.root+best.steps[1]),55,66),fifth=toMidi(mod(best.root+best.steps[2]),56,68);
  const top=best.steps.length>3?toMidi(mod(best.root+best.steps[3]),59,71):toMidi(best.root,60,71);
  for(const [d,midi,v] of [[0,bass,.58],[.38,third,.43],[.78,fifth,.38],[1.17,top,.36],[1.58,third,.34]]){
   if(beat+d<total)guitarEvents.push({beat:beat+d,midi,velocity:v});
  }
 }
 return {guitarEvents,chordLabels:labels};
}
function analyze(buffer){
 const data=read(buffer);const leadTrack=chooseLead(data.tracks),singleTrack=data.tracks.filter(t=>t.notes.length>=4).length===1;
 const extraction=isolateMelody(leadTrack.t.notes,data.tracks.flatMap(t=>t.notes));
 const raw=extraction.lead;
 if(raw.length<4)throw Error('Cannot identify a clear melody — try a melody-only MIDI file');
 const shift=transposeForWhite(raw),min=Math.min(...raw.map(n=>n.beat));
 const melody=raw.map(n=>({note:NAMES[mod(n.midi+shift)],beat:Math.max(0,n.beat-min),length:Math.min(8,n.length),done:false}));
 const included=new Set(raw);
 const accompaniment=data.tracks.flatMap(t=>t.notes).filter(n=>!included.has(n)).map(n=>({...n,beat:Math.max(0,n.beat-min)}));
 const total=Math.max(...melody.map(n=>n.beat+n.length)),h=harmony(raw.map(n=>({...n,beat:n.beat-min})),accompaniment,shift,total);
 const white=melody.filter(n=>!n.note.endsWith('#')).length;
 return {melody,guitarEvents:h.guitarEvents,chordLabels:h.chordLabels,total,bpm:data.bpm,transpose:shift,stats:{melodyNotes:melody.length,whiteNotes:white,chordNotes:accompaniment.length,chordChanges:h.chordLabels.length,leadTrack:leadTrack.t.name,trackCount:data.tracks.length,mixedTrack:singleTrack}};
}
global.JamMidi={parse:read,analyze,transposeForWhite};
})(window);
