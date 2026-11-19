import { Route, Switch, Link } from "wouter";
import { lazy, Suspense, useEffect, useState } from "react";
import { authReady } from "./lib/auth";
import Index from "./pages/index";
import { Provider } from "./components/provider";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";

const SignIn = lazy(() => import("./pages/sign-in"));
const Online = lazy(() => import("./pages/online"));
const PrivateGame = lazy(() => import("./pages/private-game"));
const Statistics = lazy(() => import("./pages/statistics"));
const Training = lazy(() => import("./pages/training"));

function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void authReady.then(() => setReady(true));
  }, []);
  if (!ready) return <div className="arena">Chargement…</div>;
  return (
    <Provider>
      <Suspense fallback={<main className="arena-main" style={{padding:"3rem", minHeight:"70vh"}}><output>Chargement de la page…</output></main>}>
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/connexion" component={SignIn} />
        <Route path="/en-ligne" component={Online} />
        <Route path="/statistiques" component={Statistics} />
        <Route path="/entrainement" component={Training} />
        <Route path="/partie/:id" component={PrivateGame} />
        <Route>
          <main className="arena-main" style={{padding:"3rem", minHeight:"70vh"}}>
            <h1>Page introuvable.</h1>
            <p>Ce lien ne correspond à aucune page de Kropki.</p>
            <Link className="primary-button" href="/">Retour au jeu</Link>
            <p><Link href="/en-ligne">Retrouver mes parties en ligne</Link></p>
          </main>
        </Route>
      </Switch>
      </Suspense>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
