(function(C){'use strict';const VERSION=5,ATLAS='city';function position(scene,b){return scene.iso.footprintCenter({footprint:b.footprint||{w:1,h:1}},b.x,b.y,scene.layout)}
  /* The hand-drawn sheet holds one finished structure per district and nothing
     for a half-built one or a footprint bigger than a single cell, so it is used
     where it applies and the generated asset still covers the rest. Naming
     matches what the scene itself draws, so this re-selects the frame the scene
     already chose rather than picking a different one. */
  function sheetFrame(scene,b,stage){if(stage!=='complete')return null;const f=b.footprint||{w:1,h:1};if((f.w||1)!==1||(f.h||1)!==1)return null;
    const key=b.known&&scene.assets?.buildings?.[b.district]?`building-${b.district}`:b.known?'building-core':'building-unknown';
    return scene.hasArt?.(key)?key:null}
  function apply(scene,b,ref){if(!ref?.image||!C.BuildingAssetSystem)return null;const ageLevel=b.ageLevel||scene.snapshot?.age?.level||C.BuildingAssetSystem.currentAge?.(),
    stage=C.BuildingAssetSystem.stageFor?.(b.progress)||'complete',frame=sheetFrame(scene,b,stage),
    /* Only generate when the drawing is what gets shown; otherwise this made a
       texture per district that nothing ever drew. */
    asset=frame?null:C.BuildingAssetSystem.generate(scene,{...b,ageLevel}),p=position(scene,b);
    if(frame){ref.image.setTexture(ATLAS,frame);ref.image.setPosition(p.x,p.y+9);ref.image.setOrigin(.5,.86)}
    else{ref.image.setTexture(asset.key);ref.image.setPosition(p.x,p.y+12);ref.image.setOrigin(.5,1)}
    ref.image.clearTint?.();ref.image.setScale?.(1);ref.image.setAlpha(1);ref.image.setDepth(scene.iso.depth(b.x+(b.footprint?.w||1)-1,b.y+(b.footprint?.h||1)-1,30));
    ref.assetKey=frame||asset.key;ref.stage=stage;ref.level=b.level||1;ref.age=asset?asset.recipe.age:(C.BuildingAssetSystem.currentAge?.(ageLevel)||ageLevel||1);ref.footprint=b.footprint||{w:1,h:1};
    if(ref.dust){ref.dust.setPosition(p.x,p.y-6);ref.dust.setDepth(scene.iso.depth(b.x,b.y,42))}
    return asset||{key:frame,stage,recipe:{age:ref.age},sheet:true}}function render(scene){for(const b of scene.snapshot?.buildings||[]){const ref=scene.buildingRefs?.get?.(`${b.x},${b.y}`);apply(scene,b,ref)}return scene.buildingRefs}function install(){const Scene=C.PhaserCityScene;if(!Scene?.prototype)return false;if(Scene.prototype.__p1cTierVisuals)return true;Scene.prototype.__p1cTierVisuals=true;const original=Scene.prototype.renderWorld;Scene.prototype.renderWorld=function(){const out=original.apply(this,arguments);render(this);return out};const originalUpdate=Scene.prototype.update;Scene.prototype.update=function(time,delta){const out=originalUpdate?.call(this,time,delta);if(time-(this.__r3AssetTick||0)<150)return out;this.__r3AssetTick=time;const snap=this.adapter?.snapshot?.()||this.snapshot,age=snap?.age?.level||C.BuildingAssetSystem?.currentAge?.();for(const b of snap?.buildings||[]){const ref=this.buildingRefs?.get?.(`${b.x},${b.y}`);if(!ref)continue;const stage=C.BuildingAssetSystem?.stageFor?.(b.progress);if(stage!==ref.stage||Number(b.level||1)!==Number(ref.level||1)||Number(age||1)!==Number(ref.age||1))apply(this,{...b,ageLevel:age},ref)}return out};const scene=C.phaserCity?.game?.scene?.getScene?.('CodeopolisCity');if(scene)render(scene);C.events?.emit?.('r3:building-assets-ready',{version:VERSION,...(C.BuildingAssetSystem?.audit?.()||{})});return true}C.BuildingTierVisuals={VERSION,position,apply,render,install};})(window.Codeopolis);
