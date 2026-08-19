#!/usr/bin/env python3
import argparse, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

SEQUENCE=[
    ('desktop',1440,1000),
    ('compact_desktop',1024,720),
    ('tablet',834,1112),
    ('phone_landscape',844,390),
    ('phone_portrait',390,844),
    ('tablet_return',834,1112),
    ('desktop_return',1440,1000),
]

def fail(message): raise AssertionError(message)
def mobile_for(width): return width<=899

def snapshot_state(page):
    return page.evaluate("""()=>{const C=window.Codeopolis,editor=document.querySelector('#challengeTab textarea[data-phase43-editor],#challengeTab textarea'),host=C?.phaserCity?.host,shell=document.querySelector('#codeopolisIonicShell'),er=editor?.getBoundingClientRect(),hr=host?.getBoundingClientRect(),core=[...document.styleSheets].some(s=>(s.href||'').includes('phase43-core-viewport.css'));return{view:C?.R14PlayerAcceptance?.currentView?.()||shell?.dataset?.view||document.querySelector('.tabs button.active[data-tab]')?.dataset?.tab||null,shell:!!shell,body:document.body.className,mode:C?.LiveReframe?.mode?.()||null,coreCss:core,editor:{probe:editor?.dataset?.reframeProbe||null,value:editor?.value||'',w:Math.round(er?.width||0),h:Math.round(er?.height||0)},host:{probe:host?.dataset?.reframeProbe||null,w:Math.round(hr?.width||0),h:Math.round(hr?.height||0)},coding:C?.R14PlayerAcceptance?.codingAudit?.()||null,city:C?.R14PlayerAcceptance?.audit?.()||null}}""")

def wait_shell_mode(page,width):
    expected=mobile_for(width)
    try:
        page.wait_for_function("""expected=>{const shell=!!document.querySelector('#codeopolisIonicShell'),body=document.body.classList.contains('codeopolis-ionic-mobile');return expected?(shell&&body):(!shell&&!body)}""",arg=expected,timeout=12000)
    except PlaywrightTimeoutError:
        fail(f"Responsive shell did not settle for width {width}: {snapshot_state(page)}")
    page.wait_for_timeout(260)

def wait_baseline_challenge(page):
    try:
        page.wait_for_function("""()=>{const C=Codeopolis,core=[...document.styleSheets].some(s=>(s.href||'').includes('phase43-core-viewport.css')),audit=C.R14PlayerAcceptance?.codingAudit?.();return core&&audit?.view==='challenge'&&audit?.pass===true}""",timeout=30000)
    except PlaywrightTimeoutError:
        fail(f"Desktop Challenge never reached a stable responsive baseline: {snapshot_state(page)}")
    page.wait_for_timeout(220)

def resize_step(page,out_dir,label,width,height,kind,sentinel):
    page.set_viewport_size({'width':width,'height':height})
    page.evaluate("()=>window.Codeopolis?.LiveReframe?.schedule?.(true)")
    wait_shell_mode(page,width)
    state=snapshot_state(page)
    if state['mode']!=('mobile' if mobile_for(width) else 'desktop'):
        fail(f"{label}: runtime mode mismatch: {state}")
    if kind=='challenge':
        if state['view']!='challenge': fail(f"{label}: challenge view was lost during resize: {state}")
        if state['editor']['probe']!='editor-live-reframe': fail(f"{label}: editor DOM node was replaced: {state}")
        if sentinel not in state['editor']['value']: fail(f"{label}: editor contents were lost during resize: {state}")
        coding=state['coding']
        if not coding or not coding.get('pass'): fail(f"{label}: coding surface minimized after live resize: {state}")
    else:
        if state['view']!='city': fail(f"{label}: City view was lost during resize: {state}")
        if state['host']['probe']!='city-live-reframe': fail(f"{label}: Phaser host DOM node was replaced: {state}")
        city=state['city']
        if not city or not city.get('pass'): fail(f"{label}: City surface minimized after live resize: {state}")
    page.screenshot(path=str(out_dir/f'{kind}-{label}.png'),full_page=False)
    return state

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--url',required=True)
    ap.add_argument('--out',required=True)
    args=ap.parse_args()
    out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        browser=p.chromium.launch()
        context=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1,service_workers='block')
        page=context.new_page();errors=[]
        page.on('pageerror',lambda exc: errors.append(str(exc)))
        sep='&' if '?' in args.url else '?'
        page.goto(f"{args.url}{sep}r14qa=1&liveReframe=1&t={int(time.time()*1000)}",wait_until='domcontentloaded',timeout=90000)
        page.wait_for_selector('body',timeout=15000)
        try:
            page.wait_for_function("()=>!!window.Codeopolis?.LiveReframe&&!!window.Codeopolis?.R14PlayerAcceptance&&!!window.Codeopolis?.phaserCity?.host",timeout=60000)
        except PlaywrightTimeoutError:
            fail(f"Live reframe runtime did not boot: {snapshot_state(page)}")
        page.evaluate("""()=>{document.querySelector('.phase43-start')?.remove();const C=Codeopolis,s=C.game?.state||window.state;if(s?.r4Construction){s.r4Construction.manualStart=false;s.r4Construction.stage='complete'}C.phaserCity?.catalog?.close?.();C.phaserCity?.manager?.close?.();C.R14PlayerAcceptance?.sync?.();if(typeof window.switchTab==='function')window.switchTab('challenge')}""")
        page.wait_for_selector('#challengeTab textarea',state='visible',timeout=15000)
        wait_baseline_challenge(page)
        sentinel='# live-reframe-sentinel'
        page.evaluate("""sentinel=>{const e=document.querySelector('#challengeTab textarea[data-phase43-editor],#challengeTab textarea');e.dataset.reframeProbe='editor-live-reframe';if(!e.value.includes(sentinel))e.value=`${sentinel}\n${e.value}`;Codeopolis.phaserCity.host.dataset.reframeProbe='city-live-reframe';Codeopolis.R14PlayerAcceptance?.sync?.()}""",sentinel)
        for label,w,h in SEQUENCE:
            resize_step(page,out,label,w,h,'challenge',sentinel)

        page.evaluate("()=>{if(typeof window.switchTab==='function')window.switchTab('city');Codeopolis.R14PlayerAcceptance?.sync?.()}")
        try:
            page.wait_for_function("""()=>{const C=Codeopolis,s=C.phaserCity?.game?.scene?.getScene?.('CodeopolisCity'),h=C.phaserCity?.host,r=h?.getBoundingClientRect?.();return C.R14PlayerAcceptance?.currentView?.()==='city'&&!!s?.sys?.isActive?.()&&!!r&&r.width>100&&r.height>100}""",timeout=15000)
        except PlaywrightTimeoutError:
            fail(f"City did not become playable before reframe sequence: {snapshot_state(page)}")
        for label,w,h in SEQUENCE:
            resize_step(page,out,label,w,h,'city',sentinel)

        if errors: fail(f"Page errors during live reframe: {errors}")
        report={'sequence':SEQUENCE,'final':snapshot_state(page),'pageErrors':errors}
        (out/'report.json').write_text(json.dumps(report,indent=2))
        context.close();browser.close()
        print('R14 live reframe acceptance passed')

if __name__=='__main__': main()
