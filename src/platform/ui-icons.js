(function(C){
  'use strict';
  /* Interface icons drawn for the game (assets/ui/icons, cut from the icon sheet by
     tools/import-sheets.py). One icon per meaning, so a symbol never stands for two
     things the way the lightning-bolt emoji did for energy, momentum, the build
     boost and Infrastructure. 64px images, shown smaller and smoothly scaled. */
  const DIR='assets/ui/icons/';
  const NAMES=Object.freeze(['credits','insight','materials','trade','research','compute','infrastructure','stability','streak','momentum','energy','population','happiness','build-boost','hint','goal']);
  const SET=new Set(NAMES);
  function has(name){return SET.has(name)}
  function url(name){return has(name)?DIR+name+'.png':''}
  function img(name,{size=20,label='',cls='ui-ico'}={}){
    if(!has(name))return'';
    const alt=String(label).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
    return `<img class="${cls}" src="${DIR}${name}.png" width="${size}" height="${size}" alt="${alt}"${alt?'':' aria-hidden="true"'} decoding="async" draggable="false">`}
  C.UIIcons={VERSION:1,DIR,NAMES,has,url,img};
})(window.Codeopolis);
