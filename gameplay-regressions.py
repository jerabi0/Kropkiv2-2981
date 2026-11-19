"""Historical scripts adapted to selection+confirmation (not direct mode)."""
import runpy
from playwright.sync_api import Locator
click0, tap0 = Locator.click, Locator.tap
checked_room = False
def finish(locator):
 global checked_room
 page = locator.page
 button = page.get_by_role('button', name='Confirmer le coup', exact=True)
 if button.count() == 1 and button.is_enabled():
  if '/partie/' in page.url and not checked_room:
   page.wait_for_timeout(2500)
   assert button.is_enabled(), 'Selection lost during server polling'
   checked_room = True
  click0(button)
def click(self, *args, **kwargs):
 result = click0(self, *args, **kwargs)
 finish(self)
 return result
def tap(self, *args, **kwargs):
 result = tap0(self, *args, **kwargs)
 finish(self)
 return result
Locator.click, Locator.tap = click, tap
for script in ['browser-test.py', 'timed-browser-test.py', 'training-browser-test.py', 'anime-browser-test.py', 'online-browser-test.py', 'ranked-browser-test.py']:
 print('Regression with confirmation:', script, flush=True)
 runpy.run_path(script, run_name='__main__')