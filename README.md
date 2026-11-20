# Kropki

Kropki est un jeu de stratégie sur grille. Le client Web propose des parties locales, un adversaire informatique, des tutoriels et exercices, des invitations privées et des duels classés avec Elo. Le serveur valide les coups en ligne, gère les retours après déconnexion et conserve les parties dans une base libSQL/Turso.

## État des clients

- **Web** : client produit principal, servi avec l’API depuis Bun.
- **Mobile** : socle Expo en place; les écrans de jeu et les parcours Kropki restent à développer.
- **Desktop** : coque Electron qui embarque le build Web pour les distributions de bureau.

## Démarrage Web

Prérequis : Bun 1.3.14 et une base libSQL/Turso.

```sh
bun install
cp .env.template .env
# Renseigner DATABASE_URL, BETTER_AUTH_SECRET et les paramètres d’authentification.
bun run db:push
bun run dev
```

Le site de développement utilise le port attribué dans `__ports.cjs` (4200 dans ce dépôt). Les détails des variables sont dans [DEMARRAGE.md](DEMARRAGE.md). Ne jamais committer `.env`.

## Commandes principales

```sh
bun run dev                 # Web et API
bun run dev:mobile          # Expo
bun run dev:desktop         # Coque Electron en développement
bun run build               # Web et Desktop
bun run typecheck           # Web, Mobile et Desktop
bun run lint
bun test packages/web/src/web/lib packages/web/src/api/services
```

Pour préparer une distribution Electron, depuis la racine :

```sh
bun run --cwd packages/desktop dist
```

Les profils EAS de production exigent `EXPO_PUBLIC_API_URL`, `EXPO_ANDROID_PACKAGE` et `EXPO_IOS_BUNDLE_IDENTIFIER`. Les identifiants de paquet doivent appartenir au propriétaire de la publication.

## Documentation

- [Démarrage et configuration](DEMARRAGE.md)
- [Règles et fonctionnalités](GAMEPLAY.md)
- [Audit fonctionnel](AUDIT.md)
- [Mesures de performance](PERFORMANCE.md)
- [Direction visuelle](design.md)

## Intégration continue

Sur chaque pull request, GitHub Actions installe les dépendances avec le lockfile, exécute les tests Web, le lint, le typecheck des trois clients et les builds Web/Desktop.
