#!/usr/bin/env python3
import argparse, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

VIEWPORTS={'phone_portrait':(390,844),'phone_landscape':(844,390),'tablet':(834,1112),'desktop':(1440,1000),'wide_desktop':(1920,1080)}
def fail(message): raise AssertionError(message)
def switch_city(page): page.evaluate("""() => {if(typeof window.switchTab==='function')window.switchTab('city');else document.querySelector('.tabs button[data-tab="city"]')?.click()}""")
def diagnostics(page):
    return page.evaluate("""() => {
      const C=window.Codeopolis,s=C?.phaserCity?.game?.scene?.getScene?.('CodeopolisCity');let lexicalState={};
      try{lexicalState={defined:typeof state!=='undefined',truthy:typeof state!=='undefined'&&!!state}}catch(e){lexicalState={defined:false,error:String(e)}}
      const required=['WorldSystem','IsoCamera','CitySimulation','CityRenderer','AudioSystem','RewardEngine','GameUI','PhaserCivilizationBootstrap'];
      return {codeopolis:!!C,game:!!C?.game,gameState:!!C?.game?.state,gameWorld:!!C?.game?.world,bootstrap:C?.GameBootstrapStatus||null,lexicalState,windowState:!!window.state,
        modules:Object.fromEntries(required.map(k=>[k,!!C?.get?.(k)])),phaserCity:!!C?.phaserCity,host:!!C?.phaserCity?.host,scene:!!s,active:!!s?.sys?.isActive?.(),sleeping:!!s?.scene?.isSleeping?.(),paused:!!s?.scene?.isPaused?.(),
        r14:!!C?.R14PlayerAcceptance,r14Script:!!document.querySelector('script[data-r14-player-acceptance]'),legacyCanvas:!!document.getElementById('cityCanvas'),legacyDisplay:document.getElementById('cityCanvas')?.style?.display||'',
        view:document.querySelector('#codeopolisIonicShell')?.dataset?.view||document.querySelector('.tabs button.active[data-tab]')?.dataset?.tab||null,phaser:window.Phaser?.VERSION||null,
        r1:C?.R1ProductionAudit?{renderer:C.R1ProductionAudit.rendererSnapshot?.(),events:C.R1ProductionAudit.runtime?.loadEvents?.slice?.(-8),fallback:C.R1ProductionAudit.runtime?.fallbackReason}:null};
    }""")
def wait_city(page):
    try: page.wait_for_function("""() => {const C=window.Codeopolis,s=C?.phaserCity?.game?.scene?.getScene?.('CodeopolisCity');return !!C?.phaserCity?.host&&!!s}""",timeout=60000)
    except PlaywrightTimeoutError: fail(f"City renderer never created: {diagnostics(page)}")
    switch_city(page)
    try: page.wait_for_function("""() => {const C=window.Codeopolis,s=C?.phaserCity?.game?.scene?.getScene?.('CodeopolisCity');return !!s?.sys?.isActive?.()}""",timeout=12000)
    except PlaywrightTimeoutError: fail(f"City scene exists but did not wake for City view: {diagnostics(page)}")
    try: page.wait_for_function("() => !!window.Codeopolis?.R14PlayerAcceptance",timeout=12000)
    except PlaywrightTimeoutError: fail(f"R14 player auditor did not auto-load: {diagnostics(page)}")
    page.wait_for_timeout(700)
def audit(page): return page.evaluate('() => window.Codeopolis.R14PlayerAcceptance.audit()')
def canvas_point(page,x,y): return page.evaluate("""([x,y])=>{const C=Codeopolis,s=C.phaserCity.game.scene.getScene('CodeopolisCity'),c=s.cameras.main,p=s.toWorld(x,y),r=s.game.canvas.getBoundingClientRect();return{x:r.left+(p.x-c.scrollX)*c.zoom,y:r.top+(p.y-c.scrollY)*c.zoom}}""",[x,y])
def manual_first_build(page):
    page.evaluate("""()=>{const C=Codeopolis,s=C.game?.state||window.state;s.money=Math.max(5000,Number(s.money)||0);s.buildings=[...new Set([...(s.buildings||[]),'house','market','foundry','solar','park'])];C.phaserCity.catalog?.render?.();C.phaserCity.catalog?.acquire?.('house')}""")
    page.wait_for_function("()=>Codeopolis.game.world.world.tool?.mode==='building'",timeout=5000);pt=canvas_point(page,5,5);page.mouse.click(pt['x'],pt['y']);page.wait_for_function("()=>Codeopolis.game.world.placedBuildings().length===1",timeout=8000)
def seed_operating_city(page):
    return page.evaluate("""()=>{const C=Codeopolis,s=C.game?.state||window.state,w=C.game?.world;s.money=Math.max(5000,Number(s.money)||0);s.population=Math.max(12,Number(s.population)||0);s.eraLevel=3;s.ageProgression=Object.assign({},s.ageProgression,{level:3});s.tech=[...new Set([...(s.tech||[]),'arrays','maps','search','energy','graphs'])];s.buildings=[...new Set([...(s.buildings||[]),'market','foundry','solar','park'])];const placements=[['market',8,2],['foundry',2,5],['solar',8,5],['park',5,2]],results=[];for(const[id,x,y]of placements){if(w.tile(x,y)?.buildingId)continue;results.push({id,...w.placeBuilding(id,x,y,{construction:false})})}for(let x=1;x<=10;x++)if(!w.tile(x,4)?.buildingId&&!w.tile(x,4)?.occupiedBy)w.setRoad(x,4,true);for(const[x,y]of[[2,3],[5,3],[8,3],[2,4],[5,4],[8,4]])if(!w.tile(x,y)?.buildingId&&!w.tile(x,y)?.occupiedBy)w.setRoad(x,y,true);C.BuildingOperations?.sync?.(s,w);C.PopulationSimulation?.step?.(s,w,1);C.phaserCity?.game?.scene?.getScene?.('CodeopolisCity')?.refresh?.();C.R14PlayerAcceptance?.sync?.();return{results,placed:w.placedBuildings().length,roads:w.roadTiles().length}}""")
def run_viewport(browser,base_url,out_dir,name,width,height,deployed=False):
    mobile=name in ('phone_portrait','phone_landscape','tablet');context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,is_mobile=mobile,has_touch=mobile,service_workers='block');page=context.new_page();page_errors=[];severe_console=[]
    page.on('pageerror',lambda exc:(page_errors.append(str(exc)),print(f'PAGEERROR {name}: {exc}',flush=True)))
    def on_console(msg):
        text=msg.text
        if msg.type=='error': print(f'CONSOLE {name}: {text}',flush=True)
        if msg.type=='error' and any(k in text for k in ('TypeError','ReferenceError','SyntaxError','Phaser city unavailable','Uncaught')): severe_console.append(text)
    page.on('console',on_console);sep='&' if '?' in base_url else '?';url=f"{base_url}{sep}r14qa=1&audit=1&viewport={name}&t={int(time.time()*1000)}";page.goto(url,wait_until='domcontentloaded',timeout=90000);page.wait_for_selector('body',timeout=15000);switch_city(page);wait_city(page);vp_dir=out_dir/name;vp_dir.mkdir(parents=True,exist_ok=True)
    fresh=audit(page)
    if fresh['mode']!=name: fail(f"{name}: viewport classified as {fresh['mode']}")
    if fresh['renderer']!='phaser' or fresh['legacyVisible']: fail(f"{name}: Phaser does not own city: {fresh}")
    if fresh['overflowX']>4: fail(f"{name}: horizontal overflow {fresh['overflowX']}px")
    if not fresh['manualStart'] or fresh['placed']!=0 or fresh['roads']!=0: fail(f"{name}: fresh save is not empty land: {fresh}")
    if not page.locator('.r4-start-panel').is_visible(): fail(f"{name}: first-run panel missing")
    clutter=page.evaluate("""()=>[...document.querySelectorAll('#phaserCityHost [class*="-fab"],#phaserCityHost [class*="-hud"],#phaserCityHost .phase44-camera-controls')].filter(e=>getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>1).map(e=>e.className)""")
    if clutter: fail(f"{name}: first-run city has competing controls: {clutter}")
    page.locator('#phaserCityHost').screenshot(path=str(vp_dir/'01-empty-land.png'));page.locator('[data-r4-earn]').click();page.wait_for_function("()=>(Codeopolis.game?.state||window.state)?.r4Construction?.stage==='solve'",timeout=10000);page.screenshot(path=str(vp_dir/'02-coding-mission.png'),full_page=True)
    page.evaluate("""()=>{const C=Codeopolis,s=C.game?.state||window.state;C.events.emit('learning:resource-earned',{resourceId:'materials',amount:12,source:'r14-browser-acceptance'});s.money=Math.max(5000,Number(s.money)||0)}""");switch_city(page);page.wait_for_function("()=>(Codeopolis.game?.state||window.state)?.r4Construction?.stage==='build'",timeout=10000);page.wait_for_timeout(350);page.locator('#phaserCityHost').screenshot(path=str(vp_dir/'03-build-ready.png'))
    manual_first_build(page);page.wait_for_timeout(350)
    if page.locator('.r4-start-panel').count(): fail(f"{name}: onboarding did not clear after manually placing first building")
    seeded=seed_operating_city(page)
    if seeded['placed']<4 or seeded['roads']<4: fail(f"{name}: representative city setup failed: {seeded}")
    page.wait_for_timeout(600);operating=audit(page)
    if not operating['pass']: fail(f"{name}: operating city audit failed: {operating['issues']}")
    page.locator('#phaserCityHost').screenshot(path=str(vp_dir/'04-operating-city.png'));page.wait_for_selector('.r13-campaign-fab',state='visible',timeout=25000);page.locator('.r13-campaign-fab').click();page.wait_for_selector('.r13-campaign-panel.show',timeout=5000);page.locator('#phaserCityHost').screenshot(path=str(vp_dir/'05-interview-campaign.png'));page.wait_for_selector('.r12-custom-fab',state='visible',timeout=15000);page.locator('.r12-custom-fab').click();page.wait_for_selector('.r12-custom-panel.show',timeout=5000)
    if page.locator('.r13-campaign-panel.show').count(): fail(f"{name}: campaign and customization panels overlap")
    page.locator('#phaserCityHost').screenshot(path=str(vp_dir/'06-customization.png'));before=page.evaluate("()=>({w:Codeopolis.game.world.world.width,h:Codeopolis.game.world.world.height})");result=page.evaluate("()=>Codeopolis.game.world.expandCity?.({free:true})")
    if not result or not result.get('ok'): fail(f"{name}: city expansion failed: {result}")
    page.wait_for_function("([w,h])=>{const C=Codeopolis,s=C.phaserCity.game.scene.getScene('CodeopolisCity');return C.game.world.world.width>w&&C.game.world.world.height>h&&s.layout.width===C.game.world.world.width}",arg=[before['w'],before['h']],timeout=10000);page.wait_for_timeout(500);expansion=page.evaluate("""()=>{const C=Codeopolis,s=C.phaserCity.game.scene.getScene('CodeopolisCity'),b=s.cameras.main._bounds;return{world:{w:C.game.world.world.width,h:C.game.world.world.height},layout:{w:s.layout.worldWidth,h:s.layout.worldHeight},bounds:{w:b?.width||0,h:b?.height||0},audit:C.R14PlayerAcceptance.audit()}}""")
    if expansion['bounds']['w'] and abs(expansion['bounds']['w']-expansion['layout']['w'])>2: fail(f"{name}: camera bounds stale after expansion: {expansion}")
    if not expansion['audit']['pass']: fail(f"{name}: expanded city audit failed: {expansion['audit']['issues']}")
    page.locator('#phaserCityHost').screenshot(path=str(vp_dir/'07-expanded-city.png'))
    if page_errors: fail(f"{name}: page errors: {page_errors}")
    if severe_console: fail(f"{name}: severe console errors: {severe_console}")
    build_info=page.evaluate("async()=>await(await fetch('build-info.json',{cache:'no-store'})).json()") if deployed else None;context.close();return{'viewport':name,'size':[width,height],'fresh':fresh,'operating':operating,'seeded':seeded,'expansion':expansion,'buildInfo':build_info,'screenshots':7}
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
