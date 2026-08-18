#!/usr/bin/env python3
import argparse, json, time
from pathlib import Path
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

VIEWPORTS = {
    'phone_portrait': (390, 844),
    'phone_landscape': (844, 390),
    'tablet': (834, 1112),
    'desktop': (1440, 1000),
    'wide_desktop': (1920, 1080),
}

def fail(message):
    raise AssertionError(message)

def switch_city(page):
    page.evaluate("""() => {
      if (typeof window.switchTab === 'function') window.switchTab('city');
      else document.querySelector('.tabs button[data-tab="city"]')?.click();
    }""")

def wait_city(page):
    page.wait_for_function("""() => {
      const C=window.Codeopolis;
      const s=C?.phaserCity?.game?.scene?.getScene?.('CodeopolisCity');
      return !!C?.phaserCity?.host && !!s?.sys?.isActive?.() && !!C?.R14PlayerAcceptance;
    }""", timeout=60000)
    page.wait_for_timeout(900)

def seed_operating_city(page):
    return page.evaluate("""() => {
      const C=window.Codeopolis,s=C.game?.state||window.state,w=C.game?.world;
      const ids=['camp','house','market','foundry','solar','park'];
      s.buildings=[...new Set([...(s.buildings||[]),...ids])];
      s.money=Math.max(800,Number(s.money)||0);s.population=Math.max(12,Number(s.population)||0);s.eraLevel=3;
      s.ageProgression=Object.assign({},s.ageProgression,{level:3});s.tech=[...new Set([...(s.tech||[]),'foundational_engineering','indexed_data','graph_traversal'])];
      const placements=[['camp',5,2],['house',2,2],['market',8,2],['foundry',2,5],['park',5,5],['solar',8,5]],results=[];
      for(const [id,x,y] of placements){if(w.tile(x,y)?.buildingId)continue;results.push({id,...w.placeBuilding(id,x,y,{construction:false})})}
      for(let x=1;x<=10;x++)if(!w.tile(x,4)?.buildingId)w.setRoad(x,4,true);
      for(const [x,y] of [[2,3],[5,3],[8,3],[2,4],[5,4],[8,4]])if(!w.tile(x,y)?.buildingId)w.setRoad(x,y,true);
      C.BuildingOperations?.sync?.(s,w);C.PopulationSimulation?.step?.(s,w,1);
      const sc=C.phaserCity?.game?.scene?.getScene?.('CodeopolisCity');sc?.refresh?.();C.R14PlayerAcceptance?.sync?.();
      return {results,placed:w.placedBuildings().length,roads:w.roadTiles().length};
    }""")

def run_viewport(browser, base_url, out_dir, name, width, height, deployed=False):
    mobile = name in ('phone_portrait','phone_landscape','tablet')
    context = browser.new_context(viewport={'width':width,'height':height}, device_scale_factor=1, is_mobile=mobile, has_touch=mobile)
    page = context.new_page(); page_errors=[]; severe_console=[]
    page.on('pageerror', lambda exc: page_errors.append(str(exc)))
    def console(msg):
        text=msg.text
        if msg.type=='error' and any(k in text for k in ('TypeError','ReferenceError','SyntaxError','Phaser city unavailable','Uncaught')): severe_console.append(text)
    page.on('console', console)
    sep='&' if '?' in base_url else '?'; url=f"{base_url}{sep}r14qa=1&viewport={name}&t={int(time.time()*1000)}"
    page.goto(url, wait_until='domcontentloaded', timeout=90000)
    page.wait_for_selector('body', timeout=15000); switch_city(page); wait_city(page)
    vp_dir=out_dir/name; vp_dir.mkdir(parents=True, exist_ok=True)
    audit=page.evaluate('() => window.Codeopolis.R14PlayerAcceptance.audit()')
    if audit['mode'] != name: fail(f"{name}: runtime classified viewport as {audit['mode']}")
    if audit['renderer'] != 'phaser' or audit['legacyVisible']: fail(f"{name}: Phaser renderer did not own the city: {audit}")
    if audit['overflowX'] > 4: fail(f"{name}: horizontal document overflow {audit['overflowX']}px")
    if not audit['manualStart'] or audit['placed'] != 0 or audit['roads'] != 0: fail(f"{name}: fresh player did not start from empty land: {audit}")
    if not page.locator('.r4-start-panel').is_visible(): fail(f"{name}: empty-land onboarding panel missing")
    hidden = page.evaluate("""() => ['.p1-build-fab','.r12-custom-fab','.r13-campaign-fab','.phase44-camera-controls'].every(s=>{const e=document.querySelector(s);return !e||getComputedStyle(e).display==='none'})""")
    if not hidden: fail(f"{name}: secondary city controls compete with first-run onboarding")
    page.locator('#phaserCityHost').screenshot(path=str(vp_dir/'01-empty-land.png'))
    page.locator('[data-r4-earn]').click(); page.wait_for_function("() => (window.Codeopolis.game?.state||window.state)?.r4Construction?.stage==='solve'", timeout=10000)
    page.screenshot(path=str(vp_dir/'02-coding-mission.png'), full_page=True)
    page.evaluate("""() => {const C=window.Codeopolis,s=C.game?.state||window.state;C.ConceptResources?.award?.(s,{challenge:{id:'r14-array-warmup',title:'R14 Array Warmup',pattern:'array',diff:'medium'},firstSolve:true});if(s.r4Construction?.stage!=='build')C.events?.emit?.('learning:resource-earned',{resourceId:'materials',amount:12});} """)
    switch_city(page); page.wait_for_function("() => (window.Codeopolis.game?.state||window.state)?.r4Construction?.stage==='build'", timeout=10000)
    page.wait_for_timeout(250)
    seeded=seed_operating_city(page)
    if seeded['placed'] < 3 or seeded['roads'] < 4: fail(f"{name}: representative city setup failed: {seeded}")
    page.wait_for_function("() => !document.querySelector('.r4-start-panel')", timeout=10000); page.wait_for_timeout(500)
    operating=page.evaluate('() => window.Codeopolis.R14PlayerAcceptance.audit()')
    if not operating['pass']: fail(f"{name}: operating city audit failed: {operating['issues']}")
    page.locator('#phaserCityHost').screenshot(path=str(vp_dir/'03-operating-city.png'))
    page.wait_for_selector('.r13-campaign-fab', state='visible', timeout=20000); page.locator('.r13-campaign-fab').click(); page.wait_for_selector('.r13-campaign-panel.show', timeout=5000)
    page.locator('#phaserCityHost').screenshot(path=str(vp_dir/'04-interview-campaign.png'))
    page.wait_for_selector('.r12-custom-fab', state='visible', timeout=10000); page.locator('.r12-custom-fab').click(); page.wait_for_selector('.r12-custom-panel.show', timeout=5000)
    if page.locator('.r13-campaign-panel.show').count(): fail(f"{name}: campaign and customization panels overlap instead of behaving exclusively")
    page.locator('#phaserCityHost').screenshot(path=str(vp_dir/'05-customization.png'))
    expansion=page.evaluate("""() => {const C=window.Codeopolis,w=C.game.world,r=w.expandCity?.({free:true});const s=C.phaserCity.game.scene.getScene('CodeopolisCity');s.refresh();C.R14PlayerAcceptance.sync();return{r,a:C.R14PlayerAcceptance.audit(),layout:{width:s.layout.worldWidth,height:s.layout.worldHeight},bounds:{width:s.cameras.main._bounds?.width||0,height:s.cameras.main._bounds?.height||0}}} """)
    if not expansion['r'] or not expansion['r'].get('ok'): fail(f"{name}: R12 expansion could not be exercised")
    if expansion['bounds']['width'] and abs(expansion['bounds']['width']-expansion['layout']['width'])>2: fail(f"{name}: camera bounds did not update after expansion")
    page.locator('#phaserCityHost').screenshot(path=str(vp_dir/'06-expanded-city.png'))
    if page_errors: fail(f"{name}: page errors: {page_errors}")
    if severe_console: fail(f"{name}: severe console errors: {severe_console}")
    build_info=None
    if deployed:
        try: build_info=page.evaluate("async () => await (await fetch('build-info.json',{cache:'no-store'})).json()")
        except Exception as exc: fail(f"{name}: deployed build-info.json unavailable: {exc}")
    context.close()
    return {'viewport':name,'size':[width,height],'fresh':audit,'operating':operating,'seeded':seeded,'expansion':expansion,'buildInfo':build_info,'screenshots':6}

def main():
    p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--out',default='artifacts/r14-acceptance');p.add_argument('--deployed',action='store_true');args=p.parse_args()
    out=Path(args.out);out.mkdir(parents=True,exist_ok=True); report={'url':args.url,'deployed':args.deployed,'viewports':{},'pass':False}
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True)
        try:
            for name,(w,h) in VIEWPORTS.items(): report['viewports'][name]=run_viewport(browser,args.url,out,name,w,h,args.deployed)
            report['pass']=True
        finally: browser.close()
    (out/'report.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({'pass':report['pass'],'viewports':list(report['viewports']),'url':args.url,'deployed':args.deployed},indent=2))

if __name__=='__main__': main()
