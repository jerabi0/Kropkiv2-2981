from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1080})
 page.clock.install()
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4200',wait_until='networkidle')
 page.locator('.rail-nav').get_by_role('button',name='À deux',exact=True).click()
 page.get_by_role('button',name='Commencer la partie').click()
 def count():return page.evaluate("JSON.parse(localStorage.getItem('kropki-v1')).game.moves.length")
 def choose(x,y):page.locator(f'[data-cell="{x}-{y}"]').click()
 def confirm():page.get_by_role('button',name='Confirmer le coup',exact=True).click()
 choose(3,2);assert count()==0
 assert page.locator('.selected-point').count()==1
 page.clock.fast_forward(3000)
 assert 'Au premier pion' in page.locator('.match-clock').inner_text()
 page.get_by_role('button',name='Annuler la sélection').click();assert count()==0
 assert page.get_by_role('button',name='Confirmer le coup',exact=True).is_disabled()
 choose(3,2);confirm();assert count()==1
 choose(3,3);page.clock.fast_forward(3000);assert count()==1
 assert page.get_by_role('button',name='Confirmer le coup',exact=True).is_enabled()
 confirm()
 for x,y in [(4,3),(10,10),(3,4),(11,10)]:choose(x,y);confirm()
 choose(2,3);assert count()==6
 assert '+1' in page.locator('.move-intent').inner_text()
 assert page.locator('.preview-boundary').count()>0
 page.screenshot(path='/home/user/kropki/gameplay-preview.png',full_page=True)
 confirm();assert count()==7
 assert page.locator('.capture-toast').count()>0
 page.get_by_role('checkbox',name='Placement direct (sans confirmation)').check()
 choose(12,10);assert count()==8
 page.reload(wait_until='networkidle')
 assert page.get_by_role('checkbox',name='Placement direct (sans confirmation)').is_checked()
 page.get_by_role('checkbox',name='Placement direct (sans confirmation)').uncheck()
 choose(5,5);page.reload(wait_until='networkidle');assert count()==8
 assert page.get_by_role('button',name='Confirmer le coup',exact=True).is_disabled()
 page.locator('.rail-nav').get_by_role('button',name='Tutoriel interactif',exact=True).click()
 choose(3,2);assert 'Un point, une intersection.' in page.locator('.tutorial-instructions').inner_text()
 confirm();page.get_by_role('button',name='Préparer la capture').click()
 choose(2,3);assert '+1' in page.locator('.move-intent').inner_text()
 confirm();assert 'Premier territoire conquis' in page.locator('.tutorial-panel').inner_text()
 page.get_by_role('button',name='Retour à ma partie').click();assert count()==8
 for w in [360,390,680,768,1024,1440]:
  page.set_viewport_size({'width':w,'height':1080});page.screenshot(path='/home/user/kropki/gameplay-mobile.png')
  assert page.evaluate('document.documentElement.scrollWidth')==w
 page.emulate_media(reduced_motion='reduce')
 assert not errors,errors
 print('PASS gameplay: selection/cancel/confirm, first-point clock, running preview, true capture preview, direct/reload, tutorial, six widths, no JS errors')
 b.close()