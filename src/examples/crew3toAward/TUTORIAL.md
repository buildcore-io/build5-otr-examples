# Overview

Below is an example on how to set-up crew3 integration with Soonaverse awards.

1. Create a new mnemonic for your API
2. Make the API guardian on the space
3. Create award within the Soonaverse that's linked to quest in crew3
4. Use script to query crew3 and issue new badge's when quest completed


## 1. Create a new mnemonic for your API

- call "ts-node src/examples/randomMnemonicSeed.ts" // Generates random 24 words mnemonic seed
- set the mnemonic within the config.json
- run "ts-node src/examples/getMyReceiveAddress.ts" // to see my receive address
- fund your address with SMR necessary to make transfers on SMR. You'll always need some SMR to send requests. THOSE SMRs will be refunded back to you.

## 2. Make the API guardian on the space

- call "ts-node src/examples/space/join/exec-join.ts <space uid>" to request join the space as new member.
- go into the space as the other guardian and accept the member. Make the member guardian (this gives the member ability to issue badges).

## 3. Create award within the Soonaverse that's linked to quest in crew3

- as existing guardian of the space, create an award and fund it. Make sure to set enough available badges you might need for quests in crew3.
- edit src/examples/crew3toAward/config.json and set awardUid
- edit src/examples/crew3toAward/config.json and set questId
- edit src/examples/crew3toAward/config.json and set Crew3 API ID
- edit src/examples/crew3toAward/config.json and set crew3CommunityName (i.e. auditone)

## 4. Use script to query crew3 and issue new badge's when quest completed

- run "ts-node src/examples/crew3toAward/run.ts" to listen to quest and run the sync
