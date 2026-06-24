# Fonctionnalités du CRM — Qui voit quoi

> Référence pour paramétrer la visibilité de chaque fonctionnalité par rôle.
> Mise à jour à **chaque nouvelle fonctionnalité**.

## Rôles
- 🧭 **Animateur** — accès total par défaut (voit tout, peut tout faire).
- 👤 **Associé** (rôle interne `membre`) — son espace, ses données.
- 🏛️ **Bureau** — **lecture seule** d'un périmètre de pilotage.
- 🌍 **Tous** — public (avant connexion) ou visible par tous les rôles.

La colonne **Visible par** liste qui voit la fonctionnalité **en plus de l'animateur** (qui a tout). « Animateur seul » = réservé à l'animateur.

> ⚙️ **Réglable dans l'app** : les accès **Bureau** (17 pages) et les **sections de la fiche Associé** (7 sections) se paramètrent en direct depuis **nav → Visibilité** (`/animateur/visibilite`). Le reste est fixe par conception.

---

## Accès & authentification
| Fonctionnalité | Visible par |
|---|---|
| Page de connexion (login unifié : identifiant + MDP) | 🌍 Tous |
| Mot de passe oublié → mail à l'animateur (+ 06 rappel) | 🌍 Tous |
| Espace Associé (sa fiche magasin) | 👤 Associé |
| Espace Bureau (`/bureau`, lecture seule) | 🏛️ Bureau |
| Espace Animateur (dashboard `/animateur`) | 🏛️ Bureau (réglable) · 🧭 Animateur |
| Installation PWA (iOS/Android) | 🌍 Tous |

## Pilotage & analyse réseau
| Fonctionnalité | Visible par |
|---|---|
| Pilotage réseau (cockpit, KPIs, magasins à risque, top/flop) | 🏛️ Bureau (réglable) |
| Santé réseau 360 (scorecard des 40 magasins) | 🏛️ Bureau (réglable) |
| Rapport d'activité (hebdo/mensuel, imprimable) | 🏛️ Bureau (réglable) |
| Carte du réseau (risque par magasin) | 🏛️ Bureau (réglable) |
| Magasins prioritaires à revisiter | 🧭 Animateur seul |

## CA / BFA
| Fonctionnalité | Visible par |
|---|---|
| Classement CA Leaders (page réseau, 40 associés) | 🏛️ Bureau (réglable) |
| Carte « CA & BFA » sur la fiche magasin | 👤 Associé (sa fiche) |
| Classement CA Leaders de l'associé (#N/40) sur sa fiche | 👤 Associé (le sien) |
| Évolution CA mensuelle (graphe, sa fiche) | 👤 Associé (sa fiche) |
| CA global / Leaders agrégés réseau | 🏛️ Bureau |

## Tournées
| Fonctionnalité | Visible par |
|---|---|
| Tournée suggérée (priorités + regroupement géo) | 🏛️ Bureau (réglable) |
| Parcours / itinéraire optimisé (+ arrêts recharge VE) | 🏛️ Bureau (réglable) |
| Tournée du jour / vue semaine | 🏛️ Bureau (réglable) |
| Préparation J+1 (heure de départ, charge batterie) | 🧭 Animateur seul |

## RDV & visites
| Fonctionnalité | Visible par |
|---|---|
| Demande de RDV (physique / tél / visio) | 👤 Associé (demande) |
| Agenda unifié (RDV + visites + Google Calendar) | 🧭 Animateur seul |
| RDV (liste animateur) | 🏛️ Bureau (réglable) |
| Visites planifiées & compte-rendu | 🏛️ Bureau (réglable) |
| Historique des visites de l'associé | 👤 Associé (le sien) |
| Évaluations de l'accompagnement (6 critères) | 🏛️ Bureau (réglable) |
| Synthèses / notes de RDV | 🏛️ Bureau (réglable) |

## Remontées & actions
| Fonctionnalité | Visible par |
|---|---|
| Remontée terrain (photo / audio / gravité) | 👤 Associé (crée) |
| Remontées (liste animateur) | 🏛️ Bureau (réglable) |
| Actions réseau (création, suivi) | 🏛️ Bureau (réglable) |
| Actions concernant l'associé | 👤 Associé (les siennes) |
| Notes vocales de l'animateur | 🏛️ Bureau (réglable) |

## Magasins
| Fonctionnalité | Visible par |
|---|---|
| Liste des magasins (filtre statut) | 🏛️ Bureau (réglable) |
| Fiche magasin (détail + historique) | 🏛️ Bureau (réglable) |

## News & communication
| Fonctionnalité | Visible par |
|---|---|
| Actualités du réseau (lecture, page /news + fiche associé) | 👤 Associé |
| Gestion des news (CRUD) | 🏛️ Bureau (réglable) |
| Notifications email (Resend) | 🧭 Animateur seul |
| Contact 1-clic (WhatsApp / mail / appel) | 👤 Associé |

## Assistant vocal
| Fonctionnalité | Visible par |
|---|---|
| Assistant vocal agentique (navigation, création, consultation) | 🧭 Animateur seul |

## Administration
| Fonctionnalité | Visible par |
|---|---|
| Comptes des associés (créer/modifier/supprimer login+MDP) | 🧭 Animateur seul |
| Visibilité (réglage qui-voit-quoi Bureau/Associé) | 🧭 Animateur seul |
| Paramètres (email, agenda Google, véhicule électrique, départ) | 🧭 Animateur seul |
| Disponibilités (jours bloqués) | 🧭 Animateur seul |
| Page Fonctionnalités (catalogue) | 🧭 Animateur seul |

---

## Fiche associé — Sections paramétrables
| Section | Clé | Par défaut |
|---|---|---|
| Actualités du réseau | `asso_news` | ✅ visible (réglable) |
| Vos indicateurs (confiance / business / satisfaction) | `asso_indicateurs` | ✅ visible (réglable) |
| Votre activité (historique 12 mois) | `asso_activite` | ✅ visible (réglable) |
| Chiffre d'affaires (CA & BFA) | `asso_ca` | ✅ visible (réglable) |
| Météo locale (dans le hero) | `asso_meteo` | ✅ visible (réglable) |
| Évolution Confiance (graphe sparkline) | `asso_sparkline` | ✅ visible (réglable) |
| Demandes de l'animateur (à accepter) | `asso_demandes` | ✅ visible (réglable) |
| Hero (nom, ville, score confiance) | — | Toujours visible |
| Actions rapides (RDV, remontée, éval) | — | Toujours visible |

---

## Bureau — Pages paramétrables
| Page | Clé | Par défaut |
|---|---|---|
| Pilotage réseau | `bureau_pilotage` | ✅ activé |
| Santé réseau 360 | `bureau_sante` | ✅ activé |
| Classement CA Leaders | `bureau_classement` | ✅ activé |
| Rapport d'activité | `bureau_rapport` | ✅ activé |
| Notes vocales | `bureau_notes` | ✅ activé |
| Accueil animateur (dashboard) | `bureau_accueil` | ❌ désactivé |
| Carte du réseau | `bureau_carte` | ❌ désactivé |
| RDV | `bureau_rdv` | ❌ désactivé |
| Tournée du jour / vue semaine | `bureau_tournee` | ❌ désactivé |
| Tournée suggérée | `bureau_suggestion` | ❌ désactivé |
| Parcours / itinéraire | `bureau_parcours` | ❌ désactivé |
| Visites | `bureau_visites` | ❌ désactivé |
| Actions réseau | `bureau_actions` | ❌ désactivé |
| Remontées terrain | `bureau_remontees` | ❌ désactivé |
| Évaluations | `bureau_evaluations` | ❌ désactivé |
| Magasins (liste + fiche) | `bureau_magasins` | ❌ désactivé |
| News (gestion) | `bureau_news` | ❌ désactivé |

---

_Dernière mise à jour : 2026-06-24 — maintenue à chaque nouvelle fonctionnalité._
