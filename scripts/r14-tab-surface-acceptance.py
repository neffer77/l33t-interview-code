#!/usr/bin/env python3
import argparse, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

TABS=['challenge','learning','mock','city','build','research','events','stats']
SECONDARY={'learning','mock','build','research','events','stats'}

def fail(message): raise AssertionError(message)

def snapshot(page,tab):
    return page.evaluate("""tab=>{
      const visible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.01&&r.width>1&&r.height>1};
      const box=el=>{const r=el?.getBoundingClientRect?.();return r?{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),bottom:Math.round(r.bottom)}:null};
      const app=document.querySelector('main.app'),layout=document.querySelector('.layout'),panel=document.querySelector('.layout>section.panel'),active=document.getElementById(tab+'Tab'),p29=document.getElementById('phase29InterviewDay'),p30=document.getElementById('phase30Remediation'),host=window.Codeopolis?.phaserCity?.host||document.getElementById('phaserCityHost'),legacy=document.getElementById('cityCanvas'),cityStage=document.querySelector('.layout>section.panel>.city-stage'),sectionTitle=document.querySelector('.layout>section.panel>.section-title'),sidebar=document.querySelector('.layout>.sidebar');
      return {
        tab,
        activeButton:document.querySelector('.tabs button.active[data-tab]')?.dataset?.tab||null,
        primaryWorkspace:document.body.dataset.primaryWorkspace||null,
        body:document.body.className,
        viewport:{w:innerWidth,h:innerHeight},
        app:box(app),layout:box(layout),panel:box(panel),active:box(active),
        activeVisible:visible(active),
        sectionTitleVisible:visible(sectionTitle),sidebarVisible:visible(sidebar),
        cityPreviewVisible:visible(legacy)||visible(cityStage),
        interview:{visible:visible(p29),hidden:!!p29?.hidden,parent:p29?.parentElement?.id||p29?.parentElement?.className||null,box:box(p29)},
        remediation:{visible:visible(p30),hidden:!!p30?.hidden,parent:p30?.parentElement?.id||p30?.parentElement?.className||null,box:box(p30)},
        city:{visible:visible(host),hidden:!!host?.hidden,display:host?getComputedStyle(host).display:null,box:box(host)},
        directCompetition:[...document.querySelectorAll('main.app > #phase29InterviewDay,main.app > #phase30Remediation')].filter(visible).map(el=>el.id)
      };
    }""",tab)

def switch(page,tab):
    page.evaluate("tab=>window.switchTab?.(tab)",tab)
    page.wait_for_function("tab=>document.querySelector('.tabs button.active[data-tab]')?.dataset.tab===tab",arg=tab,timeout=5000)
    page.wait_for_function("tab=>document.body.dataset.primaryWorkspace===tab",arg=tab,timeout=5000)
    page.wait_for_timeout(180)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--url',required=True);ap.add_argument('--out',required=True);args=ap.parse_args()
    out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    report={}
    with sync_playwright() as p:
      browser=p.chromium.launch()
      context=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1,service_workers='block')
      page=context.new_page();errors=[];page.on('pageerror',lambda exc: errors.append(str(exc)))
      sep='&' if '?' in args.url else '?';page.goto(f"{args.url}{sep}r14qa=1&tabOwnership=2&t={int(time.time()*1000)}",wait_until='domcontentloaded',timeout=90000)
      page.wait_for_selector('.tabs button[data-tab="mock"]',timeout=15000)
      try:
        page.wait_for_function("()=>!!window.Codeopolis?.game?.phase29?.ui&&!!window.Codeopolis?.TabSurfaceOwnership&&!!document.getElementById('phase29InterviewDay')&&!!document.getElementById('phase30Remediation')",timeout=30000)
      except PlaywrightTimeoutError:
        fail('Interview surfaces / persistent ownership controller did not boot')
      page.evaluate("()=>document.querySelector('.phase43-start')?.remove()")
      page.wait_for_timeout(350)

      parents=page.evaluate("""()=>({p29:document.getElementById('phase29InterviewDay')?.parentElement?.id||null,p30:document.getElementById('phase30Remediation')?.parentElement?.id||null})""")
      if parents!={'p29':'mockTab','p30':'mockTab'}: fail(f'Interview surfaces are not owned by Mock: {parents}')

      for tab in TABS:
        switch(page,tab)
        s=snapshot(page,tab);report[tab]=s
        if s['activeButton']!=tab or s['primaryWorkspace']!=tab: fail(f'{tab}: active workspace state lost: {s}')
        if s['directCompetition']: fail(f'{tab}: standalone panels still compete with layout: {s}')
        if not s['layout'] or s['layout']['h']<700: fail(f'{tab}: primary layout is still vertically minimized: {s}')
        if tab=='city':
          if not s['city']['visible'] or not s['city']['box'] or s['city']['box']['h']<500: fail(f'city: renderer does not own play surface: {s}')
        else:
          min_height=650 if tab in SECONDARY else 420
          if not s['activeVisible'] or not s['active'] or s['active']['h']<min_height: fail(f'{tab}: selected tab does not own usable workspace: {s}')
        if tab in SECONDARY:
          if s['cityPreviewVisible']: fail(f'{tab}: dormant city preview still consumes workspace: {s}')
          if s['sectionTitleVisible']: fail(f'{tab}: civilization title still consumes focused workspace: {s}')
          if s['sidebarVisible']: fail(f'{tab}: Mission Control still competes with focused workspace: {s}')
        if tab=='mock':
          if not s['interview']['visible'] or s['interview']['parent']!='mockTab': fail(f'mock: Interview Day is not inside Mock: {s}')
          if not s['remediation']['visible'] or s['remediation']['parent']!='mockTab': fail(f'mock: remediation is not inside Mock: {s}')
        else:
          if s['interview']['visible'] or s['remediation']['visible']: fail(f'{tab}: Mock-only panels leaked into selected tab: {s}')
        page.screenshot(path=str(out/f'{tab}.png'),full_page=False)

      # Reproduce the live failure: a late legacy bootstrap escapes both Mock-only
      # sections and wakes the dormant City host while Learn is active. The guard
      # must repair ownership without a reload or a Phase 29 refresh.
      switch(page,'learning')
      page.evaluate("""()=>{
        const app=document.querySelector('main.app');
        for(const id of ['phase29InterviewDay','phase30Remediation']){
          const el=document.getElementById(id);if(!el)continue;
          app.appendChild(el);el.hidden=false;el.classList.remove('hidden');el.style.display='block';el.style.visibility='visible';
        }
        const city=window.Codeopolis?.phaserCity?.host||document.getElementById('phaserCityHost');
        if(city){city.hidden=false;city.style.display='block';city.style.visibility='visible';}
      }""")
      page.wait_for_function("""()=>{
        const p29=document.getElementById('phase29InterviewDay'),p30=document.getElementById('phase30Remediation'),city=window.Codeopolis?.phaserCity?.host||document.getElementById('phaserCityHost');
        return p29?.parentElement?.id==='mockTab'&&p30?.parentElement?.id==='mockTab'&&p29.hidden&&p30.hidden&&(!city||city.hidden||getComputedStyle(city).display==='none');
      }""",timeout=5000)
      repaired=snapshot(page,'learning');report['forced_escape_repaired']=repaired
      if repaired['interview']['visible'] or repaired['remediation']['visible'] or repaired['city']['visible'] or repaired['directCompetition']:
        fail(f'Persistent ownership controller did not repair forced late escape: {repaired}')
      page.screenshot(path=str(out/'forced-escape-repaired.png'),full_page=False)

      switch(page,'mock')
      recovered=snapshot(page,'mock');report['mock_after_forced_escape']=recovered
      if not recovered['interview']['visible'] or not recovered['remediation']['visible']:
        fail(f'Mock surfaces did not recover after forced escape repair: {recovered}')
      page.screenshot(path=str(out/'mock-after-forced-escape.png'),full_page=False)

      if errors: fail(f'Page errors during tab ownership acceptance: {errors}')
      (out/'report.json').write_text(json.dumps(report,indent=2))
      context.close();browser.close()
    print('R14 tab surface ownership acceptance passed')

if __name__=='__main__': main()
