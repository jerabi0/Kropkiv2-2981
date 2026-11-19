from playwright.sync_api import sync_playwright
import secrets,time
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
 contexts=[browser.new_context(viewport={'width':1440,'height':1080}) for _ in range(3)]
 pages=[c.new_page() for c in contexts]
 errors=[]
 for page in pages:page.on('pageerror',lambda e:errors.append(str(e)))
 suffix=secrets.token_hex(6)
 for i,page in enumerate(pages):
  page.goto('http://localhost:4200/connexion',wait_until='networkidle')
  page.get_by_role('button',name='Inscription',exact=True).click()
  page.get_by_label('Pseudonyme public',exact=True).fill(['Bleu test','Rouge test','Tiers test'][i])
  page.get_by_label('E-mail',exact=True).fill(f'kropki-{suffix}-{i}@example.test')
  page.get_by_label('Mot de passe',exact=True).fill(secrets.token_urlsafe(20))
  page.get_by_role('button',name='Créer mon compte',exact=True).click()
  page.wait_for_url('**/en-ligne',timeout=30000)
 host,guest,third=pages
 host.screenshot(path='/home/user/kropki/salon-desktop.png',full_page=True)
 for width in [360,390,680,768,1024,1440]:
  host.set_viewport_size({'width':width,'height':1000})
  assert host.evaluate('document.documentElement.scrollWidth')==width,f'overflow lobby {width}'
 host.set_viewport_size({'width':1440,'height':1080})
 host.locator('#online-duration').select_option('3')
 host.get_by_role('button',name='Créer mon lien',exact=True).click()
 host.wait_for_url('**/partie/*')
 url=host.url
 assert host.get_by_label('Ton lien privé').input_value()==url
 guest.goto(url,wait_until='networkidle')
 guest.get_by_role('button',name='Rejoindre la partie',exact=True).click()
 guest.get_by_role('button',name='Je suis prêt',exact=True).wait_for()
 host.get_by_role('button',name='Je suis prêt',exact=True).click()
 guest.get_by_role('button',name='Je suis prêt',exact=True).click()
 host.wait_for_function("document.querySelector('.message').textContent.includes('À toi')")
 assert 'Au premier pion' in host.locator('.match-clock').inner_text()
 third.goto(url,wait_until='networkidle')
 assert third.get_by_role('button',name='Cette salle est complète',exact=True).is_disabled()
 assert third.locator('[data-cell]').count()==0
 moves=[(host,3,2),(guest,3,3),(host,4,3),(guest,10,10),(host,3,4),(guest,11,10),(host,2,3)]
 for index,(page,x,y) in enumerate(moves):
  page.wait_for_function(f"document.querySelector('.game-facts div:last-child strong').textContent === '{index}'")
  page.locator(f'[data-cell="{x}-{y}"]').wait_for(state='visible')
  page.wait_for_function(f"!document.querySelector('[data-cell=\"{x}-{y}\"]').disabled")
  page.locator(f'[data-cell="{x}-{y}"]').click()
  page.wait_for_function(f"document.querySelector('.game-facts div:last-child strong').textContent === '{index+1}'")
 host.wait_for_function("document.querySelector('.online-players').textContent.includes('1 capturé')")
 guest.wait_for_function("document.querySelector('.online-players').textContent.includes('1 capturé')")
 contexts[0].set_offline(True)
 host.get_by_label('Actualiser la partie',exact=True).click()
 host.wait_for_function("document.querySelector('.sync-note').textContent.includes('Connexion interrompue')")
 assert host.locator('[data-cell="0-0"]').is_disabled()
 contexts[0].set_offline(False)
 host.get_by_label('Actualiser la partie',exact=True).click()
 host.wait_for_function("!document.querySelector('.sync-note').textContent.includes('Connexion interrompue')")
 host.reload(wait_until='networkidle')
 assert '1 capturé' in host.locator('.online-players').inner_text()
 host.screenshot(path='/home/user/kropki/online-desktop.png',full_page=True)
 guest.set_viewport_size({'width':390,'height':844})
 guest.screenshot(path='/home/user/kropki/audit-online-mobile.png',full_page=True)
 assert guest.evaluate('document.documentElement.scrollWidth')==390, guest.evaluate("Array.from(document.querySelectorAll('*')).filter(e=>e.getBoundingClientRect().right>391).map(e=>[e.tagName,e.className,e.getBoundingClientRect().right]).slice(0,20)")
 guest.screenshot(path='/home/user/kropki/online-mobile.png',full_page=True)
 host.get_by_role('button',name='Abandonner',exact=True).click()
 host.get_by_role('button',name='Confirmer l’abandon',exact=True).click()
 host.wait_for_function("document.querySelector('.message').textContent.includes('Les rouges remportent')")
 guest.wait_for_function("document.querySelector('.message').textContent.includes('Les rouges remportent')")
 host.get_by_role('button',name='Revoir la partie',exact=True).click()
 host.get_by_role('button',name='Fin de la partie',exact=True).click()
 assert '1 capturé' in host.locator('.online-players').inner_text()
 for width in [360,390,680,768,1024,1440]:
  host.set_viewport_size({'width':width,'height':1000})
  assert host.evaluate('document.documentElement.scrollWidth')==width,f'overflow room {width}'
 assert not errors,errors
 print('PASS: 3 comptes e-mail réels, salle privée à 2, tiers refusé, prêts, alternance, capture, synchronisation, déconnexion/reconnexion, reload, abandon malgré avance, relecture, salon et salle sur 6 largeurs, aucun JS error')
 browser.close()