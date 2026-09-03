# Publication automatique du blog ZipQuantum

Cette automatisation surveille `https://zq.tn/blog/feed/` toutes les 10 minutes et publie chaque nouvel article sur LinkedIn, GitHub Discussions, Reddit et X.

## Garanties de fonctionnement

- Le premier passage initialise une référence et **ne republie pas les anciens articles**.
- Le registre `social-publisher/data/published.json` suit chaque article séparément pour chaque canal.
- Si un canal échoue après que les autres ont réussi, le passage suivant ne retente que ce canal.
- L'image principale trouvée dans le flux est envoyée à LinkedIn comme vignette; si son envoi échoue, l'article est quand même publié sans vignette.
- Les jetons restent dans GitHub Actions Secrets et ne sont jamais écrits dans le dépôt.
- Une exécution manuelle peut publier les `N` articles les plus récents avec `backfill_count`.

## 1. Mettre ces fichiers dans le dépôt GitHub choisi

GitHub Discussions doit être activé dans **Settings → General → Features → Discussions**. La catégorie `Announcements` existe généralement par défaut. Le workflow y publiera une Discussion pour chaque article.

## 2. Ajouter les variables GitHub Actions

Dans **Settings → Secrets and variables → Actions → Variables**, ajouter :

| Variable | Valeur |
| --- | --- |
| `SOCIAL_ENABLED_CHANNELS` | `linkedin,github,reddit,x` (valeur par défaut) |
| `LINKEDIN_AUTHOR_URN` | `urn:li:organization:ID_DE_LA_PAGE` |
| `LINKEDIN_VERSION` | `202608` par défaut (à actualiser quand LinkedIn retire cette version) |
| `GITHUB_DISCUSSION_CATEGORY` | `announcements` par défaut |
| `REDDIT_SUBREDDIT` | `u_ZipQuantum` par défaut |
| `REDDIT_USER_AGENT` | préconfiguré pour `/u/ZipQuantum` |

## 3. Ajouter les secrets GitHub Actions

Dans l'onglet **Secrets**, ajouter :

- `SOCIAL_GITHUB_TOKEN` : jeton finement configuré du compte éditeur, limité au dépôt cible avec `Discussions: read and write`. Les Discussions automatiques apparaîtront sous ce compte.
- `LINKEDIN_ACCESS_TOKEN` : jeton utilisateur disposant de `w_organization_social` et d'un rôle autorisé sur la page.
- `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_REFRESH_TOKEN` : application OAuth Reddit autorisée à publier avec le scope `submit`.
- `X_CONSUMER_KEY`, `X_CONSUMER_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET` : application X configurée avec les droits **Read and write**.

Le jeton GitHub interne reste utilisé par `actions/checkout` pour persister le registre. Le jeton `SOCIAL_GITHUB_TOKEN` sert uniquement à publier les Discussions sous l'identité du compte éditeur.

Le workflow doit aussi pouvoir pousser son petit commit de registre sur la branche par défaut. Si une règle de protection interdit les pushes de GitHub Actions, autoriser ce workflow ou utiliser une branche dédiée pour le registre; sans persistance du registre, aucun système externe ne peut garantir l'absence de doublons après un redémarrage.

## 4. Initialiser et vérifier

1. Ouvrir **Actions → Publish new blog articles to social channels → Run workflow**.
2. Laisser `backfill_count` à `0` pour seulement enregistrer les articles existants.
3. Vérifier le commit automatique du registre.
4. Pour un test réel contrôlé, relancer manuellement avec `backfill_count = 1`. Cela publie le dernier article une seule fois sur les quatre canaux.

## Tests locaux sans publication

```bash
npm test
npm run dry-run
```

Le mode simulation télécharge le vrai flux mais n'appelle aucune API sociale et ne modifie pas le registre.

## Personnalisation du texte

Les formats se trouvent dans `social-publisher/src/format.js`. Le lien de l'article est toujours inclus afin que les aperçus sociaux et les clics pointent vers la page canonique ZipQuantum.

## Notes d'accès API

- LinkedIn impose l'accès à son API Community Management et ses jetons ont une durée de vie limitée selon le programme utilisé. Prévoir leur rotation.
- X exige un niveau d'accès API permettant `POST /2/tweets`; la facturation et les quotas du compte X s'appliquent.
- Reddit exige une application OAuth conforme à ses règles d'accès et le compte doit être autorisé à publier dans le subreddit cible.
