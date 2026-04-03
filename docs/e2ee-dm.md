# Documentation E2EE DM

## Objectif

Cette documentation explique comment fonctionne le chiffrement de bout en bout des messages privés (DM) dans FerrisCord.

Elle est pensée pour des développeurs juniors.

Le but est de répondre simplement à ces questions :

- quand un message est chiffré
- où les clés sont stockées
- pourquoi un utilisateur peut être en état `locked`
- pourquoi l'historique pose des contraintes particulières
- quelles sont les limites actuelles de l'implémentation

## Définition simple

E2EE veut dire `End-to-End Encryption`, donc chiffrement de bout en bout.

En pratique :

- le message est chiffré dans le navigateur avant d'être envoyé à l'API
- l'API stocke une version chiffrée du message
- seul le navigateur du destinataire peut le déchiffrer

Le serveur transporte et stocke les données, mais ne connaît pas le contenu en clair.

## Périmètre actuel

Aujourd'hui, cette implémentation concerne les `DM` uniquement.

Ce n'est pas encore le mécanisme utilisé pour :

- les salons de guilde
- les pièces jointes chiffrées de bout en bout
- un historique E2EE complet rejouable depuis zéro

## Vue d'ensemble

Le système repose sur 4 briques principales :

1. `Identity keys`
   Clés longues durées liées à l'utilisateur.

2. `Pre-keys`
   Clés publiées côté serveur pour permettre à un autre utilisateur d'initialiser une session chiffrée.

3. `Double Ratchet`
   Mécanisme qui fait évoluer les clés à chaque message.

4. `Key backup`
   Sauvegarde chiffrée des clés privées pour restaurer un appareil ou un navigateur.

## Fichiers importants

### Frontend

- [crypto-sync.tsx](/opt/ferrislabs/ferriscord/webapp/src/components/auth/crypto-sync.tsx)
- [dm-queries.ts](/opt/ferrislabs/ferriscord/webapp/src/lib/queries/dm-queries.ts)
- [message-crypto.ts](/opt/ferrislabs/ferriscord/webapp/src/lib/crypto/message-crypto.ts)
- [double-ratchet.ts](/opt/ferrislabs/ferriscord/webapp/src/lib/crypto/double-ratchet.ts)
- [x3dh.ts](/opt/ferrislabs/ferriscord/webapp/src/lib/crypto/x3dh.ts)
- [device-manager.ts](/opt/ferrislabs/ferriscord/webapp/src/lib/crypto/device-manager.ts)
- [key-store.ts](/opt/ferrislabs/ferriscord/webapp/src/lib/crypto/key-store.ts)
- [crypto.store.ts](/opt/ferrislabs/ferriscord/webapp/src/stores/crypto.store.ts)

### Backend

- [identity.rs](/opt/ferrislabs/ferriscord/api/src/handlers/crypto/identity.rs)
- [prekeys.rs](/opt/ferrislabs/ferriscord/api/src/handlers/crypto/prekeys.rs)
- [backup.rs](/opt/ferrislabs/ferriscord/api/src/handlers/crypto/backup.rs)
- [bundle.rs](/opt/ferrislabs/ferriscord/api/src/handlers/crypto/bundle.rs)
- [send_message.rs](/opt/ferrislabs/ferriscord/api/src/handlers/dm/send_message.rs)
- [postgres.rs](/opt/ferrislabs/ferriscord/libs/core/src/user/infrastructure/dm/postgres.rs)
- [postgres.rs](/opt/ferrislabs/ferriscord/libs/core/src/crypto/infrastructure/postgres.rs)

## Cycle de vie d'un utilisateur

### 1. Premier démarrage

Quand un utilisateur se connecte pour la première fois :

- le frontend vérifie si des clés locales existent
- si ce n'est pas le cas, il génère :
  - une paire de clés d'identité
  - une clé de device
  - une signed pre-key
  - plusieurs one-time pre-keys
- les clés publiques nécessaires sont envoyées au serveur
- les clés privées restent côté client
- une sauvegarde chiffrée des clés est envoyée au serveur

Le pilotage de ce flux est fait dans [crypto-sync.tsx](/opt/ferrislabs/ferriscord/webapp/src/components/auth/crypto-sync.tsx) et [device-manager.ts](/opt/ferrislabs/ferriscord/webapp/src/lib/crypto/device-manager.ts).

### 2. Retour sur le même navigateur

Si les clés sont encore présentes dans IndexedDB :

- l'utilisateur passe en état `setup`
- le chiffrement et le déchiffrement sont actifs

### 3. Nouveau navigateur ou stockage local perdu

Si les clés locales n'existent plus mais qu'un backup existe côté serveur :

- l'utilisateur passe en état `locked`
- il ne peut pas chiffrer de nouveaux DM
- il ne peut pas déchiffrer les DM chiffrés reçus

Dans cet état, il faut restaurer les clés depuis le backup.

## Signification des états crypto

Le store frontend utilise plusieurs états.

### `unknown`

L'application n'a pas encore vérifié si les clés existent.

### `not_setup`

L'utilisateur n'a ni clés locales ni backup serveur.

Dans ce cas, l'application initialise le système E2EE.

### `setup`

Les clés locales sont disponibles.

Dans cet état :

- les messages DM peuvent être chiffrés
- les messages DM chiffrés peuvent être déchiffrés

### `locked`

Un backup existe côté serveur, mais les clés locales ne sont pas disponibles.

Dans cet état :

- les nouveaux messages DM ne sont pas chiffrés par le frontend
- les messages DM déjà chiffrés ne peuvent pas être lus

## Envoi d'un message DM

Le flux principal est dans [dm-queries.ts](/opt/ferrislabs/ferriscord/webapp/src/lib/queries/dm-queries.ts).

Quand l'utilisateur envoie un DM :

1. le frontend vérifie que l'état crypto est `setup`
2. il récupère l'identifiant du destinataire
3. il chiffre le message avec `encryptDmMessage(...)`
4. il envoie à l'API :
   - le contenu chiffré
   - `encrypted = true`
   - `encryption_version`
5. l'API stocke la valeur chiffrée telle quelle

Important :

- le serveur ne chiffre pas le message
- le serveur ne déchiffre pas le message
- il stocke seulement ce qu'il reçoit

## Réception d'un message DM

Quand un utilisateur charge ses messages DM :

1. le frontend appelle l'API pour récupérer les messages
2. pour chaque message marqué comme chiffré :
   - si le plaintext est déjà en cache local, il est utilisé
   - sinon le frontend tente un déchiffrement local

Le déchiffrement se fait dans [message-crypto.ts](/opt/ferrislabs/ferriscord/webapp/src/lib/crypto/message-crypto.ts).

## Pourquoi le backend voit quand même `encrypted = true`

Le backend stocke plusieurs informations dans la table `messages` :

- `content`
- `encrypted`
- `encryption_version`

Exemple :

- `content` contient un blob base64
- `encrypted = true` indique au frontend que ce contenu n'est pas du texte normal
- `encryption_version` permet de savoir quelle logique utiliser

Le backend n'interprète pas le contenu chiffré. Il se contente de le conserver.

## X3DH et Double Ratchet

### X3DH

X3DH sert à créer une première base secrète entre deux utilisateurs.

On peut voir ça comme :

- une phase d'initialisation
- avant que les vrais échanges de messages ne commencent

Dans le code, cette logique est dans [x3dh.ts](/opt/ferrislabs/ferriscord/webapp/src/lib/crypto/x3dh.ts).

### Double Ratchet

Le Double Ratchet sert à faire évoluer les clés à chaque message.

C'est important pour la sécurité, car :

- chaque message utilise une clé différente
- compromettre une clé ne donne pas accès à toute la conversation

Dans le code, cette logique est dans [double-ratchet.ts](/opt/ferrislabs/ferriscord/webapp/src/lib/crypto/double-ratchet.ts).

## Point important pour les juniors

Le Double Ratchet n'est pas un simple chiffrement "statique".

Ce n'est pas :

- "je prends toujours la même clé"
- "je peux relire n'importe quel ancien message avec n'importe quel état"

Au contraire :

- l'état avance après chaque message
- les clés changent
- l'ordre des messages compte

C'est la raison pour laquelle l'historique E2EE est plus difficile qu'un simple `encrypt()` et `decrypt()`.

## Pourquoi on a eu des problèmes après refresh

Deux cas ont été rencontrés pendant le développement.

### 1. Message envoyé par soi-même

Un utilisateur ne peut pas simplement "redéchiffrer" ses propres messages envoyés avec le même mécanisme.

Pourquoi :

- le ratchet a déjà avancé
- le plaintext d'origine n'est plus récupérable directement avec l'état courant

Solution mise en place :

- on met en cache local le plaintext des messages envoyés
- on le persiste dans IndexedDB

### 2. Message reçu d'un autre utilisateur

Même problème sur l'historique :

- un message reçu peut être lisible en live
- mais échouer après refresh si on tente de le redéchiffrer avec un état déjà avancé

Erreur typique :

```text
aes/gcm: invalid ghash tag
```

Cette erreur signifie en général :

- mauvaise clé
- mauvais état de ratchet
- ou tentative de déchiffrement avec un état qui ne correspond plus à ce message

Solution pragmatique actuelle :

- lorsqu'un message est déchiffré avec succès, son plaintext est mis en cache local
- après refresh, le frontend consulte d'abord ce cache

## Où le cache local est stocké

Le stockage local passe par IndexedDB, dans [key-store.ts](/opt/ferrislabs/ferriscord/webapp/src/lib/crypto/key-store.ts).

On y stocke notamment :

- les clés d'identité
- les clés de device
- les pre-keys
- l'état des sessions DM
- les recovery codes
- un cache de plaintext des messages déjà vus

Important :

- ce cache est local au navigateur
- si l'utilisateur change de navigateur, ce cache n'est pas automatiquement transféré

## Rôle du backup

Le backup sert à restaurer les clés privées quand le stockage local est perdu.

Sans backup exploitable :

- le serveur possède les messages chiffrés
- mais le navigateur n'a plus les bonnes clés privées
- donc le contenu ne peut plus être lu

## Limites actuelles

L'implémentation actuelle fonctionne, mais elle a des limites importantes.

### 1. Historique dépendant du cache local

Aujourd'hui, une partie de la lisibilité après refresh repose sur un cache local de plaintext.

Cela veut dire :

- si un message n'a jamais été vu ou déchiffré sur ce navigateur, il peut rester illisible
- si le cache local est perdu, certains anciens messages peuvent ne plus être relisibles

### 2. Pas encore de replay complet de l'historique

Le système ne reconstruit pas encore toute une conversation chiffrée depuis le début avec une stratégie robuste de replay.

### 3. Gestion des appareils encore simplifiée

Le support multi-device et la restauration restent encore basiques.

## Ce qu'il faut retenir

Si tu es junior, retiens surtout ceci :

1. le frontend chiffre et déchiffre
2. le backend stocke et distribue les clés publiques et backups
3. `setup` veut dire "les clés locales sont prêtes"
4. `locked` veut dire "backup trouvé, mais pas de clés locales utilisables"
5. le Double Ratchet rend l'historique plus compliqué qu'un chiffrement classique
6. un cache local de plaintext a été ajouté pour rendre le comportement plus stable après refresh

## Conseils pour faire évoluer le système

Si vous voulez améliorer cette feature plus tard, les bonnes pistes sont :

1. mieux gérer le replay de l'historique
2. mieux gérer le multi-device
3. ajouter une vraie UI de restauration de backup
4. ajouter des tests end-to-end sur :
   - envoi
   - réception
   - refresh
   - nouveau navigateur
   - utilisateur `locked`

## Résumé en une phrase

Le système E2EE DM de FerrisCord fonctionne déjà pour chiffrer les messages privés côté client, mais l'historique repose encore sur une approche pragmatique avec cache local, ce qui explique certaines limites après refresh ou changement de navigateur.
