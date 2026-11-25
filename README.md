# themoviedb-discovery-app

Application web de découverte de films qui s'appuie sur l'API de [The Movie Database (TMDB)](https://www.themoviedb.org/). Elle affiche les films populaires en France et permet de consulter leur fiche détaillée.

## Fonctionnalités

- Liste des films populaires, avec pagination et paramètres de langue et de région.
- Fiche détaillée pour chaque film.
- Pages « À propos » et « Page introuvable ».
- Thème clair ou sombre, conservé dans le navigateur.
- API Express intermédiaire pour appeler TMDB sans exposer le jeton dans le navigateur.

Les paramètres par défaut sont la langue `fr-FR`, la région `FR` et la première page.

## Prérequis

- Node.js 24 (version indiquée dans `.nvmrc`).
- npm.
- Un jeton d'accès à l'API TMDB. Vous pouvez en obtenir un depuis les paramètres de votre compte TMDB, dans la section API.

## Installation et démarrage

1. Installez les dépendances :

   ```sh
   npm install
   ```

2. Créez un fichier `.env` à la racine du projet et ajoutez votre jeton d'accès :

   ```dotenv
   TMDB_ACCESS_TOKEN=votre_jeton_d_acces_tmdb
   ```

   Gardez ce jeton privé et ne le publiez pas dans le dépôt.

3. Démarrez le serveur et l'application :

   ```sh
   npm run dev
   ```

4. Ouvrez [http://localhost:5173](http://localhost:5173).

Le serveur Express écoute sur le port `3000`. Vite sert l'interface sur le port `5173` et transmet les requêtes `/api` au serveur Express.

## Création de la base de données

Après l'installation des dépendances, créez et initialisez la base SQLite avec le CLI du backend :

```sh
npx tsx src/back-end/backend-cli.ts create-database
```

Par défaut, le fichier `data/movies.sqlite` est créé avec le schéma nécessaire. Pour choisir un autre emplacement, utilisez l'option `--path` :

```sh
npx tsx src/back-end/backend-cli.ts create-database --path ./data/ma-base.sqlite
```

La commande initialise le schéma sans supprimer les données d'une base existante.

## Import et nettoyage des genres

La commande `add-genres` insère ou met à jour les genres listés dans un fichier CSV. Un fichier d'exemple est fourni dans `data/genres.csv` :

```sh
npx tsx src/back-end/backend-cli.ts add-genres ./data/genres.csv
```

Le fichier doit contenir exactement les colonnes `id` et `name`, dans n'importe quel ordre. Il est entièrement validé avant l'import : en cas d'erreur, aucun genre n'est enregistré. Un genre déjà présent est mis à jour, sans créer de doublon.

La commande `clean-genres` supprime les genres qui ne sont associés à aucun film :

```sh
npx tsx src/back-end/backend-cli.ts clean-genres
```

Les deux commandes utilisent `data/movies.sqlite` par défaut. Pour choisir une autre base, placez l'option `--path` avant le nom de la commande :

```sh
npx tsx src/back-end/backend-cli.ts --path ./data/custom-movies.sqlite add-genres ./data/genres.csv
npx tsx src/back-end/backend-cli.ts --path ./data/custom-movies.sqlite clean-genres
```

## Import et nettoyage des pays

La commande `add-countries` insère ou met à jour les pays listés dans un fichier CSV. Un fichier d'exemple est fourni dans `data/countries.csv` :

```sh
npx tsx src/back-end/backend-cli.ts add-countries ./data/countries.csv
```

Le fichier doit contenir exactement les colonnes `code` et `name`, dans n'importe quel ordre. Chaque code est composé de deux lettres majuscules (`FR`, `GB`, `US`…). Comme pour les genres, le fichier est validé avant l'import et un pays déjà présent est mis à jour sans doublon.

La commande `clean-countries` supprime les pays qui ne sont associés à aucun film :

```sh
npx tsx src/back-end/backend-cli.ts clean-countries
```

L'option `--path`, placée avant le nom de la commande, permet de choisir une autre base :

```sh
npx tsx src/back-end/backend-cli.ts --path ./data/custom-movies.sqlite add-countries ./data/countries.csv
npx tsx src/back-end/backend-cli.ts --path ./data/custom-movies.sqlite clean-countries
```

## API locale

| Méthode | Route                  | Description                                                       |
| ------- | ---------------------- | ----------------------------------------------------------------- |
| `GET`   | `/api/health`          | Vérifie que le serveur répond.                                    |
| `GET`   | `/api/movies/popular`  | Renvoie les films populaires.                                     |
| `GET`   | `/api/movies/:id`      | Renvoie les détails du film correspondant à son identifiant TMDB. |
| `GET`   | `/api/discover/movies` | Renvoie les films sortis une année donnée (API Discover de TMDB). |

Les routes des films acceptent les paramètres `language`, `page` et `region`. Exemple :

```text
/api/movies/popular?language=fr-FR&page=1&region=FR
```

### Films par année

La route `/api/discover/movies` interroge l'API Discover de TMDB avec le filtre `primary_release_year` :

```text
/api/discover/movies?year=2020
/api/discover/movies?year=2020&language=en-US&page=2&region=US
```

| Paramètre  | Obligatoire | Valeur par défaut | Description                                |
| ---------- | ----------- | ----------------- | ------------------------------------------ |
| `year`     | oui         | —                 | Année de sortie, de `1000` à `9999`.       |
| `language` | non         | `fr-FR`           | Langue des titres et résumés.              |
| `page`     | non         | `1`               | Page de résultats à renvoyer.              |
| `region`   | non         | `FR`              | Région utilisée par TMDB pour les sorties. |

Chaque appel renvoie une seule page de résultats. La réponse contient `page`, `results`, `total_pages` et `total_results` : pour consulter les pages suivantes, il faut relancer la requête avec le paramètre `page`.

Erreurs possibles :

- **400** : `year` est absent ou invalide. TMDB n'est pas appelé.
- **500** : l'appel à TMDB a échoué (erreur HTTP, réseau ou réponse illisible). La réponse contient le message `Failed to discover movies` et l'erreur est journalisée côté serveur.

## Vérifications

```sh
npm test          # Lance les tests avec la couverture
npm run test:verbose
npm run lint      # Vérifie le code
npm run fmt:check # Vérifie le formatage
```

La configuration de couverture des tests exige 100 % pour les instructions, branches, fonctions et lignes.
