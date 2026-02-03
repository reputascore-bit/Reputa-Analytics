# Reputa — Unified Reputation Protocol v3.0

Cette spécification décrit la version 3.0 du protocole Reputa pour Pi Network.

Voir le fichier de spécification dans le README du projet pour les détails complets : niveaux, formules, schéma BD, jobs et règles anti-abus.

Résumé rapide :
- 20 niveaux (0 → 100000 points)
- Wallet (Mainnet 60% + Testnet 20%) = 80% du score
- App engagement = 20% du score
- Mises à jour toutes les 15 minutes; fusion hebdomadaire des points applicatifs
- Logs immuables pour chaque crédit en `Points_Log`

Pour implémentation technique, voir `server/reputa/protocol.ts` et `server/reputa/cron.ts`.
