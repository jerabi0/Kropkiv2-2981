from playwright.sync_api import sync_playwright
import secrets
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
 contexts=[b.new_context(viewport={'width':1440,'height':1050}) for _ in range(2)]
 pages=[c.new_page() for c in contexts];errors=[]
 for i,page in enumerate(pages):
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://localhost:4200/connexion',wait_until='networkidle')
  if i==0:
   page.screenshot(path='/home/user/kropki/play-connexion-desktop.png',full_page=True)
   for width in [360,390,680,768,1024,1440]:
    page.set_viewport_size({'width':width,'height':1050});assert page.evaluate('document.documentElement.scrollWidth')==width
   page.set_viewport_size({'width':1440,'height':1050})
  page.get_by_role('button',name='Inscription',exact=True).click()
  page.get_by_label('Pseudonyme public',exact=True).fill('Classe browser '+str(i))
  page.get_by_label('E-mail',exact=True).fill('classe-browser-'+secrets.token_hex(6)+'@example.test')
  page.get_by_label('Mot de passe',exact=True).fill(secrets.token_urlsafe(20))
  page.get_by_role('button',name='Créer mon compte',exact=True).click();page.wait_for_url('**/en-ligne')
 a,c=pages
 a.locator('.ranked-search').get_by_role('link',name='Mes statistiques',exact=True).click();a.wait_for_url('**/statistiques')
 a.wait_for_function("document.querySelector('[data-testid=elo-value]')?.textContent==='1200'")
 assert 'Tout commence à 1 200' in a.locator('.results-card').inner_text()
 a.get_by_role('link',name='Trouver un adversaire',exact=True).click();a.wait_for_url('**/en-ligne')
 a.get_by_label('Plateau classé',exact=True).select_option('21')
 a.get_by_label('Durée classée',exact=True).select_option('7')
 a.get_by_role('button',name='Trouver un adversaire',exact=True).click()
 a.get_by_role('button',name='Annuler la recherche',exact=True).wait_for()
 assert a.get_by_label('Plateau classé',exact=True).is_disabled()
 a.reload(wait_until='networkidle');a.get_by_role('button',name='Annuler la recherche',exact=True).wait_for()
 assert a.get_by_label('Plateau classé',exact=True).input_value()=='21'
 assert a.get_by_label('Durée classée',exact=True).input_value()=='7'
 a.get_by_role('button',name='Annuler la recherche',exact=True).click();a.get_by_role('button',name='Trouver un adversaire',exact=True).wait_for()
 a.get_by_label('Plateau classé',exact=True).select_option('17')
 a.get_by_label('Durée classée',exact=True).select_option('3')
 a.get_by_role('button',name='Trouver un adversaire',exact=True).click();a.get_by_role('button',name='Annuler la recherche',exact=True).wait_for()
 a.screenshot(path='/home/user/kropki/play-search-desktop.png',full_page=True)
 c.get_by_role('button',name='Trouver un adversaire',exact=True).click()
 for page in pages:page.wait_for_url('**/partie/*',timeout=30000);page.get_by_role('button',name='Je suis prêt',exact=True).wait_for()
 assert a.url==c.url
 assert a.get_by_label('Ton lien privé').count()==0
 for page in pages:page.get_by_role('button',name='Je suis prêt',exact=True).click()
 for page in pages:page.wait_for_function("document.querySelector('.message').textContent.includes('jouer.')")
 blue=next(page for page in pages if 'TU JOUES LES BLEUS' in page.locator('.page-heading .eyebrow').inner_text())
 red=next(page for page in pages if page!=blue)
 for index,(page,x,y) in enumerate([(blue,3,2),(red,3,3),(blue,4,3),(red,10,10),(blue,3,4),(red,11,10),(blue,2,3)]):
  page.wait_for_function(f"document.querySelector('.game-facts div:last-child strong').textContent==='{index}'")
  page.wait_for_function(f"!document.querySelector('[data-cell=\"{x}-{y}\"]').disabled")
  page.locator(f'[data-cell="{x}-{y}"]').click()
  page.wait_for_function(f"document.querySelector('.game-facts div:last-child strong').textContent==='{index+1}'")
 blue.wait_for_function("document.querySelector('.online-players').textContent.includes('1 capturé')")
 for page in pages:
  page.locator('.arena-seal').wait_for()
  assert page.locator('.online-players .arena-avatar').count()==1
 for page in pages:page.locator('.arena-fx').wait_for(state='detached')
 blue.reload(wait_until='networkidle');assert '1 capturé' in blue.locator('.online-players').inner_text()
 blue.screenshot(path='/home/user/kropki/play-ranked-desktop.png',full_page=True,animations='disabled')
 blue.get_by_role('button',name='Abandonner',exact=True).click();blue.get_by_role('button',name='Confirmer l’abandon',exact=True).click()
 for page in pages:page.locator('.rating-change').wait_for();assert 'Les rouges remportent' in page.locator('.message').inner_text()
 assert '1184' in blue.locator('.rating-change').inner_text()
 assert '1216' in red.locator('.rating-change').inner_text()
 for page,elo,outcome in [(blue,'1184','Défaite'),(red,'1216','Victoire')]:
  page.get_by_role('link',name='Voir ma progression',exact=True).click();page.wait_for_url('**/statistiques')
  page.wait_for_function(f"document.querySelector('[data-testid=elo-value]')?.textContent==='{elo}'")
  assert outcome in page.locator('.ranked-results').inner_text()
  assert '0 victoires · 0 nuls · 0 défaites' in page.locator('.private-stats').inner_text()
 red.screenshot(path='/home/user/kropki/play-stats-desktop.png',full_page=True)
 for width in [360,390,680,768,1024,1440]:
  red.set_viewport_size({'width':width,'height':1050});assert red.evaluate('document.documentElement.scrollWidth')==width,f'stats overflow {width}'
 red.set_viewport_size({'width':390,'height':844});red.screenshot(path='/home/user/kropki/play-stats-mobile.png',full_page=True)
 red.get_by_role('link',name='Jouer en ligne',exact=True).first.click();red.wait_for_url('**/en-ligne')
 red.wait_for_function("document.querySelector('.ranked-summary').textContent.includes('1216')")
 assert 'Classée' in red.locator('.my-games').inner_text()
 red.screenshot(path='/home/user/kropki/play-lobby-mobile.png',full_page=True)
 assert not errors,errors
 print('PASS ranked browsers: two real accounts, initial empty stats, search/cancel/reload, automatic same-room pairing, both ready, capture, reload, resignation/Elo on both screens, real history, private isolation, six widths, no JS errors')
 b.close()