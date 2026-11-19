import { captured, createGame, other, play, type Game, type Player } from "./kropki";
import { immediateCaptures, moveImpact, coordinate } from "./training-analysis";

export type Exercise = {
  id: string;
  category: "Capture" | "Défense" | "Libération";
  level: string;
  title: string;
  objective: string;
  lesson: string;
  hint: string;
  solution: [number, number];
  create: () => Game;
  goal: { captures?: number; liberations?: number; defense?: true };
};

function place(g: Game, p: Player, points: number[][]) {
  for (const [x, y] of points) g.board[y * g.w + x] = p;
  return g;
}
function diamond() {
  const g = createGame(7, 7);
  place(g, 2, [[3, 3]]);
  return place(g, 1, [
    [3, 2],
    [4, 3],
    [3, 4],
  ]);
}
function rectangle(defense = false) {
  const g = createGame(7, 7),
    ring = defense ? 2 : 1,
    inside = other(ring);
  place(g, inside, [
    [2, 3],
    [4, 3],
  ]);
  place(g, ring, [
    [1, 2],
    [2, 2],
    [4, 2],
    [5, 2],
    [1, 3],
    [5, 3],
    [1, 4],
    [2, 4],
    [3, 4],
    [4, 4],
    [5, 4],
  ]);
  return g;
}
function liberation(diamondShape: boolean) {
  let g = createGame(9, 9);
  g.turn = 2;
  place(g, 1, [[4, 4]]);
  place(g, 2, [
    [4, 3],
    [5, 4],
    [4, 5],
  ]);
  g = play(g, 3, 4);
  if (diamondShape) {
    place(g, 1, [
      [3, 2],
      [2, 3],
      [1, 4],
      [2, 5],
      [3, 6],
      [4, 7],
      [5, 6],
      [6, 5],
      [7, 4],
      [6, 3],
      [5, 2],
    ]);
  } else {
    for (let i = 1; i <= 7; i++)
      place(g, 1, [
        [i, 1],
        [i, 7],
        [1, i],
        [7, i],
      ]);
    g.board[1 * 9 + 4] = 0;
  }
  g.turn = 1;
  // Positions composed for teaching, not the replay of a live match.
  g.moves = [];
  return g;
}

export const EXERCISES: Exercise[] = [
  {
    id: "capture-diagonale",
    category: "Capture",
    level: "Découverte",
    title: "Fermer le losange",
    objective: "Capture le point rouge en un seul coup.",
    lesson:
      "Des points voisins en diagonale forment aussi une frontière. La boucle doit être fermée autour du point adverse.",
    hint: "Trois côtés entourent déjà le rouge. Cherche le quatrième sommet, à gauche.",
    solution: [2, 3],
    create: diamond,
    goal: { captures: 1 },
  },
  {
    id: "capture-double",
    category: "Capture",
    level: "Application",
    title: "Deux points, une boucle",
    objective: "Capture les deux points rouges en un seul coup.",
    lesson:
      "Une seule fermeture peut capturer plusieurs points. Le score dépend des points adverses enfermés, pas de la surface.",
    hint: "La frontière du haut possède une seule ouverture. Relie ses deux segments.",
    solution: [3, 2],
    create: () => rectangle(),
    goal: { captures: 2 },
  },
  {
    id: "defense-losange",
    category: "Défense",
    level: "Découverte",
    title: "Couper la menace",
    objective: "Empêche toute capture rouge au prochain coup, sans sacrifier de point bleu.",
    lesson:
      "Occuper le dernier sommet d’une boucle adverse peut empêcher sa fermeture. Vérifie que ton point reste libre après la réponse adverse.",
    hint: "Si les rouges pouvaient jouer maintenant, ils fermeraient leur losange à gauche. Occupe cette intersection avant eux.",
    solution: [2, 3],
    create: () => {
      const g = diamond();
      g.board = g.board.map((p) => (p === 1 ? 2 : p === 2 ? 1 : 0));
      return g;
    },
    goal: { defense: true },
  },
  {
    id: "defense-double",
    category: "Défense",
    level: "Application",
    title: "Sauver les deux bleus",
    objective: "Protège tes deux points : aucune capture rouge possible au coup suivant.",
    lesson:
      "Une ouverture unique peut protéger tout un groupe. Ici, la défense se vérifie en testant chaque coup rouge légal après ton choix.",
    hint: "La chaîne rouge est interrompue sur son côté diagonal, en haut à gauche. Occupe son point de raccord.",
    solution: [2, 2],
    create: () => {
      const g = createGame(7, 7);
      place(g, 1, [
        [3, 3],
        [4, 3],
      ]);
      return place(g, 2, [
        [3, 1],
        [4, 2],
        [5, 3],
        [4, 4],
        [3, 5],
        [2, 4],
        [1, 3],
      ]);
    },
    goal: { defense: true },
  },
  {
    id: "liberation-carre",
    category: "Libération",
    level: "Intermédiaire",
    title: "Reprendre le territoire",
    objective: "Libère le bleu capturé et capture les quatre rouges en un coup.",
    lesson:
      "Une capture extérieure absorbe le territoire adverse intérieur. Tes points auparavant capturés sont libérés et son ancien score diminue.",
    hint: "Ne cherche pas à jouer dans la petite zone capturée. Ferme la grande frontière bleue au-dessus.",
    solution: [4, 1],
    create: () => liberation(false),
    goal: { captures: 4, liberations: 1 },
  },
  {
    id: "liberation-diagonale",
    category: "Libération",
    level: "Intermédiaire",
    title: "La reconquête diagonale",
    objective: "Reconquiers la zone : libère un bleu et capture quatre rouges.",
    lesson:
      "La libération fonctionne aussi avec une frontière extérieure diagonale. Observe la disparition de la petite zone rouge et les deux variations de score.",
    hint: "Suis la grande chaîne bleue en losange : il ne lui manque que son sommet supérieur.",
    solution: [4, 1],
    create: () => liberation(true),
    goal: { captures: 4, liberations: 1 },
  },
];

export function attemptExercise(exercise: Exercise, g: Game, x: number, y: number) {
  const impact = moveImpact(g, x, y);
  if (!impact)
    return {
      game: g,
      success: false,
      message: "Cette intersection est occupée ou capturée. Choisis un point libre.",
    };
  const next = play(g, x, y);
  let success: boolean;
  let message: string;
  if (exercise.goal.defense) {
    const threats = immediateCaptures(next);
    const sacrificed = next.board.some(
      (p, i) => p === g.turn && captured(next, i) && !captured(g, i),
    );
    success = !sacrificed && !threats.length;
    message = success
      ? "Défense vérifiée : aucun coup rouge légal ne capture de point au prochain tour."
      : sacrificed
        ? "Ce coup sacrifie un point bleu. Essaie une intersection qui bloque la fermeture."
        : `Les rouges peuvent encore capturer en ${coordinate(threats[0].x, threats[0].y)}. Recommence pour bloquer cette menace.`;
  } else {
    success =
      impact.captured >= (exercise.goal.captures ?? 0) &&
      impact.liberated >= (exercise.goal.liberations ?? 0) &&
      !impact.selfCaptured;
    message = success
      ? `${impact.captured} point(s) capturé(s)${impact.liberated ? ` et ${impact.liberated} point libéré` : ""}. L'objectif est atteint !`
      : `Ce coup capture ${impact.captured} point(s) et en libère ${impact.liberated}. L'objectif n'est pas encore atteint : reprends la position initiale.`;
  }
  return { game: next, success, message };
}
