import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const C={};const ctx={window:{Codeopolis:C}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/civilization/phaser/citizen-identities.js','utf8'),ctx);const I=C.CitizenIdentities;
const home={id:'lab',x:2,y:3};const a=I.identity(0,home,'research'),b=I.identity(0,home,'research');assert.equal(a.id,b.id);assert.equal(a.name,b.name);assert.equal(a.role,'Researcher');
const citizens=[I.identity(0,{id:'a'},'research'),I.identity(1,{id:'b'},'trade'),I.identity(2,{id:'c'},'infrastructure')];I.apply(citizens);assert.equal(citizens.every(c=>c.relationships.length>0),true);assert.equal(citizens[0].relationships.some(r=>r.id!==citizens[0].id),true);assert.equal(I.summary(citizens[0]).includes(citizens[0].name),true);
console.log('P5-E named citizens roles and relationships: ok');
