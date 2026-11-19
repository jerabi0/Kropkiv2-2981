import json
from playwright.sync_api import sync_playwright, expect

BASE='http://localhost:4200'
ROOT='/home/user/kropki/'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True, executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1080})
 errors=[]
 page.on('pageerror', lambda e: errors.append(str(e)))
 page.goto(BASE,wait_until='networkidle')
 page.evaluate('localStorage.clear()')
 page.reload(wait_until='networkidle')
 page.locator('.rail-nav').get_by_role('button',name='À deux',exact=True).click()
 page.locator('#cadence').select_option('30')
 page.get_by_role('button',name='Commencer la partie').click()
 page.locator('[data-cell="3-2"]').click()
 page.wait_for_function("JSON.parse(localStorage.getItem('kropki-v1')).game.moves.length===1")
 page.get_by_role('link',name='Entraînement avancé',exact=True).click()
 expect(page.get_by_role('heading',name='Un coup. Un déclic.')).to_be_visible()
 normal_save=page.evaluate("localStorage.getItem('kropki-v1')")
 assert page.locator('.match-clock').count()==0
 assert page.locator('.exercise-picker button').count()==6
 assert page.locator('.training-progress progress').get_attribute('value')=='0'
 page.screenshot(path=ROOT+'training-desktop.png',full_page=True,animations='disabled')
 # Wrong attempts and solutions must not count as solved.
 page.locator('[data-cell="0-0"]').click()
 expect(page.locator('.training-result')).to_contain_text('Une autre piste')
 assert page.locator('.training-progress progress').get_attribute('value')=='0'
 assert page.locator('[data-cell="2-3"]').is_disabled()
 page.get_by_role('button',name='Voir la solution',exact=True).click()
 expect(page.locator('.training-result')).to_contain_text('ne valide pas')
 assert page.locator('.training-progress progress').get_attribute('value')=='0'
 page.get_by_role('button',name='Essayer moi-même',exact=True).click()
 page.locator('[data-cell="2-3"]').click()
 expect(page.locator('.training-result')).to_contain_text('Bien joué')
 expect(page.locator('.exercise-picker button').nth(0)).to_contain_text('Réussi avec aide')
 assert page.locator('.training-progress progress').get_attribute('value')=='1'
 page.get_by_role('button',name='Exercice suivant',exact=True).click()
 page.get_by_role('button',name='Afficher un indice',exact=True).click()
 assert page.locator('.tutorial-target').count()==1
 expect(page.locator('[data-cell="3-2"]')).to_have_attribute('aria-label','D3, intersection conseillée')
 page.locator('[data-cell="3-2"]').click()
 expect(page.locator('.exercise-picker button').nth(1)).to_contain_text('Réussi avec aide')
 # Every category, including actual liberation and opponent score removal.
 for i,xy in [(2,(2,3)),(3,(2,2)),(4,(4,1)),(5,(4,1))]:
  page.locator('.exercise-picker button').nth(i).click()
  if i>=4:
   assert page.locator('.training-scores strong').all_text_contents()==['0','1']
  page.locator(f'[data-cell="{xy[0]}-{xy[1]}"]').click()
  expect(page.locator('.training-result')).to_contain_text('Bien joué')
  assert page.locator('.training-progress progress').get_attribute('value')==str(i+1)
  if i>=4:
   assert page.locator('.training-scores strong').all_text_contents()==['4','0']
   expect(page.locator('.training-lesson')).to_be_visible()
 page.screenshot(path=ROOT+'training-liberation-desktop.png',full_page=True,animations='disabled')
 assert page.evaluate("localStorage.getItem('kropki-v1')")==normal_save
 page.reload(wait_until='networkidle')
 assert page.locator('.training-progress progress').get_attribute('value')=='6'
 # Replay/undo, real capture recommendation, worker response and persistence.
 page.get_by_role('tab',name='Plateau libre',exact=True).click()
 for x,y in [(3,2),(3,3),(4,3),(7,7),(3,4),(8,7)]:
  page.locator(f'[data-cell="{x}-{y}"]').click()
 page.get_by_role('button',name='Analyser la position',exact=True).click()
 expect(page.locator('.analysis-summary')).to_contain_text('1 coup(s) de capture',timeout=15000)
 expect(page.locator('.training-tip')).to_contain_text('gain immédiat vérifié')
 page.get_by_role('button',name='Repérer C4',exact=True).click()
 assert page.locator('.tutorial-target').count()==1
 page.screenshot(path=ROOT+'training-analysis-desktop.png',full_page=True,animations='disabled')
 page.locator('[data-cell="2-3"]').click()
 assert page.locator('.training-scores strong').all_text_contents()==['1','0']
 expect(page.locator('.training-board-banner')).to_contain_text('rouges')
 expect(page.locator('.analysis-summary')).to_be_visible(timeout=15000)
 saved=page.evaluate("localStorage.getItem('kropki-training-sandbox-v1')")
 page.reload(wait_until='networkidle')
 page.get_by_role('tab',name='Plateau libre',exact=True).click()
 assert page.locator('.training-scores strong').all_text_contents()==['1','0']
 assert page.evaluate("localStorage.getItem('kropki-training-sandbox-v1')")==saved
 page.get_by_role('button',name='Annuler le dernier coup',exact=True).click()
 assert page.locator('.training-scores strong').all_text_contents()==['0','0']
 assert '6 coup(s)' in page.locator('.training-board-caption').inner_text()
 page.get_by_role('button',name='Analyser la position',exact=True).click()
 expect(page.locator('.analysis-summary')).to_be_visible(timeout=15000)
 # Switching or resetting while analysis runs cannot display stale recommendations.
 page.locator('#training-size').select_option('17')
 assert '9 × 9' in page.locator('.training-board-caption').inner_text()
 page.get_by_role('button',name='Créer ce plateau vide',exact=True).click()
 expect(page.locator('.analysis-summary')).to_contain_text('221 intersections légales',timeout=15000)
 assert page.locator('.training-tip').count()==0
 for x,y in [(0,0),(1,0),(2,0),(3,0)]: page.locator(f'[data-cell="{x}-{y}"]').click()
 expect(page.locator('.analysis-summary')).to_contain_text('217 intersections légales',timeout=15000)
 page.get_by_role('button',name='Vider ce plateau',exact=True).click()
 expect(page.locator('.analysis-summary')).to_contain_text('221 intersections légales',timeout=15000)
 assert page.evaluate("localStorage.getItem('kropki-v1')")==normal_save
 # Both modes at six widths, keyboard tabs, mobile touch.
 for width in [360,390,680,768,1024,1440]:
  page.set_viewport_size({'width':width,'height':950})
  for tab in ['Exercices','Plateau libre']:
   page.get_by_role('tab',name=tab,exact=True).click()
   assert page.evaluate('document.documentElement.scrollWidth')==width, f'overflow {tab} {width}'
 page.set_viewport_size({'width':390,'height':844})
 page.get_by_role('tab',name='Exercices',exact=True).click()
 page.locator('.exercise-picker button').nth(4).click()
 page.get_by_role('button',name='Afficher un indice',exact=True).click()
 page.screenshot(path=ROOT+'training-mobile.png',full_page=True,animations='disabled')
 page.get_by_role('tab',name='Exercices',exact=True).focus()
 page.keyboard.press('ArrowRight')
 expect(page.get_by_role('tab',name='Plateau libre',exact=True)).to_be_focused()
 page.keyboard.press('Home')
 expect(page.get_by_role('tab',name='Exercices',exact=True)).to_be_focused()
 mobile=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 mobile.on('pageerror',lambda e:errors.append(str(e)))
 mobile.goto(BASE+'/entrainement',wait_until='networkidle')
 mobile.get_by_role('button',name='Afficher un indice',exact=True).tap()
 mobile.locator('[data-cell="2-3"]').tap()
 expect(mobile.locator('.training-result')).to_contain_text('Bien joué')
 # Corrupt storage is tolerated, blocked storage is explicitly reported.
 broken=browser.new_page()
 broken.add_init_script("localStorage.setItem('kropki-training-progress-v1','{');localStorage.setItem('kropki-training-sandbox-v1','{');")
 broken.goto(BASE+'/entrainement',wait_until='networkidle')
 assert broken.locator('.training-progress progress').get_attribute('value')=='0'
 broken.get_by_role('tab',name='Plateau libre',exact=True).click()
 assert '0 coup(s)' in broken.locator('.training-board-caption').inner_text()
 blocked=browser.new_page()
 blocked.on('pageerror',lambda e:errors.append(str(e)))
 blocked.add_init_script("const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('kropki-training'))throw new Error('blocked test');return original.call(this,k,v);};")
 blocked.goto(BASE+'/entrainement',wait_until='networkidle')
 expect(blocked.locator('.training-local-note')).to_contain_text('Stockage indisponible')
 blocked.locator('[data-cell="2-3"]').click()
 expect(blocked.locator('.training-result')).to_contain_text('Bien joué')
 assert not errors, errors
 print('PASS training: six real exercises, failure/solution not counted, assisted progress, capture/liberation/defense, worker analysis and fresh responses, sandbox/undo/reload, isolated local save, six widths, keyboard/touch, corrupt/blocked storage, no JS errors')
 browser.close()