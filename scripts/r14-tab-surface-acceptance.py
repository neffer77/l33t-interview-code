#!/usr/bin/env python3
import argparse, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

TABS=['challenge','learning','mock','city','build','research','events','stats']

def fail(message): raise AssertionError(message)

def snapshot(page,tab):
    return page.evaluate("""tab=>{
      const visible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.01&&r.width>1&&r.height>1};
      const box=el=>{const r=el?.getBoundingClientRect?.();return r?{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),bottom:Math.round(r.bottom)}:null};
      const app=document.querySelector('main.app'),layout=document.querySelector('.layout'),panel=document.querySelector('.layout>section.panel'),active=document.getElementById(tab+'Tab'),p29=document.getElementById('phase29InterviewDay'),p30=document.getElementById('phase30Remediation'),host=window.Codeopolis?.phaserCity?.host;
      return {
        tab,
        activeButton:document.querySelector('.tabs button.active[data-tab]')?.dataset?.tab||null,
        body:document.body.className,
        viewport:{w:innerWidth,h:innerHeight},
        app:box(app),layout:box(layout),panel:box(panel),active:box(active),
        activeVisible:visible(active),
        interview:{visible:visible(p29),parent:p29?.parentElement?.id||p29?.parentElement?.className||null,box:box(p29)},
        remediation:{visible:visible(p30),parent:p30?.parentElement?.id||p30?.parentElement?.className||null,box:box(p30)},
        city:{visible:visible(host),box:box(host)},
        directCompetition:[...document.querySelectorAll('main.app > #phase29InterviewDay,main.app > #phase30Remediation')].filter(visible).map(el=>el.id)
      };
    }""",tab)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--url',required=True);ap.add_argument('--out',required=True);args=ap.parse_args()
    out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    report={}
    with sync_playwright() as p:
      browser=p.chromium.launch()
      context=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1,service_workers='block')
      page=context.new_page();errors=[];page.on('pageerror',lambda exc: errors.append(str(exc)))
      sep='&' if '?' in args.url else '?';page.goto(f"{args.url}{sep}r14qa=1&tabOwnership=1&t={int(time.time()*1000)}",wait_until='domcontentloaded',timeout=90000)
      page.wait_for_selector('.tabs button[data-tab="mock"]',timeout=15000)
      try:
        page.wait_for_function("()=>!!window.Codeopolis?.game?.phase29?.ui&&!!document.getElementById('phase29InterviewDay')&&!!document.getElementById('phase30Remediation')",timeout=30000)
      except PlaywrightTimeoutError:
        fail('Interview Day / remediation runtime did not boot')
      page.evaluate("()=>document.querySelector('.phase43-start')?.remove()")
      page.wait_for_timeout(350)

      # The architectural invariant: Interview Day and remediation belong to Mock,
      # never as top-level flex siblings that can steal viewport height from every tab.
      parents=page.evaluate("""()=>({p29:document.getElementById('phase29InterviewDay')?.parentElement?.id||null,p30:document.getElementById('phase30Remediation')?.parentElement?.id||null})""")
      if parents!={'p29':'mockTab','p30':'mockTab'}: fail(f'Interview surfaces are not owned by Mock: {parents}')

      for tab in TABS:
        page.evaluate("tab=>window.switchTab?.(tab)",tab)
        page.wait_for_function("tab=>document.querySelector('.tabs button.active[data-tab]')?.dataset.tab===tab",arg=tab,timeout=5000)
        page.wait_for_timeout(220)
        s=snapshot(page,tab);report[tab]=s
        if s['activeButton']!=tab: fail(f'{tab}: active navigation state lost: {s}')
        if s['directCompetition']: fail(f'{tab}: standalone panels still compete with layout: {s}')
        if not s['layout'] or s['layout']['h']<520: fail(f'{tab}: primary layout is still vertically minimized: {s}')
        if tab=='city':
          if not s['city']['visible'] or not s['city']['box'] or s['city']['box']['h']<500: fail(f'city: renderer does not own play surface: {s}')
        else:
          if not s['activeVisible'] or not s['active'] or s['active']['h']<420: fail(f'{tab}: selected tab does not own usable workspace: {s}')
        if tab=='mock':
          if not s['interview']['visible'] or s['interview']['parent']!='mockTab': fail(f'mock: Interview Day is not inside Mock: {s}')
          if not s['remediation']['visible'] or s['remediation']['parent']!='mockTab': fail(f'mock: remediation is not inside Mock: {s}')
        else:
          if s['interview']['visible'] or s['remediation']['visible']: fail(f'{tab}: Mock-only panels leaked into selected tab: {s}')
        page.screenshot(path=str(out/f'{tab}.png'),full_page=False)

      if errors: fail(f'Page errors during tab ownership acceptance: {errors}')
      (out/'report.json').write_text(json.dumps(report,indent=2))
      context.close();browser.close()
    print('R14 tab surface ownership acceptance passed')

if __name__=='__main__': main()
