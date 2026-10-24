export class CircuitJsonEditor {
  constructor(visual) {
    this.visual=visual;this.fallback=document.getElementById('json-fallback');this.status=document.getElementById('json-status');this.dirty=false;this.loading=false;this.monaco=null;
    document.getElementById('tab-map').onclick=()=>this.tab(false);
    document.getElementById('tab-json').onclick=()=>this.tab(true);
    document.getElementById('json-apply').onclick=()=>this.apply();
    document.getElementById('json-download').onclick=()=>this.download();
    document.getElementById('json-format').onclick=()=>this.format();
    document.getElementById('json-refresh').onclick=()=>{if(!this.dirty||confirm('Sostituire il codice non applicato con i dati della mappa?'))this.pull();};
    this.fallback.oninput=()=>{this.dirty=true;};
    document.addEventListener('circuit-loaded',()=>{this.dirty=false;this.pull();});
    window.addEventListener('beforeunload',e=>{if(this.dirty){e.preventDefault();e.returnValue='';}});
  }
  value(){return this.monaco?this.monaco.getValue():this.fallback.value;}
  set(text){this.fallback.value=text;if(this.monaco)this.monaco.setValue(text);this.dirty=false;}
  tab(code){
    document.getElementById('visual-editor').hidden=code;document.getElementById('visual-editor').style.display=code?'none':'grid';document.getElementById('json-panel').hidden=!code;
    for(const [id,selected]of [['tab-map',!code],['tab-json',code]]){const button=document.getElementById(id);button.setAttribute('aria-selected',String(selected));button.classList.toggle('bg-blue-700',selected);button.classList.toggle('bg-slate-700',!selected);}
    if(code){if(!this.dirty)this.pull();this.loadMonaco();if(this.monaco)this.monaco.layout();}
  }
  pull(){
    if(!this.visual.definition){this.status.textContent='Carica prima un circuito.';return;}
    try{
      const data=this.visual.dirty?this.visual.buildDefinition():structuredClone(this.visual.definition);
      this.set(JSON.stringify(data,null,2));this.status.textContent='Modifica sections per aggiungere, eliminare o cambiare i tratti. Poi premi Applica JSON alla mappa.';
    }catch(error){this.status.textContent=error.message;}
  }
  validate(data){
    if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Il JSON deve contenere un oggetto');
    if(typeof data.id!=='string'||!data.id.trim()||typeof data.name!=='string'||!data.name.trim())throw new Error('id e name sono obbligatori');
    if(!Number.isFinite(data.lengthMeters)||data.lengthMeters<100||data.lengthMeters>100000)throw new Error('lengthMeters deve essere tra 100 e 100000');
    if(!Number.isFinite(data.markerSpacingMeters)||data.markerSpacingMeters<=0)throw new Error('markerSpacingMeters deve essere positivo');
    if(data.closed!==true)throw new Error('Questo editor gestisce circuiti chiusi: closed deve essere true');
    if(!Array.isArray(data.sections)||data.sections.length<3)throw new Error('Servono almeno tre sections');
    const curves=['straight','left_gentle','left_medium','left_hard','right_gentle','right_medium','right_hard'];
    data.sections.forEach((section,i)=>{if(typeof section.name!=='string'||!section.name.trim()||!Number.isFinite(section.weight)||section.weight<=0||!curves.includes(section.curve))throw new Error(`Step ${i+1}: controlla name, weight positivo e curve`);});
    if(data.geometry?.joins?.length===data.sections.length&&data.geometry.joins.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw new Error('Coordinate dei join non valide');
    return data;
  }
  parse(){return this.validate(JSON.parse(this.value()));}
  apply(){
    try{
      const data=this.parse();let regenerated=false;
      if(data.geometry&&(!Array.isArray(data.geometry.joins)||data.geometry.joins.length!==data.sections.length)){delete data.geometry;regenerated=true;}
      this.visual.use(data);this.visual.dirty=true;this.set(JSON.stringify(data,null,2));
      this.status.textContent=regenerated?'Applicato. Il numero di step è cambiato: la mappa è stata rigenerata dagli step.':'JSON applicato: passa alla vista dall’alto per controllare i join.';
      this.visual.message('JSON applicato in memoria. Scarica il file per conservarlo.');
    }catch(error){this.status.textContent=`JSON non applicato: ${error.message}`;}
  }
  format(){try{this.set(JSON.stringify(JSON.parse(this.value()),null,2));this.dirty=true;this.status.textContent='JSON formattato, non ancora applicato.';}catch(error){this.status.textContent=error.message;}}
  download(){try{
    const data=this.parse();if(data.geometry&&data.geometry.joins?.length!==data.sections.length)delete data.geometry;
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`${data.id.replace(/[^a-zA-Z0-9_-]/g,'_')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
    this.status.textContent='JSON scaricato così come modificato. Per usarlo nel gioco registralo nel manifest.';
  }catch(error){this.status.textContent=`Esportazione bloccata: ${error.message}`;}}
  async loadMonaco(){
    if(this.monaco||this.loading)return;this.loading=true;
    const base='https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/';
    try{
      if(!window.require?.config){await new Promise((resolve,reject)=>{
        const script=document.createElement('script');script.src=`${base}vs/loader.js`;
        const timeout=setTimeout(()=>reject(new Error('Timeout caricamento Monaco')),15000);
        script.onload=()=>{clearTimeout(timeout);resolve();};script.onerror=()=>{clearTimeout(timeout);reject(new Error('CDN Monaco non disponibile'));};document.head.append(script);
      });}
      const workerURL=URL.createObjectURL(new Blob([`self.MonacoEnvironment={baseUrl:${JSON.stringify(base)}};importScripts(${JSON.stringify(`${base}vs/base/worker/workerMain.js`)});`],{type:'text/javascript'}));
      window.MonacoEnvironment={getWorkerUrl:()=>workerURL};
      window.require.config({paths:{vs:`${base}vs`}});
      const api=await new Promise((resolve,reject)=>{
        const timeout=setTimeout(()=>reject(new Error('Timeout inizializzazione Monaco')),20000);
        window.require(['vs/editor/editor.main'],()=>{clearTimeout(timeout);resolve(window.monaco);},error=>{clearTimeout(timeout);reject(error);});
      });
      api.languages.json.jsonDefaults.setDiagnosticsOptions({validate:true,schemas:[{uri:'paper-run://circuit-schema',fileMatch:['*'],schema:{type:'object',required:['id','name','lengthMeters','closed','markerSpacingMeters','sections'],properties:{id:{type:'string'},name:{type:'string'},lengthMeters:{type:'number',minimum:100,maximum:100000},closed:{const:true},markerSpacingMeters:{type:'number',exclusiveMinimum:0},sections:{type:'array',minItems:3,items:{type:'object',required:['name','weight','curve'],properties:{name:{type:'string'},weight:{type:'number',exclusiveMinimum:0},curve:{enum:['straight','left_gentle','left_medium','left_hard','right_gentle','right_medium','right_hard']}}}},geometry:{type:'object',properties:{joins:{type:'array',items:{type:'object',required:['x','y'],properties:{x:{type:'number'},y:{type:'number'}}}}}}}}}]});
      const host=document.getElementById('monaco-host');host.hidden=false;
      this.monaco=api.editor.create(host,{value:this.fallback.value,language:'json',theme:'vs-dark',automaticLayout:true,minimap:{enabled:false},fontSize:15,tabSize:2,wordWrap:'on',scrollBeyondLastLine:false});
      this.fallback.hidden=true;this.monaco.onDidChangeModelContent(()=>{this.dirty=true;});
      this.status.textContent='Monaco pronto: completamento JSON e validazione attivi. Ctrl+Spazio per suggerimenti.';
    }catch(error){this.status.textContent=`Monaco non disponibile: resta attivo l’editor testuale (${error.message||'errore CDN'}).`;}
    finally{this.loading=false;}
  }
}
