const {DatabaseSync}=require('node:sqlite');
const {createHash,randomUUID}=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const rules=require('./web/verses.json');
const file=process.env.YUNQI_LEDGER||path.join(__dirname,'data','prayers.sqlite');
if(file!==':memory:')fs.mkdirSync(path.dirname(file),{recursive:true});
const db=new DatabaseSync(file);
db.exec(`CREATE TABLE IF NOT EXISTS pilgrims (
  id INTEGER PRIMARY KEY, browser_hash TEXT UNIQUE NOT NULL,
  rounds INTEGER NOT NULL DEFAULT 0, last_finish REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS pilgrims_rounds ON pilgrims(rounds DESC);`);
const insert=db.prepare('INSERT INTO pilgrims(browser_hash) VALUES (?) ON CONFLICT(browser_hash) DO NOTHING');
const lookup=db.prepare('SELECT id FROM pilgrims WHERE browser_hash=?');
const personal=db.prepare('SELECT id,rounds,(SELECT count(*)+1 FROM pilgrims r WHERE r.rounds>p.rounds) AS rank FROM pilgrims p WHERE id=?');
const top=db.prepare('SELECT id,rounds,RANK() OVER (ORDER BY rounds DESC) AS rank FROM pilgrims WHERE rounds>0 ORDER BY rounds DESC,id LIMIT 10');
const credit=db.prepare('UPDATE pilgrims SET rounds=rounds+1,last_finish=? WHERE id=? AND last_finish<=? RETURNING rounds');
const names=['松子','团团','阿栗','小柚','云豆','花生','青禾','糯米','阿桃','山竹'];
function name(id){return names[(id-1)%names.length]+(id>names.length?'·'+id:'');}
function open(key){
  if(typeof key!=='string'||!/^[a-f0-9-]{36}$/i.test(key))key=randomUUID();
  const hash=createHash('sha256').update(key).digest('hex');
  insert.run(hash);return lookup.get(hash).id;
}
function award(id,finished){
  // Overlapping rounds from two tabs with the same identity count only once.
  return credit.get(finished,id,finished-rules.cycle+.002)?.rounds;
}
function milestone(rounds){
  const v=rules.verses.find(v=>v.at===rounds);
  if(v)return v.at;
  if(rounds>100&&rounds%50===0)return rules.verses[(rounds/50-3)%rules.verses.length].at;
  return null;
}
function decorate(row){return {name:name(row.id),rounds:row.rounds,rank:row.rounds?row.rank:null};}
module.exports={open,name,award,milestone,cycle:rules.cycle,summary:id=>decorate(personal.get(id)),
  ranking:id=>({top:top.all().map(row=>({...decorate(row),me:row.id===id})),mine:decorate(personal.get(id))})};
