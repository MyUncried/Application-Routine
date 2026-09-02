# KODJO — preuve de continuité Claude Local — RESUME-03

Date : 2026-09-02

Test : `KODJO-CLAUDE-LOCAL-SESSION-RESUME-03`

Verdict : **DÉMONTRÉE**

## Objet

Démontrer qu’une session Claude Code locale créée dans un GitHub Actions workflow run peut être reprise explicitement dans un second workflow run distinct sur le même runner Windows self-hosted, sans réinjection du contenu mémorisé.

## Configuration démontrée

- machine : `RMAN`
- runner : `KODJO-LOCAL-RUNNER`
- runner GitHub Actions : `2.336.0`
- labels : `self-hosted`, `Windows`, `X64`, `kodjo-claude-local`
- utilisateur Windows : `hadjo`
- profil : `C:\Users\hadjo`
- Claude Code : `2.1.257`
- exécutable : `C:\Users\hadjo\AppData\Roaming\npm\claude.cmd`
- `CLAUDE_CONFIG_DIR=C:\kodjo-local-test\claude-config`
- `CLAUDE_CODE_PROJECT_DIR_NAME=kodjo-local-session-resume-03`
- authentification : `claude.ai` / `firstParty` / `pro`

## BASE — appel 1/2

- run : `33607498284`
- conclusion : `success`
- session retournée : `e5a9723c-007a-4524-accc-17a1f7c24246`
- marqueur : aléatoire, conservé uniquement dans le prompt/transcript local ; valeur non persistée dans GitHub
- SHA-256 du marqueur : `37b486f6c160aba6651ce1066ec53e8f51bcb3c7b9faaf534cdc0903612a6fc0`
- durée Claude déclarée : `3416 ms`
- tours : `1`
- coût Claude déclaré : `$0.029834199999999998`
- preuve `BASE.result.json` publiée

## RESUME — appel 2/2

- run : `33607899039`
- conclusion : `success`
- run distinct de BASE : oui
- transcript natif de BASE retrouvé avant appel : oui, exactement un
- session demandée avec `--resume` : `e5a9723c-007a-4524-accc-17a1f7c24246`
- session retournée : `e5a9723c-007a-4524-accc-17a1f7c24246`
- `session_id_match=true`
- hash du marqueur restitué : `37b486f6c160aba6651ce1066ec53e8f51bcb3c7b9faaf534cdc0903612a6fc0`
- `marker_match=true`
- `fork_session=false`
- fallback : `NONE`
- durée Claude déclarée : `4857 ms`
- tours : `1`
- coût Claude déclaré : `$0.0150588`
- preuves `RESUME.result.json` et `VERDICT.json` publiées

## Anti-réinjection

Le prompt RESUME demandait uniquement la restitution du marqueur donné à l’étape précédente. La valeur du marqueur n’était pas présente dans le prompt RESUME. GitHub ne persistait que son SHA-256 pour comparaison après restitution.

La continuité comportementale et l’identité technique de session sont donc établies conjointement.

## Verdict

Les conditions de démonstration sont satisfaites :

- processus/workflow BASE terminé ;
- second workflow run distinct ;
- même environnement local pertinent ;
- transcript natif disponible ;
- reprise explicite du session ID BASE ;
- même session ID retourné ;
- marqueur restitué correctement sans réinjection ;
- aucun fork ;
- aucun fallback.

Verdict durable : `DEMONSTRATED` / **DÉMONTRÉE**.

Compteur définitif : **2/2 appels Claude**.

Coût Claude déclaré total du test : **$0.044892999999999995** (BASE + RESUME). Les éventuels coûts OpenAI/Work ne sont pas mesurés par ce test et restent `NON_VÉRIFIABLE`.

Cette preuve vaut pour la configuration testée. Elle ne prouve pas qu’une session survivrait à la suppression du transcript local, au changement de machine/compte/configuration, ni qu’elle constitue une source de vérité métier.
