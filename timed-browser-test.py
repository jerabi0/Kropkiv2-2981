import json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1080})
 page.clock.install()
 page.add_init_script("""const fixture=sessionStorage.getItem('test-fixture');if(fixture){sessionStorage.removeItem('test-fixture');localStorage.setItem('kropki-v1',fixture);}""")
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4200',wait_until='networkidle')
 page.evaluate('localStorage.clear()');page.reload(wait_until='networkidle')
 page.locator('.rail-nav').get_by_role('button',name='À deux',exact=True).click()
 assert page.locator('#cadence option').all_text_contents()==['3 minutes','5 minutes','7 minutes','10 minutes','30 minutes']
 assert page.locator('#cadence').input_value()=='3'
 page.locator('#cadence').select_option('7')
 page.get_by_role('button',name='Commencer la partie').click()
 assert page.locator('.match-clock').count()==1
 assert page.locator('.player-clock').count()==0
 assert '7 min au total' in page.locator('.match-clock').inner_text()
 before=page.evaluate("JSON.parse(localStorage.getItem('kropki-v1')).clock.remaining")
 page.clock.fast_forward(3000)
 assert page.evaluate("JSON.parse(localStorage.getItem('kropki-v1')).clock.remaining")==before
 page.reload(wait_until='networkidle')
 assert 'Au premier pion' in page.locator('.match-clock').inner_text()
 page.locator('[data-cell="3-2"]').click()
 page.clock.fast_forward(3000)
 page.wait_for_function("(()=>{const c=JSON.parse(localStorage.getItem('kropki-v1')).clock;return c.remaining-(c.since===null?0:Date.now()-c.since)<418000})()")
 assert page.evaluate("(()=>{const c=JSON.parse(localStorage.getItem('kropki-v1')).clock;return c.remaining-(c.since===null?0:Date.now()-c.since)})()") < before-2800
 for x,y in [(3,3),(4,3),(10,10),(3,4),(11,10),(2,3)]:page.locator(f'[data-cell="{x}-{y}"]').click()
 page.wait_for_function("JSON.parse(localStorage.getItem('kropki-v1')).game.moves.length===7")
 assert page.locator('.capture-toast').count()>0
 saved=page.evaluate("JSON.parse(localStorage.getItem('kropki-v1')).game")
 page.locator('.rail-nav').get_by_role('button',name='Tutoriel interactif',exact=True).click()
 page.wait_for_function("JSON.parse(localStorage.getItem('kropki-v1')).clock.paused")
 paused=page.evaluate("JSON.parse(localStorage.getItem('kropki-v1')).clock.remaining")
 page.clock.fast_forward(60000)
 assert page.evaluate("JSON.parse(localStorage.getItem('kropki-v1')).clock.remaining")==paused
 tutorial=page.locator('.tutorial-panel')
 tutorial.locator('[data-cell="1-1"]').click()
 assert 'mise en évidence' in tutorial.locator('.tutorial-hint').inner_text()
 tutorial.locator('[data-cell="3-2"]').click()
 tutorial.get_by_role('button',name='Préparer la capture').click()
 tutorial.locator('[data-cell="2-3"]').click()
 assert 'Premier territoire conquis' in tutorial.inner_text()
 assert tutorial.locator('.tutorial-scores strong').first.inner_text()=='1'
 assert page.evaluate("JSON.parse(localStorage.getItem('kropki-v1')).game")==saved
 page.screenshot(path='/home/user/kropki/tutoriel.png',full_page=True)
 tutorial.get_by_role('button',name='Retour à ma partie').click()
 page.wait_for_function("!JSON.parse(localStorage.getItem('kropki-v1')).clock.paused")
 page.get_by_role('button',name='Revoir la partie',exact=True).click()
 page.wait_for_function("JSON.parse(localStorage.getItem('kropki-v1')).clock.paused")
 assert page.locator('#replay-position').input_value()=='0'
 assert page.locator('.score-number').first.inner_text().startswith('0')
 page.get_by_role('button',name='Coup suivant',exact=True).click()
 assert page.locator('#replay-position').input_value()=='1'
 page.get_by_role('button',name='Fin de la partie',exact=True).click()
 assert page.locator('.score-number').first.inner_text().startswith('1')
 page.get_by_role('button',name='Coup précédent',exact=True).click()
 assert page.locator('.score-number').first.inner_text().startswith('0')
 page.locator('#replay-position').fill('3')
 assert page.locator('#replay-position').input_value()=='3'
 assert page.locator('[data-cell="0-0"]').is_disabled()
 paused=page.evaluate("JSON.parse(localStorage.getItem('kropki-v1')).clock.remaining")
 page.clock.fast_forward(60000)
 assert page.evaluate("JSON.parse(localStorage.getItem('kropki-v1')).clock.remaining")==paused
 assert 'Au coup affiché' in page.locator('.match-clock').inner_text()
 page.get_by_role('button',name='Début de la partie',exact=True).click()
 page.get_by_role('button',name='Lire la partie',exact=True).click()
 page.wait_for_function("document.getElementById('replay-position').value==='1'")
 page.get_by_role('button',name='Mettre en pause',exact=True).click()
 assert page.evaluate("JSON.parse(localStorage.getItem('kropki-v1')).game")==saved
 page.screenshot(path='/home/user/kropki/relecture.png',full_page=True)
 page.locator('.replay-top').get_by_role('button',name='Retour à la partie').click()
 page.get_by_role('button',name='Abandonner',exact=True).click()
 page.locator('#resigning').select_option('1')
 page.get_by_role('button',name='Confirmer l’abandon',exact=True).click()
 assert 'Les rouges remportent' in page.locator('.message').inner_text()
 page.reload(wait_until='networkidle')
 assert 'Les rouges remportent' in page.locator('.message').inner_text()
 # A real active deadline in saved state; reload settles elapsed wall time.
 page.evaluate("""() => {const s=JSON.parse(localStorage.getItem('kropki-v1'));s.version=2;s.game.ended=false;s.result=null;s.clock={minutes:1,remaining:1000,paused:false,since:Date.now()-2000};sessionStorage.setItem('test-fixture',JSON.stringify(s));}""")
 page.reload(wait_until='networkidle')
 assert 'Temps écoulé' in page.locator('.message').inner_text()
 assert 'Les bleus remportent' in page.locator('.message').inner_text()
 assert page.locator('.match-clock time').inner_text()=='00:00'
 assert page.get_by_role('button',name='Abandonner',exact=True).is_disabled()
 assert page.get_by_role('button',name='Annuler',exact=True).is_disabled()
 # Start a blank game, then inject a short real clock and simulate browser time.
 page.get_by_role('button',name='Nouvelle partie',exact=True).click()
 page.locator('#cadence').select_option('3')
 page.get_by_role('button',name='Commencer la partie').click()
 page.evaluate("""() => {const s=JSON.parse(localStorage.getItem('kropki-v1'));s.clock.remaining=4000;s.clock.started=true;s.clock.since=Date.now();sessionStorage.setItem('test-fixture',JSON.stringify(s));}""")
 page.reload(wait_until='networkidle')
 page.clock.fast_forward(5000)
 page.wait_for_function("document.querySelector('.message').textContent.includes('Temps écoulé')")
 assert 'Temps écoulé' in page.locator('.message').inner_text()
 assert 'Égalité parfaite' in page.locator('.message').inner_text()
 assert page.locator('.match-clock time').inner_text()=='00:00'
 page.clock.resume()
 # Expiration during a confirmation must close it and show the score result.
 page.get_by_role('button',name='Nouvelle partie',exact=True).click()
 page.get_by_role('button',name='Commencer la partie').click()
 page.evaluate("""() => {const s=JSON.parse(localStorage.getItem('kropki-v1'));s.clock.remaining=4000;s.clock.started=true;s.clock.since=Date.now();sessionStorage.setItem('test-fixture',JSON.stringify(s));}""")
 page.reload(wait_until='networkidle')
 page.get_by_role('button',name='Abandonner',exact=True).click()
 page.clock.fast_forward(5000)
 page.wait_for_function("document.querySelector('.message').textContent.includes('Temps écoulé')")
 assert not page.locator('dialog').is_visible()
 # A saved local review pause resumes after reload without charging paused absence.
 page.get_by_role('button',name='Nouvelle partie',exact=True).click()
 page.locator('#cadence').select_option('5')
 page.get_by_role('button',name='Commencer la partie').click()
 page.locator('[data-cell="3-3"]').click()
 page.get_by_role('button',name='Revoir la partie',exact=True).click()
 page.wait_for_function("JSON.parse(localStorage.getItem('kropki-v1')).clock.paused")
 paused=page.evaluate("JSON.parse(localStorage.getItem('kropki-v1')).clock.remaining")
 page.clock.fast_forward(60000)
 page.reload(wait_until='networkidle')
 assert not page.evaluate("JSON.parse(localStorage.getItem('kropki-v1')).clock.paused")
 assert page.evaluate("JSON.parse(localStorage.getItem('kropki-v1')).clock.remaining")>paused-2000
 # Computer reflection also consumes the same shared budget.
 page.locator('.rail-nav').get_by_role('button',name='Ordinateur',exact=True).click()
 page.get_by_role('button',name='Commencer la partie').click()
 page.locator('[data-cell="7-5"]').click()
 before=page.evaluate("JSON.parse(localStorage.getItem('kropki-v1')).clock.remaining")
 page.clock.fast_forward(2000)
 page.wait_for_function("JSON.parse(localStorage.getItem('kropki-v1')).game.moves.length===2")
 assert page.evaluate("(()=>{const c=JSON.parse(localStorage.getItem('kropki-v1')).clock;return c.remaining-(c.since===null?0:Date.now()-c.since)})()")<before-1800
 page.locator('.rail-nav').get_by_role('button',name='À deux',exact=True).click()
 page.get_by_role('button',name='Commencer la partie').click()
 page.get_by_role('button',name='Nouvelle partie',exact=True).click()
 page.locator('#cadence').select_option('5')
 page.get_by_role('button',name='Commencer la partie').click()
 page.locator('[data-cell="0-0"]').click()
 page.clock.fast_forward(3000)
 page.wait_for_function("(()=>{const c=JSON.parse(localStorage.getItem('kropki-v1')).clock;return c.remaining-(c.since===null?0:Date.now()-c.since)<298000})()")
 assert page.evaluate("(()=>{const c=JSON.parse(localStorage.getItem('kropki-v1')).clock;return c.remaining-(c.since===null?0:Date.now()-c.since)})()")<298000
 assert page.evaluate("JSON.parse(localStorage.getItem('kropki-v1')).game.turn")==2
 page.locator('[data-cell="1-0"]').click()
 remaining=page.evaluate("JSON.parse(localStorage.getItem('kropki-v1')).clock.remaining")
 page.clock.fast_forward(3000)
 page.wait_for_function("(()=>{const c=JSON.parse(localStorage.getItem('kropki-v1')).clock;return c.remaining-(c.since===null?0:Date.now()-c.since)<295000})()")
 assert page.evaluate("(()=>{const c=JSON.parse(localStorage.getItem('kropki-v1')).clock;return c.remaining-(c.since===null?0:Date.now()-c.since)})()")<remaining-2800
 for width in [360,390,680,768,1024,1440]:
  page.set_viewport_size({'width':width,'height':950})
  assert page.evaluate('document.documentElement.scrollWidth')==width,f'overflow at {width}'
 page.screenshot(path='/home/user/kropki/cadences-desktop.png',full_page=True)
 page.set_viewport_size({'width':390,'height':844})
 page.screenshot(path='/home/user/kropki/cadences-mobile.png',full_page=True)
 assert not errors,errors
 print('PASS: one shared timer, 5 durations, first legal point start, both turns count, capture animation, complete tutorial, isolated save, replay navigation/play/read-only, simulated pauses, score timeout/reload/draw, resignation despite lead, 6 widths, no JS errors')
 browser.close()