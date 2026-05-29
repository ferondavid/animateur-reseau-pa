# Inventaire Supabase attendu par l'application

## Tables utilisées (`supabase.from(...)`)

| Table | Colonnes clés utilisées dans le code | Contraintes CHECK déduites |
|-------|--------------------------------------|---------------------------|
| `magasins` | id, nom, enseigne, adresse, code_postal, ville, region, latitude, longitude, contact_telephone, statut | statut IN ('actif','pause','inactif') |
| `visites` | id, magasin_id, date_prevue, date_realisee, statut, objectif, points_cles, note_confiance, note_business | statut IN ('planifiee','realisee','annulee') |
| `remontees` | id, magasin_id, type, titre, description, gravite, statut, photo_url, audio_url, reponse_animateur, date_traitement, created_at, **source** | type IN ('commerciale','sav_technique','concurrence','opportunite','autre'), gravite IN ('normale','attention','urgente'), statut IN ('nouvelle','en_cours','traitee','archivee'), **source IN ('animateur','membre','visite')** |
| `actions` | id, titre, description, niveau_urgence, portee, magasin_id, statut, deadline, created_at | statut IN ('ouverte','en_cours','realisee','annulee'), portee IN ('magasin','reseau') |
| `evaluations_visite` | id, visite_id, magasin_id, q1_ecoute..q6_satisfaction_globale, commentaire_texte, created_at | — |
| `rendez_vous` | id, magasin_id, type, date_souhaitee, heure_souhaitee, objet, message, lieu, lien_visio, statut, demandeur_type, created_at | type IN ('physique','tel','visio'), statut IN ('demande','confirme','reporte','annule','fait'), demandeur_type IN ('magasin','animateur') |
| `rendez_vous_invites` | rendez_vous_id, magasin_id | PK composite |
| `news` | id, titre, contenu, image_url, type, auteur, publie, epinglee, date_publication, created_at | type IN ('info','evenement','alerte','temoignage') |

## Buckets Storage

| Bucket | Accès | Usage |
|--------|-------|-------|
| `photos-remontees` | **Public** | Upload de pièces jointes par les membres |
| `news-images` | **Public** | Images des actualités réseau |

## Policies RLS requises (sans authentification)

Puisque l'app n'a pas encore de système d'auth côté utilisateur (rôle stocké en localStorage), **toutes les tables métier doivent être accessibles par le rôle `anon`** (clé publishable). La solution la plus simple est de désactiver RLS sur les tables métier OU d'ajouter des policies permissives.

Tables originales avec RLS + policies `get_user_role()` strictes : magasins, visites, remontees, actions, evaluations_visite → doivent autoriser `anon`.

Tables nouvelles avec RLS mais sans policy anon : rendez_vous, rendez_vous_invites, news.
