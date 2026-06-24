# Fonctionnalités du CRM — Qui voit quoi

> Référence pour paramétrer la visibilité de chaque fonctionnalité par rôle.
> Mise à jour à **chaque nouvelle fonctionnalité**.

## Rôles
- 🧭 **Animateur** — accès total par défaut (voit tout, peut tout faire).
- 👤 **Associé** (rôle interne `membre`) — son espace, ses données.
- 🏛️ **Bureau** — **lecture seule** d'un périmètre de pilotage.
- 🌍 **Tous** — public (avant connexion) ou visible par tous les rôles.

La colonne **Visible par** liste qui voit la fonctionnalité **en plus de l'animateur** (qui a tout). « Animateur seul » = réservé à l'animateur.

---

## Accès & authentification
| Fonctionnalité | Visible par |
|---|---|
| Page de connexion (login unifié : identifiant + MDP) | 🌍 Tous |
| Mot de passe oublié → mail à l'animateur (+ 06 rappel) | 🌍 Tous |
| Espace Associé (sa fiche magasin) | 👤 Associé |
| Espace Bureau (`/bureau`, lecture seule) | 🏛️ Bureau |
| Espace Animateur (dashboard) | 🧭 Animateur seul |
| Installation PWA (iOS/Android) | 🌍 Tous |

## Pilotage & analyse réseau
| Fonctionnalité | Visible par |
|---|---|
| Pilotage réseau (cockpit, KPIs, magasins à risque, top/flop) | 🏛️ Bureau |
| Santé réseau 360 (scorecard des 40 magasins) | 🏛️ Bureau |
| Rapport d'activité (hebdo/mensuel, imprimable) | 🏛️ Bureau |
| Carte du réseau (risque par magasin) | Animateur seul |
| Magasins prioritaires à revisiter | Animateur seul |

## CA / BFA
| Fonctionnalité | Visible par |
|---|---|
| Classement CA Leaders (page réseau, 40 associés) | 🏛️ Bureau |
| Carte « CA & BFA » sur la fiche magasin | 👤 Associé (sa fiche) |
| Classement CA Leaders de l'associé (#N/40) sur sa fiche | 👤 Associé (le sien) |
| Évolution CA mensuelle (graphe, sa fiche) | 👤 Associé (sa fiche) |
| CA global / Leaders agrégés réseau | 🏛️ Bureau |

## Tournées
| Fonctionnalité | Visible par |
|---|---|
| Tournée suggérée (priorités + regroupement géo) | Animateur seul |
| Parcours / itinéraire optimisé (+ arrêts recharge VE) | Animateur seul |
| Tournée du jour / vue semaine | Animateur seul |
| Préparation J+1 (heure de départ, charge batterie) | Animateur seul |

## RDV & visites
| Fonctionnalité | Visible par |
|---|---|
| Demande de RDV (physique / tél / visio) | 👤 Associé (demande) |
| Agenda unifié (RDV + visites + Google Calendar) | Animateur seul |
| Visites planifiées & compte-rendu | Animateur seul |
| Historique des visites de l'associé | 👤 Associé (le sien) |
| Évaluation de l'accompagnement (6 critères) | 👤 Associé (remplit) |
| Synthèses / notes de RDV | 🏛️ Bureau |

## Remontées & actions
| Fonctionnalité | Visible par |
|---|---|
| Remontée terrain (photo / audio / gravité) | 👤 Associé (crée) |
| Traitement des remontées | Animateur seul |
| Actions réseau (création, suivi) | Animateur seul |
| Actions concernant l'associé | 👤 Associé (les siennes) |
| Notes vocales de l'animateur | 🏛️ Bureau |

## News & communication
| Fonctionnalité | Visible par |
|---|---|
| Actualités du réseau (lecture, page /news + fiche associé) | 👤 Associé |
| Gestion des news (CRUD) | Animateur seul |
| Notifications email (Resend) | Animateur seul |
| Contact 1-clic (WhatsApp / mail / appel) | 👤 Associé |

## Assistant vocal
| Fonctionnalité | Visible par |
|---|---|
| Assistant vocal agentique (navigation, création, consultation) | Animateur seul |

## Administration
| Fonctionnalité | Visible par |
|---|---|
| Comptes des associés (créer/modifier/supprimer login+MDP) | Animateur seul |
| Paramètres (email, agenda Google, véhicule électrique, départ) | Animateur seul |
| Page Fonctionnalités (catalogue) | Animateur seul |

---

## Indicateurs (fiche associé)
| Fonctionnalité | Visible par |
|---|---|
| Vos indicateurs (confiance / business / satisfaction) | 👤 Associé (les siens) |
| Votre activité (historique 12 mois) | 👤 Associé (la sienne) |
| Demandes de l'animateur (à accepter) | 👤 Associé |
| Météo locale | 👤 Associé |

---

_Dernière mise à jour : 2026-06-24 — maintenue à chaque nouvelle fonctionnalité._
