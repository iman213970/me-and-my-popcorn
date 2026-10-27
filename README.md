# Me and my popcorn

Appli de suivi de séries et de films (iOS, Android, web), construite avec Expo (React Native).

## État actuel (étape 1 : le socle)
- Accueil : temps de visionnage, séries en cours (+1 épisode), répartition par genre, favoris, à regarder
- Catalogue : recherche, filtre type et genre, infos du titre non modifiables
- Ma liste : grille d'affiches, tri, filtre
- Fiche : Mon suivi (avancement, saison/épisode, dates, plateforme, favori) et Mon avis (note /10, avis, citation, personnage, moment)
- Profil : avatar, pseudo, bio, genres et plateformes préférés (dont plateformes ajoutées à la main)
- Données gardées sur l'appareil pour l'instant (catalogue d'exemple de 10 titres)

## À venir
Base de données et connexion (Supabase), catalogue TMDB, amis et profils, recommandations, À venir, récap, séries à plusieurs.

## Commandes
```bash
npm install
npx expo start        # développement
npx expo export -p web  # version web dans dist/
npm run typecheck
```

Le nom de l'appli est dans `src/config.ts` et `app.json`.
