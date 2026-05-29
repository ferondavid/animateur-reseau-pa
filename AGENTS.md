<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Règle générale de workflow

Ne JAMAIS tester en local. Ne JAMAIS lancer `npm run dev`, `npm run build`, ou ouvrir localhost. Ne JAMAIS proposer "teste sur http://localhost...".

À chaque modification :
1. Commit avec un message court et descriptif en français
2. Push immédiatement sur main (auto-deploy Vercel)
3. Attendre 30 à 60 secondes que Vercel build
4. Vérifier le statut du dernier déploiement via `vercel ls` ou `vercel inspect`
5. Donner à l'utilisateur l'URL de prod à tester : https://animateur-reseau-pa.vercel.app/<chemin pertinent>
6. Si possible, faire un `curl -I` sur l'URL pour vérifier qu'elle répond en 200

Pour les pages spécifiques après modif :
- Fiche membre → https://animateur-reseau-pa.vercel.app/membre/<id-d-exemple>
- Dashboard animateur → https://animateur-reseau-pa.vercel.app/animateur
- Pilotage → https://animateur-reseau-pa.vercel.app/pilotage
- Landing → https://animateur-reseau-pa.vercel.app/

Si le build Vercel échoue, lire les logs avec `vercel logs <url-de-build>` et corriger sans rien tester en local — relire le code, raisonner, fixer, repush.
