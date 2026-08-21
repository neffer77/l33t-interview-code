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

        before = page.evaluate("""() => ({
          gate: !!window.CodeopolisPythonRuntimeGate,
          mainThreadBooted: window.CodeopolisPythonRuntimeGate?.hasBooted?.() ?? null,
          status: document.querySelector('#pythonStatus')?.textContent || '',
          directPyodideScripts: [...document.scripts].map(s=>s.src).filter(src=>/pyodide/i.test(src)),
        })""")
        if not before['gate']:
            fail(f'Python runtime gate did not load: {before}')
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
            fail(f'Page errors during P0 de-bloat acceptance: {errors}')

        print('P0 de-bloat acceptance passed: worker judging works and main-thread Pyodide stayed dormant.')
        context.close()
        browser.close()


if __name__ == '__main__':
    main()
