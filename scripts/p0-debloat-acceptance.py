#!/usr/bin/env python3
import argparse
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError


def fail(message):
    raise AssertionError(message)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', required=True)
    args = ap.parse_args()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(
            viewport={'width': 1440, 'height': 1000},
            device_scale_factor=1,
            service_workers='block',
        )
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda exc: errors.append(str(exc)))
        page.goto(args.url, wait_until='domcontentloaded', timeout=90000)
        page.wait_for_selector('#challengeTab textarea', state='visible', timeout=20000)

        try:
            page.wait_for_function(
                """() => {
                  const el=document.querySelector('#pythonStatus');
                  return !!el && /worker ready/i.test(el.textContent || '');
                }""",
                timeout=60000,
            )
        except PlaywrightTimeoutError:
            fail('Python worker did not become ready')

        before = page.evaluate(r"""() => {
          const sameOrigin = src => { try { return new URL(src, location.href).origin === location.origin; } catch { return false; } };
          const scriptPaths = [...document.scripts].map(s=>s.src).filter(Boolean);
          const stylePaths = [...document.querySelectorAll('link[rel="stylesheet"]')].map(l=>l.href).filter(Boolean);
          const resources = performance.getEntriesByType('resource').map(r=>r.name);
          const retiredBootstrapStyle = src => {
            if (!sameOrigin(src)) return false;
            const name = new URL(src, location.href).pathname.split('/').pop();
            if (name === 'styles.css') return true;
            const match = /^phase(\d+)\.css$/.exec(name || '');
            return !!match && Number(match[1]) >= 5 && Number(match[1]) <= 27;
          };
          const retiredRuntimePath = src => {
            if (!sameOrigin(src)) return false;
            const path = new URL(src, location.href).pathname;
            return /\/(?:src\/repository-sim\/repository-sim|src\/projects\/real-projects|src\/projects\/phase23-integration|src\/ai\/phase24-ui)\.js(?:[?#]|$)/.test(path);
          };
          return {
            gate: !!window.CodeopolisPythonRuntimeGate,
            mainThreadBooted: window.CodeopolisPythonRuntimeGate?.hasBooted?.() ?? null,
            status: document.querySelector('#pythonStatus')?.textContent || '',
            directPyodideScripts: scriptPaths.filter(src=>/pyodide/i.test(src)),
            compiledRuntime: scriptPaths.some(src=>sameOrigin(src) && /\/codeopolis-runtime\.js(?:[?#]|$)/.test(src)),
            compiledStyles: stylePaths.some(src=>sameOrigin(src) && /\/codeopolis\.css(?:[?#]|$)/.test(src)),
            retiredScriptTags: scriptPaths.filter(src=>sameOrigin(src) && /\/(?:app|worker-bridge|python-runtime-gate)\.js(?:[?#]|$)/.test(src)),
            retiredBootstrapStyles: stylePaths.filter(retiredBootstrapStyle),
            retiredNetworkRequests: resources.filter(src=>sameOrigin(src) && /\/(?:app|worker-bridge|python-runtime-gate)\.js(?:[?#]|$)/.test(src)),
            retiredSurfaceNetworkRequests: resources.filter(retiredRuntimePath),
            retiredSurfaceGlobals: {
              RepositorySim: typeof window.RepositorySim !== 'undefined',
              RealProjects: typeof window.RealProjects !== 'undefined',
              Phase24UI: typeof window.Phase24UI !== 'undefined',
            },
            retiredSurfaceRoots: ['repositorySim','realProjects','aiStudio'].filter(id=>document.getElementById(id)),
            aiNpcDirectorRetained: !!window.AINPCDirector,
          };
        }""")
        if not before['gate']:
            fail(f'Python runtime gate did not execute from compiled runtime: {before}')
        if not before['compiledRuntime'] or not before['compiledStyles']:
            fail(f'Production bootstrap bundles were not active: {before}')
        if before['retiredScriptTags'] or before['retiredBootstrapStyles'] or before['retiredNetworkRequests']:
            fail(f'Historical bootstrap fan-out survived in the deployed page: {before}')
        if any(before['retiredSurfaceGlobals'].values()) or before['retiredSurfaceRoots'] or before['retiredSurfaceNetworkRequests']:
            fail(f'P2 retired hidden surfaces still execute or exist in production: {before}')
        if not before['aiNpcDirectorRetained']:
            fail(f'P2 accidentally removed the underlying AI NPC director while retiring only the standalone studio UI: {before}')
        if before['mainThreadBooted']:
            fail(f'Main-thread Pyodide booted during normal worker startup: {before}')
        if before['directPyodideScripts']:
            fail(f'Normal page still contains an eager Pyodide script: {before}')

        editor = page.locator('#challengeTab textarea').first
        editor.fill(
            'def two_sum(nums, target):\n'
            '    seen = {}\n'
            '    for i, value in enumerate(nums):\n'
            '        need = target - value\n'
            '        if need in seen:\n'
            '            return [seen[need], i]\n'
            '        seen[value] = i\n'
            '    return []\n'
        )
        run_button = page.get_by_role('button', name='Run tests').first
        if run_button.is_disabled():
            fail('Run tests stayed disabled after Python worker became ready')
        run_button.click()
        try:
            page.wait_for_function(
                """() => /Visible tests passed/i.test(document.querySelector('#feedback')?.textContent || '')""",
                timeout=15000,
            )
        except PlaywrightTimeoutError:
            fail(f'Worker-backed visible tests did not pass: {page.locator("#feedback").inner_text()}')

        after = page.evaluate("""() => ({
          mainThreadBooted: window.CodeopolisPythonRuntimeGate?.hasBooted?.() ?? null,
          status: document.querySelector('#pythonStatus')?.textContent || '',
        })""")
        if after['mainThreadBooted']:
            fail(f'Main-thread Pyodide booted after worker-backed judging: {after}')
        if errors:
            fail(f'Page errors during de-bloat acceptance: {errors}')

        print('De-bloat runtime acceptance passed: compiled bootstrap active, retired hidden surfaces absent, AI NPC core retained, and worker judging works.')
        context.close()
        browser.close()


if __name__ == '__main__':
    main()
