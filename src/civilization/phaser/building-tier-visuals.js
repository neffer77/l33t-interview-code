(function(C){'use strict';const VERSION=5,ATLAS='city';function position(scene,b){return scene.iso.footprintCenter({footprint:b.footprint||{w:1,h:1}},b.x,b.y,scene.layout)}
  /* The hand-drawn sheet holds one finished structure per district and nothing
     for a half-built one or a footprint bigger than a single cell, so it is used
     where it applies and the generated asset still covers the rest. Naming
     matches what the scene itself draws, so this re-selects the frame the scene
     already chose rather than picking a different one. */
  function sheetFrame(scene,b,stage){if(stage!=='complete')return null;
    const key=b.known&&scene.assets?.buildings?.[b.district]?`building-${b.district}`:b.known?'building-core':'building-unknown';
    return scene.hasArt?.(key)?key:null}
  /* A plot bigger than one cell has no sprite of its own, and a generated box
     beside hand-drawn neighbours was the most obvious seam left on the map. It
     is drawn as a compound instead: the district's own structure on the plot,
     with an outbuilding on the back cell behind it. That reads as a larger site
     without inventing art the sheet does not have. */
  function annex(scene,b,ref){
    const f=b.footprint||{w:1,h:1},big=(f.w||1)>1||(f.h||1)>1;
    if(ref.annex){ref.annex.destroy?.();ref.annex=null}
    if(!big||!scene.hasArt?.('building-annex'))return null;
    const p=scene.toWorld(b.x,b.y);
    ref.annex=scene.sprite(p.x,p.y+9,'building-annex').setOrigin(.5,.86).setDepth(scene.iso.depth(b.x,b.y,29));
    return ref.annex}
  /* Tier used to be readable from the generated silhouette, which changed with
     level. The sheet has one drawing per district, so rank is shown as pips on
     the front of the plot instead: small, static, and clear of the building, so
     it does not cover the art the way a floating badge would. */
  function pips(scene,b,ref){
    if(ref.pips){for(const g of ref.pips)g.destroy?.();ref.pips=null}
    const level=Math.max(1,Number(b.level)||1);
    if(level<2)return null;
    const p=position(scene,b),n=Math.min(4,level-1),
      depth=scene.iso.depth(b.x+(b.footprint?.w||1)-1,b.y+(b.footprint?.h||1)-1,31),out=[];
    for(let i=0;i<n;i++){
      const g=scene.add.graphics().setDepth(depth),x=p.x-(n-1)*4+i*8,y=p.y+11;
      g.fillStyle(0x24332c,.5);g.fillTriangle(x,y-3.4,x+3.6,y,x,y+3.4);g.fillTriangle(x,y-3.4,x-3.6,y,x,y+3.4);
      g.fillStyle(0xffd166,1);g.fillTriangle(x,y-2.4,x+2.6,y,x,y+2.4);g.fillTriangle(x,y-2.4,x-2.6,y,x,y+2.4);
      out.push(g)}
    ref.pips=out;return out}
  function apply(scene,b,ref){if(!ref?.image||!C.BuildingAssetSystem)return null;const ageLevel=b.ageLevel||scene.snapshot?.age?.level||C.BuildingAssetSystem.currentAge?.(),
    stage=C.BuildingAssetSystem.stageFor?.(b.progress)||'complete',frame=sheetFrame(scene,b,stage),
    /* Only generate when the drawing is what gets shown; otherwise this made a
       texture per district that nothing ever drew. */
    asset=frame?null:C.BuildingAssetSystem.generate(scene,{...b,ageLevel}),p=position(scene,b);
    if(frame){ref.image.setTexture(ATLAS,frame);ref.image.setPosition(p.x,p.y+9);ref.image.setOrigin(.5,.86);annex(scene,b,ref);pips(scene,b,ref)}
    /* The generated asset still carries tier in its own silhouette, so pips
       there would say it twice. */
    else{ref.image.setTexture(asset.key);ref.image.setPosition(p.x,p.y+12);ref.image.setOrigin(.5,1);
      if(ref.annex){ref.annex.destroy?.();ref.annex=null}
      if(ref.pips){for(const g of ref.pips)g.destroy?.();ref.pips=null}}
    ref.image.clearTint?.();ref.image.setScale?.(1);ref.image.setAlpha(1);ref.image.setDepth(scene.iso.depth(b.x+(b.footprint?.w||1)-1,b.y+(b.footprint?.h||1)-1,30));
    ref.assetKey=frame||asset.key;ref.stage=stage;ref.level=b.level||1;ref.age=asset?asset.recipe.age:(C.BuildingAssetSystem.currentAge?.(ageLevel)||ageLevel||1);ref.footprint=b.footprint||{w:1,h:1};
    if(ref.dust){ref.dust.setPosition(p.x,p.y-6);ref.dust.setDepth(scene.iso.depth(b.x,b.y,42))}
    return asset||{key:frame,stage,recipe:{age:ref.age},sheet:true}}function render(scene){for(const b of scene.snapshot?.buildings||[]){const ref=scene.buildingRefs?.get?.(`${b.x},${b.y}`);apply(scene,b,ref)}return scene.buildingRefs}function install(){const Scene=C.PhaserCityScene;if(!Scene?.prototype)return false;if(Scene.prototype.__p1cTierVisuals)return true;Scene.prototype.__p1cTierVisuals=true;const original=Scene.prototype.renderWorld;Scene.prototype.renderWorld=function(){const out=original.apply(this,arguments);render(this);return out};const originalUpdate=Scene.prototype.update;Scene.prototype.update=function(time,delta){const out=originalUpdate?.call(this,time,delta);if(time-(this.__r3AssetTick||0)<150)return out;this.__r3AssetTick=time;const snap=this.adapter?.snapshot?.()||this.snapshot,age=snap?.age?.level||C.BuildingAssetSystem?.currentAge?.();for(const b of snap?.buildings||[]){const ref=this.buildingRefs?.get?.(`${b.x},${b.y}`);if(!ref)continue;const stage=C.BuildingAssetSystem?.stageFor?.(b.progress);if(stage!==ref.stage||Number(b.level||1)!==Number(ref.level||1)||Number(age||1)!==Number(ref.age||1))apply(this,{...b,ageLevel:age},ref)}return out};const scene=C.phaserCity?.game?.scene?.getScene?.('CodeopolisCity');if(scene)render(scene);C.events?.emit?.('r3:building-assets-ready',{version:VERSION,...(C.BuildingAssetSystem?.audit?.()||{})});return true}C.BuildingTierVisuals={VERSION,position,apply,render,install};})(window.Codeopolis);
