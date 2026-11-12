/* Real, CC0 nylon-string guitar recordings from Meta Open Sound; no synth buzz loops. */
(function(global){
'use strict';
const anchors=[40,43,45,47,48,50,52,53,55,57,59,60,62,64,65,67,69,71];
const hz=midi=>440*Math.pow(2,(midi-69)/12);
class JamNylon{
 constructor(ctx,destination){
  this.ctx=ctx;this.buffers=new Map();this.levels=new Map();this.loading=null;this.active=[];this.ready=false;
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=4100;filter.Q.value=.25;
  const body=ctx.createBiquadFilter();body.type='peaking';body.frequency.value=260;body.Q.value=.8;body.gain.value=2;
  filter.connect(body);body.connect(destination);this.output=filter;
  // A small, quiet room reflection makes finger-picked notes sit together.
  const delay=ctx.createDelay(.3);delay.delayTime.value=.075;
  const damp=ctx.createBiquadFilter();damp.type='lowpass';damp.frequency.value=1800;
  const wet=ctx.createGain();wet.gain.value=.075;
  filter.connect(delay);delay.connect(damp);damp.connect(wet);wet.connect(destination);
 }
 async load(){
  if(this.loading)return this.loading;
  this.loading=Promise.allSettled(anchors.map(async midi=>{
   const resp=await fetch('assets/nylon/'+midi+'.ogg',{cache:'force-cache'});
   if(!resp.ok)throw Error('guitar sample '+midi+': '+resp.status);
   const buffer=await this.ctx.decodeAudioData(await resp.arrayBuffer());
   const pcm=buffer.getChannelData(0);let peak=0;
   // Short sampled scan for normalization: these quiet original field samples retain full dynamics.
   const stride=Math.max(1,Math.floor(pcm.length/30000));
   for(let i=0;i<pcm.length;i+=stride)peak=Math.max(peak,Math.abs(pcm[i]));
   this.buffers.set(midi,buffer);
   this.levels.set(midi,Math.min(8,Math.max(1,.23/Math.max(.005,peak))));
  })).then(result=>{this.ready=this.buffers.size>=5;return {loaded:this.buffers.size,failed:result.filter(r=>r.status==='rejected').length}}).catch(()=>({loaded:this.buffers.size,failed:anchors.length}));
  return this.loading;
 }
 play(midi,when,velocity=.44,hold=1.6){
  if(!this.ctx)return;
  const ctx=this.ctx,at=Math.max(ctx.currentTime+.002,when||ctx.currentTime);
  const safeMidi=Math.max(40,Math.min(75,Math.round(midi)));
  let nearest=null,dist=Infinity;
  for(const note of this.buffers.keys()){const d=Math.abs(note-safeMidi);if(d<dist){dist=d;nearest=note}}
  if(nearest===null)return this.fallback(safeMidi,at,velocity,hold);
  const src=ctx.createBufferSource(),amp=ctx.createGain(),buf=this.buffers.get(nearest);
  src.buffer=buf;src.playbackRate.value=Math.pow(2,(safeMidi-nearest)/12);
  const lev=this.levels.get(nearest)||1;
  const v=Math.max(.08,Math.min(1,velocity));
  const envelopeEnd=Math.min(3.5,Math.max(.6,hold));
  amp.gain.setValueAtTime(.0001,at);
  amp.gain.linearRampToValueAtTime(Math.min(2.5,lev*v*.72),at+.007);
  amp.gain.setTargetAtTime(.0001,at+envelopeEnd,.34);
  src.connect(amp);amp.connect(this.output);
  src.start(at);
  const stop=at+Math.min(buf.duration/src.playbackRate.value,Math.max(1.8,envelopeEnd+1.8));
  src.stop(stop);
  const voice={src,at};this.active.push(voice);
  if(this.active.length>32){const oldest=this.active.shift();try{oldest.src.stop()}catch{}}
  src.onended=()=>{const i=this.active.indexOf(voice);if(i!==-1)this.active.splice(i,1);src.disconnect();amp.disconnect()};
 }
 fallback(midi,at,velocity,hold){
  // Offline/network fallback: rounded harmonics and finger attack, not a looping noise oscillator.
  const ctx=this.ctx,f=hz(midi),duration=Math.min(2.7,Math.max(.6,hold));
  const gain=ctx.createGain(),filter=ctx.createBiquadFilter();
  filter.type='lowpass';filter.frequency.setValueAtTime(2600,at);filter.frequency.exponentialRampToValueAtTime(950,at+.27);
  const vol=Math.max(.01,Math.min(.11,velocity*.12));
  gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(vol,at+.013);
  gain.gain.exponentialRampToValueAtTime(.0002,at+duration);
  filter.connect(gain);gain.connect(this.output);
  [[1,.9],[2,.2],[3,.09],[4,.04]].forEach(([harm,weight])=>{
   const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';
   o.frequency.setValueAtTime(f*harm*1.0005,at);o.frequency.exponentialRampToValueAtTime(f*harm,at+.045);
   g.gain.value=weight;o.connect(g);g.connect(filter);o.start(at);o.stop(at+duration+.025);
  });
 }
}
global.JamNylon=JamNylon;
})(window);
