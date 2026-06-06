# Glow Up RPG — SaaS

Migration propre du prototype HTML mono-fichier (`glowupapp-v36`) vers une vraie application **Next.js (App Router) + TypeScript strict + Tailwind + Supabase (Auth + Postgres + RLS)**.

Le prototype est resté la source de vérité : produit, écrans, logique de jeu et design ont été conservés. Ce qui a changé, c'est l'architecture — le frontend **affiche**, l'API/les services **décident**, Supabase **stocke** (plus de `localStorage` pour les données importantes).

---

## 1. Démarrage rapide

```bash
npm install
cp .env.example .env.local   # puis remplis les valeurs Supabase
npm run dev                  # http://localhost:3000
```

Scripts : `npm run dev` · `npm run build` · `npm run start` · `npm run typecheck` · `npm run lint`.

## 2. Configuration Supabase

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Dans **Project Settings → API**, récupère :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - clé `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - clé `service_role` (secrète) → `SUPABASE_SERVICE_ROLE_KEY`
3. Dans le **SQL Editor**, exécute les migrations **dans l'ordre** :
   1. `supabase/migrations/001_initial_schema.sql`
   2. `supabase/migrations/002_rls_policies.sql`
   3. `supabase/migrations/003_auth_profile_trigger.sql`
4. **Authentication → Providers** : active **Email**. Pour tester sans boîte mail, tu peux désactiver « Confirm email » le temps du développement.
5. (Optionnel) régénère les types depuis la vraie base :
   ```bash
   export SUPABASE_PROJECT_ID=xxxx
   npm run db:types
   ```

À l'inscription, un trigger crée automatiquement le profil, les 8 statistiques par défaut et les objectifs nutritionnels.

## 3. Architecture

```
app/
  (marketing)/        Landing sobre (public)
  (auth)/             login + signup
  (app)/              15 écrans protégés (dashboard, character, quests, …)
  api/                API REST JSON par ressource (collection + [id])
  auth/               callback / confirm / signout (handlers Supabase)
components/
  ui/                 primitives (PageHead, ProgressBar, EmptyState…)
  layout/             Sidebar, AppShell (topbar)
  auth/               formulaire d'authentification
  features/           managers clients (actions, finance, nutrition, training…)
server/
  shared/             api helpers, CRUD générique, route-factory
  <ressource>/        validation (Zod) · repository · service
lib/supabase/         clients browser / server / middleware / admin
types/                database.types.ts (régénérable) + types métier
supabase/migrations/  schéma · RLS · triggers
```

**Flux d'une requête** : composant → `lib/api-client` → `app/api/.../route.ts` → `server/<resource>/service` (logique métier) → `repository` → Supabase (RLS). L'`user_id` est toujours résolu côté serveur depuis la session — jamais envoyé par le client.

### Décisions de modélisation
- `finance_entries` unique avec une colonne `type` (`income` | `expense`).
- `workouts` unique avec un discriminant `type` (`strength` | `run` | `boxing`) et les champs spécifiques en `jsonb data`.
- Préférences + série (`streak`) repliées dans `profiles`.
- `nutrition_goals` en table dédiée (une ligne par utilisateur).

### Sécurité
- **RLS activée sur toutes les tables** : chaque ligne est privée à son propriétaire (`auth.uid()`).
- La clé `service_role` n'est utilisée que dans `lib/supabase/admin.ts` (marqué `server-only`).
- Validation **Zod** sur toutes les entrées d'API.

## 4. Tester le parcours
1. `/signup` → crée un personnage.
2. `/dashboard` → vue d'ensemble (niveau, KPIs réels).
3. `/stats` → enregistre une action (presets inclus) : les statistiques bougent, la série s'incrémente, l'historique se remplit.
4. Parcours `/quests`, `/finance`, `/nutrition`, `/training`, etc.
5. `/settings` → profil, préférences, **export JSON**, déconnexion.

## 5. État & prochaines étapes
- Les 15 écrans sont câblés aux données réelles via l'API.
- **Export / Import** complets dans `/settings` : l'export produit un JSON, l'import le restaure (ajout non destructif des listes, upsert du profil, des objectifs nutritionnels et des stats ; l'`user_id` est toujours ré-estampillé côté serveur et seules les colonnes autorisées sont écrites).
- **Statistiques personnalisées** : ajout/suppression depuis `/stats` (les 8 stats par défaut restent protégées).
- **Stripe** n'est pas implémenté (aucune page pricing dans le prototype) : variables laissées en commentaire dans `.env.example`. À brancher seulement si une offre payante est ajoutée.
- Les API REST étant indépendantes de l'UI, une app mobile pourrait consommer les mêmes endpoints.

## 6. Stack
Next.js 14 (App Router) · React 18 · TypeScript (strict, `noUncheckedIndexedAccess`) · Tailwind CSS · Supabase (`@supabase/ssr`, `@supabase/supabase-js`) · Zod.
