#!/usr/bin/env python3
import argparse, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

VIEWPORTS={'phone_portrait':(390,844),'phone_landscape':(844,390),'tablet':(834,1112),'desktop':(1440,1000),'wide_desktop':(1920,1080)}
def fail(message): raise AssertionError(message)
def snap(page,path): page.screenshot(path=str(path),full_page=False)
def switch_view(page,view): page.evaluate("""view => {const C=window.Codeopolis;if(C?.ionicShell?.go&&document.querySelector('#codeopolisIonicShell'))C.ionicShell.go(view);else if(typeof window.switchTab==='function')window.switchTab(view);else document.querySelector(`.tabs button[data-tab="${view}"]`)?.click();C?.R14PlayerAcceptance?.sync?.()}""",view)
def switch_city(page): switch_view(page,'city')
def diagnostics(page):
    return page.evaluate("""() => {
      const C=window.Codeopolis,s=C?.phaserCity?.game?.scene?.getScene?.('CodeopolisCity');let lexicalState={};
      try{lexicalState={defined:typeof state!=='undefined',truthy:typeof state!=='undefined'&&!!state}}catch(e){lexicalState={defined:false,error:String(e)}}
      const required=['WorldSystem','IsoCamera','CitySimulation','CityRenderer','AudioSystem','RewardEngine','GameUI','PhaserCivilizationBootstrap'];
      const shell=document.querySelector('#codeopolisIonicShell'),content=document.querySelector('#codeopolisIonicContent'),host=C?.phaserCity?.host,city=document.querySelector('.codeopolis-mobile-city-peek'),stage=document.querySelector('.codeopolis-ionic-stage'),title=document.querySelector('.section-title'),summary=document.querySelector('.city-summary'),ionicLink=[...document.querySelectorAll('link[rel="stylesheet"]')].find(l=>(l.getAttribute('href')||'').includes('phase43-ionic.css'));
      const box=e=>{if(!e)return null;const cs=getComputedStyle(e),r=e.getBoundingClientRect();return{tag:e.tagName,id:e.id||null,className:typeof e.className==='string'?e.className:null,parent:e.parentElement?`${e.parentElement.tagName}#${e.parentElement.id||''}.${typeof e.parentElement.className==='string'?e.parentElement.className:''}`:null,display:cs.display,visibility:cs.visibility,position:cs.position,padding:cs.padding,border:cs.border,borderRadius:cs.borderRadius,gridTemplateRows:cs.gridTemplateRows,w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.x),y:Math.round(r.y)}};
      return {codeopolis:!!C,game:!!C?.game,gameState:!!C?.game?.state,gameWorld:!!C?.game?.world,bootstrap:C?.GameBootstrapStatus||null,lexicalState,windowState:!!window.state,
        modules:Object.fromEntries(required.map(k=>[k,!!C?.get?.(k)])),projection:{present:!!C?.PixelWorldProjection,layout:typeof C?.PixelWorldProjection?.layout,tileW:C?.PixelWorldProjection?.TILE_W||null,tileH:C?.PixelWorldProjection?.TILE_H||null},
        phaserCity:!!C?.phaserCity,host:!!host,shell:box(shell),content:box(content),stage:box(stage),city:box(city),hostBox:box(host),title:box(title),summary:box(summary),bodyClass:document.body.className,
        ionicCss:{present:!!ionicLink,href:ionicLink?.href||null,sheet:!!ionicLink?.sheet,media:[...document.styleSheets].filter(x=>(x.href||'').includes('phase43-ionic.css')).map(x=>({href:x.href,disabled:x.disabled,media:x.media?.mediaText||''}))},
        scene:!!s,active:!!s?.sys?.isActive?.(),sleeping:!!s?.scene?.isSleeping?.(),paused:!!s?.scene?.isPaused?.(),
        r14:!!C?.R14PlayerAcceptance,r14Script:!!document.querySelector('script[data-r14-player-acceptance]'),legacyCanvas:!!document.getElementById('cityCanvas'),legacyDisplay:document.getElementById('cityCanvas')?.style?.display||'',
        view:shell?.dataset?.view||document.querySelector('.tabs button.active[data-tab]')?.dataset?.tab||null,phaser:window.Phaser?.VERSION||null,capturedWarnings:(window.__r14CapturedWarnings||[]).slice(-6),
        coding:C?.R14PlayerAcceptance?.codingAudit?.()||null,
        r1:C?.R1ProductionAudit?{renderer:C.R1ProductionAudit.rendererSnapshot?.(),events:C.R1ProductionAudit.runtime?.loadEvents?.slice?.(-8),fallback:C.R1ProductionAudit.runtime?.fallbackReason}:null};
    }""")
def wait_city(page):
    try: page.wait_for_function("""() => {const C=window.Codeopolis,s=C?.phaserCity?.game?.scene?.getScene?.('CodeopolisCity');return !!C?.phaserCity?.host&&!!s}""",timeout=60000)
    except PlaywrightTimeoutError: fail(f"City renderer never created: {diagnostics(page)}")
    switch_city(page)
    try: page.wait_for_function("""() => {const C=window.Codeopolis,s=C?.phaserCity?.game?.scene?.getScene?.('CodeopolisCity'),h=C?.phaserCity?.host;if(!s?.sys?.isActive?.()||!h)return false;const cs=getComputedStyle(h),r=h.getBoundingClientRect();return cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>.01&&r.width>1&&r.height>1}""",timeout=12000)
    except PlaywrightTimeoutError: fail(f"City scene exists but did not wake for City view: {diagnostics(page)}")
    try: page.wait_for_function("() => !!window.Codeopolis?.R14PlayerAcceptance",timeout=12000)
    except PlaywrightTimeoutError: fail(f"R14 player auditor did not auto-load: {diagnostics(page)}")
    # Let first-run camera framing settle before any map interaction, so sampled
    # tap points map to the tiles actually on screen. Resolves immediately when the
    # camera is already stable; only adds delay while it is still animating.
    page.evaluate("()=>{window.__r14CamKey=null;window.__r14CamStable=0}")
    try: page.wait_for_function("""() => {const s=window.Codeopolis?.phaserCity?.game?.scene?.getScene?.('CodeopolisCity'),cam=s?.cameras?.main;if(!cam)return false;const k=Math.round(cam.scrollX)+','+Math.round(cam.scrollY)+','+cam.zoom.toFixed(3);if(window.__r14CamKey===k){window.__r14CamStable=(window.__r14CamStable||0)+1}else{window.__r14CamKey=k;window.__r14CamStable=0}return window.__r14CamStable>=4}""",timeout=10000)
    except PlaywrightTimeoutError: pass
    page.wait_for_timeout(500)
def audit(page): return page.evaluate('() => window.Codeopolis.R14PlayerAcceptance.audit()')
def coding_audit(page): return page.evaluate('() => window.Codeopolis.R14PlayerAcceptance.codingAudit()')
def visible_map_points(page):
    return page.evaluate("""()=>{const C=Codeopolis,canvas=C.phaserCity?.game?.canvas,host=C.phaserCity?.host;if(!canvas||!host)return[];const r=canvas.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,points=[];for(let row=1;row<=11;row++)for(let col=1;col<=13;col++){const px=r.left+r.width*col/14,py=r.top+r.height*row/12;if(px<8||px>innerWidth-8||py<8||py>innerHeight-8)continue;const top=document.elementFromPoint(px,py),blocked=top?.closest?.('.r4-start-panel,.p1-catalog,.p1-placement-hud,button,ion-header,ion-tab-bar');if(blocked)continue;if(top!==canvas&&top!==host&&!host.contains(top))continue;points.push({px,py,d:(px-cx)*(px-cx)+(py-cy)*(py-cy),top:top?.tagName||null})}points.sort((a,b)=>a.d-b.d);return points.slice(0,40)}""")
def manual_first_build(page):
    acquired=page.evaluate("""()=>{const C=Codeopolis,s=C.game?.state||window.state;s.money=Math.max(5000,Number(s.money)||0);s.buildings=[...new Set([...(s.buildings||[]),'house','market','foundry','solar','park'])];C.phaserCity.catalog?.render?.();return C.phaserCity.catalog?.acquire?.('house')===true}""")
    if not acquired: fail(f"Could not acquire first building · {diagnostics(page)}")
    page.wait_for_function("()=>Codeopolis.game.world.world.tool?.mode==='building'&&Codeopolis.R14PlayerAcceptance?.currentView?.()==='city'",timeout=5000)
    page.wait_for_function("()=>{const p=document.querySelector('.p1-catalog');return !p||p.classList.contains('hidden')}",timeout=5000)
    page.wait_for_function("()=>{const c=Codeopolis.phaserCity?.game?.canvas,r=c?.getBoundingClientRect?.();return !!r&&r.width>100&&r.height>100}",timeout=5000)
    page.wait_for_timeout(350)
    points=visible_map_points(page)
    if not points: fail(f"No uncovered live-map screen point available for first building · {diagnostics(page)}")
    for pt in points:
        page.mouse.click(pt['px'],pt['py'])
        try:
            page.wait_for_function("()=>Codeopolis.game.world.placedBuildings().length===1",timeout=500)
            return
        except PlaywrightTimeoutError:
            continue
    fail(f"Visible pointer taps did not place first building · points={points[:8]} · {diagnostics(page)}")
def seed_operating_city(page):
    return page.evaluate("""()=>{const C=Codeopolis,s=C.game?.state||window.state,w=C.game?.world;s.money=Math.max(5000,Number(s.money)||0);s.population=Math.max(12,Number(s.population)||0);s.eraLevel=3;s.ageProgression=Object.assign({},s.ageProgression,{level:3});s.tech=[...new Set([...(s.tech||[]),'arrays','maps','search','energy','graphs'])];s.buildings=[...new Set([...(s.buildings||[]),'market','foundry','solar','park'])];const placements=[['market',8,2],['foundry',2,5],['solar',8,5],['park',5,2]],results=[];for(const[id,x,y]of placements){if(w.tile(x,y)?.buildingId)continue;results.push({id,...w.placeBuilding(id,x,y,{construction:false})})}for(let x=1;x<=10;x++)if(!w.tile(x,4)?.buildingId&&!w.tile(x,4)?.occupiedBy)w.setRoad(x,4,true);for(const[x,y]of[[2,3],[5,3],[8,3],[2,4],[5,4],[8,4]])if(!w.tile(x,y)?.buildingId&&!w.tile(x,y)?.occupiedBy)w.setRoad(x,y,true);w.world.selected=null;w.world.tool={mode:'inspect',buildingId:null};C.phaserCity?.catalog?.close?.();C.phaserCity?.manager?.close?.();C.phaserCity?.editing?.close?.();C.BuildingOperations?.sync?.(s,w);C.PopulationSimulation?.step?.(s,w,1);C.phaserCity?.game?.scene?.getScene?.('CodeopolisCity')?.refresh?.();C.R14PlayerAcceptance?.sync?.();return{results,placed:w.placedBuildings().length,roads:w.roadTiles().length}}""")
def run_viewport(browser,base_url,out_dir,name,width,height,deployed=False):
    mobile=name in ('phone_portrait','phone_landscape','tablet');context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,is_mobile=mobile,has_touch=mobile,service_workers='block');page=context.new_page();page_errors=[];severe_console=[]
    page.add_init_script("""() => {window.__r14CapturedWarnings=[];const original=console.warn.bind(console);console.warn=(...args)=>{try{window.__r14CapturedWarnings.push(args.map(v=>v instanceof Error?(v.stack||String(v)):String(v)).join(' '))}catch{}return original(...args)}}""")
    page.on('pageerror',lambda exc:(page_errors.append(str(exc)),print(f'PAGEERROR {name}: {exc}',flush=True)))
    def on_console(msg):
        text=msg.text
        if msg.type=='error' or 'Phaser city unavailable' in text: print(f'CONSOLE {name}: {text}',flush=True)
        if (msg.type=='error' or 'Phaser city unavailable' in text) and any(k in text for k in ('TypeError','ReferenceError','SyntaxError','Phaser city unavailable','Uncaught')): severe_console.append(text)
    page.on('console',on_console);sep='&' if '?' in base_url else '?';url=f"{base_url}{sep}r14qa=1&viewport={name}&t={int(time.time()*1000)}";page.goto(url,wait_until='domcontentloaded',timeout=90000);page.wait_for_selector('body',timeout=15000)
    if mobile: page.wait_for_selector('#codeopolisIonicShell',state='visible',timeout=15000)
    switch_city(page);wait_city(page);vp_dir=out_dir/name;vp_dir.mkdir(parents=True,exist_ok=True)
    fresh=audit(page)
    if fresh['mode']!=name: fail(f"{name}: viewport classified as {fresh['mode']} · {diagnostics(page)}")
    if fresh['renderer']!='phaser' or fresh['legacyVisible']: fail(f"{name}: Phaser does not own city: {fresh} · {diagnostics(page)}")
    if fresh['overflowX']>4: fail(f"{name}: horizontal overflow {fresh['overflowX']}px · {diagnostics(page)}")
    if not fresh['manualStart'] or fresh['placed']!=0 or fresh['roads']!=0: fail(f"{name}: fresh save is not empty land: {fresh} · {diagnostics(page)}")
    if not page.locator('.r4-start-panel').is_visible(): fail(f"{name}: first-run panel missing · {diagnostics(page)}")
    hittable=page.evaluate("""()=>{const b=document.querySelector('[data-r4-earn]');if(!b)return false;const r=b.getBoundingClientRect(),top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return top===b||!!top?.closest?.('[data-r4-earn]')}""")
    if not hittable: fail(f"{name}: first-run resource button is covered by another layer · {diagnostics(page)}")
    clutter=page.evaluate("""()=>[...document.querySelectorAll('#phaserCityHost [class*="-fab"],#phaserCityHost [class*="-hud"],#phaserCityHost .phase44-camera-controls')].filter(e=>getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>1).map(e=>e.className)""")
    if clutter: fail(f"{name}: first-run city has competing controls: {clutter} · {diagnostics(page)}")
    snap(page,vp_dir/'01-empty-land.png');page.locator('[data-r4-earn]').click();page.wait_for_function("()=>(Codeopolis.game?.state||window.state)?.r4Construction?.stage==='solve'",timeout=10000);page.wait_for_function("()=>Codeopolis.R14PlayerAcceptance?.currentView?.()==='challenge'",timeout=10000);page.wait_for_selector('#challengeTab textarea',state='visible',timeout=15000);page.wait_for_timeout(350)
    if page.locator('.r4-start-panel').is_visible(): fail(f"{name}: R4 onboarding covers coding workspace · {diagnostics(page)}")
    coding=coding_audit(page)
    if not coding['pass']: fail(f"{name}: coding surface audit failed: {coding['issues']} · {diagnostics(page)}")
    snap(page,vp_dir/'02-coding-mission.png')
    page.evaluate("""()=>{const C=Codeopolis,s=C.game?.state||window.state;C.ConceptResources.award(s,{challenge:{district:'arrays',difficulty:'easy',pattern:'Foundations'},concept:'R14 starter',rewardOverride:{resourceId:'materials',amount:12}});s.money=Math.max(5000,Number(s.money)||0)}""");page.wait_for_function("()=>(Codeopolis.game?.state||window.state)?.r4Construction?.stage==='build'",timeout=10000);wait_city(page);snap(page,vp_dir/'03-build-ready.png')
    manual_first_build(page);page.wait_for_timeout(350)
    if page.locator('.r4-start-panel').count(): fail(f"{name}: onboarding did not clear after manually placing first building · {diagnostics(page)}")
    seeded=seed_operating_city(page)
    if seeded['placed']<4 or seeded['roads']<4: fail(f"{name}: representative city setup failed: {seeded} · {diagnostics(page)}")
    page.wait_for_timeout(700);operating=audit(page)
    if not operating['pass']: fail(f"{name}: operating city audit failed: {operating['issues']} · live={diagnostics(page)}")
    if operating.get('legacyCards',0): fail(f"{name}: legacy dashboard cards remain over operating city · {diagnostics(page)}")
    snap(page,vp_dir/'04-operating-city.png');page.wait_for_selector('.r13-campaign-fab',state='visible',timeout=25000);page.locator('.r13-campaign-fab').click();page.wait_for_selector('.r13-campaign-panel.show',timeout=5000);snap(page,vp_dir/'05-interview-campaign.png');page.wait_for_selector('.r12-custom-fab',state='visible',timeout=15000);page.locator('.r12-custom-fab').click();page.wait_for_selector('.r12-custom-panel.show',timeout=5000)
    if page.locator('.r13-campaign-panel.show').count(): fail(f"{name}: campaign and customization panels overlap · {diagnostics(page)}")
    snap(page,vp_dir/'06-customization.png');before=page.evaluate("()=>({w:Codeopolis.game.world.world.width,h:Codeopolis.game.world.world.height})");result=page.evaluate("()=>Codeopolis.game.world.expandCity?.({free:true})")
    if not result or not result.get('ok'): fail(f"{name}: city expansion failed: {result} · {diagnostics(page)}")
    page.wait_for_function("([w,h])=>{const C=Codeopolis,s=C.phaserCity.game.scene.getScene('CodeopolisCity');return C.game.world.world.width>w&&C.game.world.world.height>h&&s.layout.width===C.game.world.world.width}",arg=[before['w'],before['h']],timeout=10000);page.wait_for_timeout(500);expansion=page.evaluate("""()=>{const C=Codeopolis,s=C.phaserCity.game.scene.getScene('CodeopolisCity'),b=s.cameras.main._bounds;return{world:{w:C.game.world.world.width,h:C.game.world.world.height},layout:{w:s.layout.worldWidth,h:s.layout.worldHeight},bounds:{w:b?.width||0,h:b?.height||0},audit:C.R14PlayerAcceptance.audit()}}""")
    if expansion['bounds']['w'] and abs(expansion['bounds']['w']-expansion['layout']['w'])>2: fail(f"{name}: camera bounds stale after expansion: {expansion} · {diagnostics(page)}")
    if not expansion['audit']['pass']: fail(f"{name}: expanded city audit failed: {expansion['audit']['issues']} · {diagnostics(page)}")
    snap(page,vp_dir/'07-expanded-city.png')
    if page_errors: fail(f"{name}: page errors: {page_errors} · {diagnostics(page)}")
    if severe_console: fail(f"{name}: severe console errors: {severe_console} · {diagnostics(page)}")
    build_info=page.evaluate("async()=>await(await fetch('build-info.json',{cache:'no-store'})).json()") if deployed else None;context.close();return{'viewport':name,'size':[width,height],'fresh':fresh,'coding':coding,'operating':operating,'seeded':seeded,'expansion':expansion,'buildInfo':build_info,'screenshots':7}
def main():
    p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--out',default='artifacts/r14-clean');p.add_argument('--deployed',action='store_true');args=p.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True);report={'url':args.url,'deployed':args.deployed,'viewports':{},'pass':False}
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True)
        try:
            for name,(w,h) in VIEWPORTS.items(): report['viewports'][name]=run_viewport(browser,args.url,out,name,w,h,args.deployed)
            report['pass']=True
        finally: browser.close()
    (out/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps({'pass':report['pass'],'viewports':list(report['viewports']),'url':args.url,'deployed':args.deployed,'screenshots':sum(v['screenshots'] for v in report['viewports'].values())},indent=2))
if __name__=='__main__': main()
