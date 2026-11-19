from playwright.sync_api import sync_playwright
from PIL import Image
Image.new('RGB',(160,200),(200,110,65)).save('/home/user/kropki/test-avatar.png')
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1100}); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4200',wait_until='networkidle');page.evaluate('localStorage.clear()');page.reload(wait_until='networkidle')
 page.locator('.rail-nav').get_by_role('button',name='À deux',exact=True).click();page.get_by_role('button',name='Commencer la partie').click()
 page.locator('.arena-controls summary').click()
 assert page.get_by_label('Style du coup',exact=True).locator('option').count()==5
 assert page.get_by_label('Scellement de la zone',exact=True).locator('option').count()==12
 assert page.get_by_role('button',name='Son : non',exact=True).count()==1
 page.get_by_role('button',name='Son : non',exact=True).click();page.get_by_role('button',name='Son : oui',exact=True).wait_for()
 for avatar in ['samurai','mage','ninja']:page.get_by_label('Mon avatar local',exact=True).select_option(avatar)
 page.get_by_label('Importer une photo',exact=True).set_input_files('/home/user/kropki/test-avatar.png')
 page.wait_for_function("document.querySelector('[aria-label=\"Mon avatar local\"]').value==='photo'")
 assert page.evaluate("JSON.parse(localStorage.getItem('kropki-arena-presentation-v1')).photo.startsWith('data:image/png;base64,')")
 page.get_by_role('button',name='Retirer la photo',exact=True).click();assert page.get_by_label('Mon avatar local',exact=True).input_value()=='ninja'
 page.get_by_label('Mon avatar local',exact=True).select_option('mage')
 for x,y in [(3,2),(3,3),(4,3),(10,10),(3,4),(11,10)]:page.locator(f'[data-cell="{x}-{y}"]').click()
 for seal in range(12):
  page.get_by_label('Scellement de la zone',exact=True).select_option(str(seal));page.get_by_label('Style du coup',exact=True).select_option(str(seal%5))
  page.locator('[data-cell="2-3"]').click();page.locator('.arena-seal').wait_for();assert page.locator('.arena-boundary line').count()>0
  assert '1' in page.locator('.score-number').first.inner_text(),repr(page.locator('.score-number').first.inner_text())
  assert page.locator('.arena-cutin').inner_text().startswith('ENCERCLEMENT !')
  assert page.locator('.arena-cutin .arena-avatar').count()==1
  if seal==0:
   page.evaluate("document.querySelector('.arena-stage').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=350})")
   page.screenshot(path='/home/user/kropki/anime-capture-desktop.png',full_page=True)
   page.evaluate("document.querySelector('.arena-stage').getAnimations({subtree:true}).forEach(a=>a.play())")
  page.get_by_role('button',name='Annuler',exact=True).click();page.locator('.arena-fx').wait_for(state='detached',timeout=5000)
 page.get_by_role('button',name='Effets : oui',exact=True).click();page.locator('[data-cell="2-3"]').click();page.locator('.arena-fx').wait_for(state='detached');assert '1' in page.locator('.score-number').first.inner_text(),repr(page.locator('.score-number').first.inner_text())
 page.get_by_role('button',name='Son : oui',exact=True).click();page.reload(wait_until='networkidle')
 assert page.get_by_label('Scellement de la zone',exact=True).input_value()=='11'
 assert page.get_by_label('Mon avatar local',exact=True).input_value()=='mage'
 assert page.locator('.arena-fx').count()==0
 page.locator('.arena-controls summary').click()
 for width in [360,390,680,768,1024,1440]:
  page.set_viewport_size({'width':width,'height':950});assert page.evaluate('document.documentElement.scrollWidth')==width, width
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path='/home/user/kropki/anime-mobile.png',full_page=True)
 page.get_by_role('button',name='Effets : non',exact=True).click();page.get_by_role('button',name='Annuler',exact=True).click()
 page.emulate_media(reduced_motion='reduce');page.locator('[data-cell="2-3"]').click();page.locator('.arena-fx').wait_for(state='hidden');assert '1' in page.locator('.score-number').first.inner_text(),repr(page.locator('.score-number').first.inner_text())
 page.goto('http://localhost:4200/entrainement',wait_until='networkidle');assert page.locator('.arena-presentation').count()==0
 page.goto('http://localhost:4200',wait_until='networkidle');page.evaluate("localStorage.setItem('kropki-arena-presentation-v1','{')");page.reload(wait_until='networkidle');assert page.get_by_label('Style du coup',exact=True).input_value()=='0'
 assert not errors,errors
 blocked=b.new_context();blocked.add_init_script("Storage.prototype.setItem=function(){throw new Error('blocked')};Storage.prototype.getItem=function(){throw new Error('blocked')}")
 q=blocked.new_page();q.goto('http://localhost:4200',wait_until='networkidle');q.locator('.arena-controls summary').click();q.get_by_label('Style du coup',exact=True).select_option('4');assert 'Stockage indisponible' in q.locator('.arena-controls').inner_text()
 print('PASS anime: 5 elements, all 12 seals on real captures, avatar/photo import/remove/reload, audio toggle, effects toggle, reset cleanup, no reload playback, 6 widths, reduced motion, corrupt/blocked storage, training untouched, no JS errors')
 b.close()
