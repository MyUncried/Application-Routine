#!/usr/bin/env python3
"""Build the PRE-3 corrected review dossier; no app changes or VNext admission."""
import json, pathlib, hashlib, subprocess, re, gzip, base64
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
BASE = '1ddfb6d144552f578388257adc78db47ab5992c8'
OUT = HERE / 'passe2'
OUT.mkdir(exist_ok=True)
def read(name): return json.loads((HERE / name).read_text())
def sha(data): return hashlib.sha256(data).hexdigest()
def write(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
def git(*args): return subprocess.check_output(['git', *args], cwd=ROOT)
trace = read('tracabilite-travail.json')['requirements']
assertions = read('assertions-recette.json')['assertions']
states = read('inventaire-etats-scenarios.json')['states']
files = read('fichiers-cible-proposes.json')
findings = read('registre-corrections-revue-initiale.json')['findings']
scan = read('direct-import-scan.json')
candidate = {r['candidate_id']:r for r in read('candidate-manifest.json')['candidates']}
index = json.loads((OUT / 'original-plan-index.json').read_text())
oldreq = {r['statement']:r for r in index['documentary_requirements']}
oldstate = {re.search(r'Documentary state ([^;]+)',r['rationale'])[1]:r for r in index['documentary_requirements']}
mapping = [json.loads(s) for s in (HERE/'mapping-elements-ui.jsonl').read_text().splitlines()]
frames = mapping[0]['frames']
surface = {f['frameId']:f['targetSurfacePath'].replace('/sessions/ExecutionParametersSheet', '/activities/ExecutionParametersSheet') for f in frames}
figscope = {
 '3542:4656':['P3-02'], '3943:6064':['P3-02','P3-16','P3-23'], '4217:6980':['P3-02','P3-16','P3-23'],
 '5088:6398':['P3-03','P3-17'], '4734:6342':['P3-01','P3-17','P3-23'], '4332:7095':['P3-03','P3-16'],
 '4474:7157':['P3-03'], '4478:7209':['P3-03','P3-16'], '4683:6336':['P3-03'], '4714:6241':['P3-16'],
 '4861:6259':['P3-03','P3-22'], '4861:6348':['P3-03','P3-22'], '6407:9458':['P3-02','P3-16'],
 '6407:9551':['P3-04','P3-16'], '6407:9702':['P3-15','P3-16'], '6407:9805':['P3-04','P3-11'],
 '6407:9966':['P3-06','P3-19'], '6407:10127':['P3-19'], '6407:10481':['P3-09','P3-19'],
 '6411:9546':['P3-14','P3-12'], '6411:9649':['P3-09','P3-12'], '6419:9847':['P3-04','P3-11','P3-12'],
 '6419:10028':['P3-04','P3-11','P3-12'], '6423:9953':['P3-14','P3-12'],
 '6665:24616':['P3-05','P3-12','P3-15'], '6665:24844':['P3-05','P3-12','P3-13'],
 '6665:25072':['P3-05','P3-11','P3-12'], '6665:25277':['P3-06','P3-15','P3-19'],
 '6665:26185':['P3-09'], '6665:26575':['P3-09','P3-12'], '6665:26822':['P3-08','P3-12'],
 '6665:27008':['P3-04','P3-16'], '6665:27232':['P3-16'], '6665:27458':['P3-16','P3-19'],
 '6665:27608':['P3-07','P3-13','P3-16'], '6665:27862':['P3-09','P3-15','P3-16'],
 '6665:28050':['P3-12','P3-15'], '7059:13302':['P3-11','P3-12'],
 '7069:13464':['P3-09'], '7069:13573':['P3-04','P3-11','P3-12'], '7119:27855':['P3-15','P3-21']}
def clear(text):
    # Editorial separators only, using the normative meaning of the N=1 examples.
    for a,b in [('N1235','N=1 : 235 s'),('N1220','N=1 : 220 s'),('N1..99','N=1..99'),
                ('A195','A : 195 s'),('C405','C : 405 s'),('D375','D : 375 s'),('A285','A : 285 s'),
                ('Durée variable30/45/60','Durée variable 30/45/60 s'),('pauses10/20/30','pauses 10/20/30 s'),
                ('exact195s','exact : 195 s'),('Durées30/45/60','Durées 30/45/60 s'),
                ('cibles1..100','cibles 1..100'),('bip0..10','bip 0..10 s'),('variables12/10/8','variables 12/10/8'),
                ('pauses30/45/60','pauses 30/45/60 s'),('contribuent135s','contribuent 135 s'),
                ('PC15','PC = 15 s'),('donnent375s','donnent 375 s'),('donne220s','donne 220 s'),
                ('de15 répétitions','de 15 répétitions'),('bip4','bip 4 s'),('pause15','pause 15 s'),
                ('donnent≈300s','donnent ≈ 300 s'),('longue224','longue : 224'),
                ('intrinsic195','intrinsic = 195 s'),('occurrence195','occurrence = 195 s'),('pause20','pause 20 s'),
                ('occurrence285','occurrence = 285 s'),('intrinsic220','intrinsic = 220 s'),
                ('committed1','committed N=1'),('cadence≈300','cadence ≈ 300 s'),('cadence300','cadence : 300 s'),
                ('historical2s','historical 2 s'),('known135','known = 135 s'),('R0','R = 0 s'),('R30','R = 30 s'),
                ('R120','R = 120 s'),('unilateral225','unilateral = 225 s'),('BY_SIDE345','BY_SIDE = 345 s'),
                ('BY_SERIES240','BY_SERIES = 240 s'),('gives80','gives 80 s'),('gives120','gives 120 s'),
                ('adjustment120','adjustment = 120 s'),('request80','request = 80 s'),('choosesN2','chooses N=2'),
                ('choose N3','choose N=3'),('N2 gives','N=2 gives'),('N3 gives','N=3 gives'),('no0/100','no N=0/100'),
                ('all276','all 276'),('P0','P = 0 s'),('P15','P = 15 s'),('includes45','includes 45 s'),
                ('Série2','Série 2'),('Tap1','Tap : 1'),('before500ms','before 500 ms'),('repeat150ms','repeat 150 ms'),
                ('step1/5/10','step 1/5/10'),('step1','step 1'),('009','009')]:
        text=text.replace(a,b)
    return text
for a in assertions:
    for field in ['given','when','expected']:a[field]=clear(a[field])

DOMAIN='src/domain/activities/__tests__/'
SHEET='src/features/activities/__tests__/ExecutionParametersSheet.test.tsx'
EDITOR='src/features/activities/__tests__/ActivityEditorForm.test.tsx'
REPO='src/infrastructure/database/__tests__/'
def owners(scope, aid=''):
    # REG-01: scope is an index, never the ownership of an individual assertion.
    selected=[a for a in assertions if a['assertionId']==aid] if aid else [a for a in assertions if a['scopeId']==scope]
    if aid and (len(selected)!=1 or selected[0]['scopeId']!=scope):
        raise ValueError('Unknown assertion or scope mismatch: '+aid)
    return sorted(set(p for a in selected for p in a['proposedTestPaths']))

rules=[]
for s in states:
    old=oldstate[s['state_id']];fid=s['state_id'].removeprefix('PRE3-FIG-').replace('-',':') if s['origin']=='FIGMA' else None
    scopes=figscope[fid] if fid else [re.search(r'P3-\d\d',s['state_id'])[0]]
    primary='UI' if 'P3-20-' in s['state_id'] else 'PRESERVATION' if any(k in s['state_id'] for k in ['historical-immutability','scope-regression','reference-retired','file-preservation','no-storage']) else 'DATA' if any(k in s['state_id'] for k in ['equal-variable','copy-complete','persistence-reopening']) else 'FUNCTIONAL'
    # Documentary state IDs preserve the exact assertion suffix, including hyphens.
    direct_id=re.sub(r'^(P3-\d\d)-', r'\1/', s['state_id'].removeprefix('PRE3-DOC-')) if not fid else None
    refs=[direct_id] if direct_id in {a['assertionId'] for a in assertions} else [a['assertionId'] for a in assertions if a['scopeId'] in scopes]
    rules.append({'requirement_id':old['requirement_id'],'state_id':s['state_id'],'kind':primary,'preservation':'REQUIRED' if primary=='PRESERVATION' else 'NONE_DECLARED',
      'scope_ids':scopes,'source':old['source'],'expected':clear(s['expected']),
      'functional_test_paths':sorted(set(p for a in assertions if a['assertionId'] in refs for p in a['proposedTestPaths'])),
      'assertion_refs':refs,
      'figma_frame':fid,'presentation_scope':'P3-20' if fid else None,'status':'CORRECTED_PENDING_INDEPENDENT_REVIEW'})

migrations=[('fresh-v9','Base vide : migrations 001..009 appliquées ; version 9, tables et contraintes disponibles.'),
 ('populated-v8-v9','Base v8 peuplée : IDs, liens, dates et valeurs scalaires conservés ; nouveaux paramètres versionnés disponibles sans backfill du Profil.'),
 ('idempotent','Deuxième appel de migration : version et données identiques, aucune association dupliquée.'),
 ('foreign-key-position','PRAGMA foreign_key_check vide ; insertion de lien orphelin ou position dupliquée échoue ; rollback intégral.'),
 ('malformed-unknown-json','JSON corrompu/version inconnue : erreur typée, aucune coercition silencieuse ni écriture destructive ; brouillon conservé.'),
 ('scalar-projection','JSON canonique et projections scalaires concordants ; aucun writer indépendant concurrent ; relecture Catalogue et Séance identique.'),
 ('legacy-out-of-bounds','Anciennes valeurs hors bornes nouvelles conservées à la lecture ; aucun clamp implicite ; nouvelle modification validée explicitement.'),
 ('per-statement-rollback','Échec injecté à chaque instruction asset/définition/occurrence/lien : toutes les données initiales inchangées, prêt média conservé pour réessai.')]
tests=[]
for a in assertions:
    for p in owners(a['scopeId'],a['assertionId']):
        # UI suites assert UI observations; business amounts are owned by the pure domain.
        ui=p.endswith('.test.tsx')
        expected=('Rendu/actions de cette surface uniquement ; délégation vérifiée au Domaine/Repository, aucune preuve numérique ou SQL par mock UI. Attendu affiché : '+a['expected']) if ui else a['expected']
        if p.endswith('/tokensSpecification.test.ts'):
            expected='Valeurs des rôles de tokens PRE-3 effectivement consommés : voile #1F2129 alpha 0.34, couleurs/styles liés aux sources ; conservation des tokens existants. Aucune géométrie de feuille ou position de champ assertée ici.'
        if p.endswith('/i18n/index.test.ts'):
            expected='Présence et exactitude des libellés français PRE-3 utilisés par les surfaces (modes, Série incomplète, durée ajustée, Importation, Réessayer, Retirer, Monter, Descendre) ; aucune géométrie ou formule métier assertée ici.'
        if 'zones-presentation' in a['assertionId'] and 'CategoryPickerModal' in p:continue
        obligation={'test_id':a['assertionId']+'@'+p,'scope_id':a['scopeId'],'path':p,'given':a['given'],'when':a['when'],'expected':expected,'assertion_ref':a['assertionId'],'owner_source':'requirements.json#/assertions/proposedTestPaths','status':'PLANNED_NOT_EXECUTED'}
        if p.startswith(REPO):
            obligation.update(database='NodeSqliteDatabase REAL',owned_boundary='Persistance/migration : contrôler les lignes/JSON/liens réellement écrits et relus, contraintes et rollback ; aucun mock comme preuve SQLite.')
        elif ui:
            obligation['owned_boundary']='Rendu, actions et délégation observés sur ce composant ; preuve SQL/calcul assurée par les autres propriétaires de cette assertion.'
        else:
            obligation['owned_boundary']='Logique pure, sérialisation ou service de ce fichier ; le rendu natif est prouvé séparément.'
        tests.append(obligation)
for key,expected in migrations:tests.append({'test_id':'P3-17/migration/'+key,'scope_id':'P3-17','kind':'MIGRATION','path':REPO+'migrateDatabase.test.ts','expected':expected,'database':'NodeSqliteDatabase REAL','status':'PLANNED_NOT_EXECUTED'})
for c in read('attendus-numeriques.json')['cases']:tests.append({'test_id':'P3-12/numeric/'+c['id'],'scope_id':'P3-12','path':DOMAIN+'executionCalculations.test.ts','fixture':c,'status':'PLANNED_NOT_EXECUTED'})
for c in read('attendus-phrases-276.json')['cases']:tests.append({'test_id':'P3-15/corpus/'+str(c['corpusId']),'scope_id':'P3-15','path':DOMAIN+'executionPhrase.test.ts','fixture_ref':'../attendus-phrases-276.json#/cases/'+str(c['corpusId']-1),'expected_text':c['expectedText'],'expected_segments':c['expectedSegments'],'expected_intrinsic':c['expectedIntrinsic'],'status':'PLANNED_NOT_EXECUTED'})
inverse=next(a for a in assertions if a['assertionId']=='P3-14/inverse-enumeration')
tests.append({'test_id':'P3-14/inverse-explicit','scope_id':'P3-14','path':DOMAIN+'executionCalculations.test.ts','expected':inverse['expected'],'numeric_oracle':'Durée uniforme unilatérale ; T=30 s, P=10 s, CR=0 s, Fin=0 s, aucune Récupération ; T(N)=N×(30+10) s. Enumérer N=1..99 ; N=2 → 80 s et N=3 → 120 s ; demandé 100 s → N=3/120 s/message ; demandé 80 s → N=2/80 s/sans message. Normaliser N=1 pour chaque candidat.','status':'PLANNED_NOT_EXECUTED'})

for key,p,expected in [
 ('i18n','src/shared/i18n/index.test.ts','Libellés français PRE-3 utilisés par les surfaces, modes et erreurs ; groupes existants conservés, aucun attendu de géométrie ou calcul.'),
 ('tokens','src/shared/ui/__tests__/tokensSpecification.test.ts','Réutiliser les tokens canoniques existants, dont color.overlayScrim ; contrat tokens ↔ chapitre 12 inchangé, aucune nouvelle couleur/typo canonique ni géométrie de feuille dans ce test.')]:
    tests.append({'test_id':'P3-20/contract-'+key,'scope_id':'P3-20','path':p,'expected':expected,'source_ref':'baseline-observations.json#'+p,'status':'PLANNED_NOT_EXECUTED'})

baseline_tests=['src/domain/sessions/__tests__/calculations.test.ts','src/domain/sessions/__tests__/validation.test.ts','src/domain/sessions/__tests__/composition.test.ts','src/features/activities/__tests__/ActivityCard.test.tsx','src/features/sessions/__tests__/SessionCard.test.tsx',REPO+'SqliteMediaRepository.test.ts']
paths={x['path'] for x in files['changes']}|{x['path'] for x in index['files'] if x['change_kind']=='MODIFY'}|{x['path'] for x in scan['importers']}|set(baseline_tests)|{
 'src/features/sessions/DurationWheelPicker.tsx','src/features/sessions/WheelPickerOverlay.tsx','src/shared/ui/ProfileStepper.tsx',
 'src/features/activities/ActivityEditorForm.tsx','src/features/reference-data/CategoryPickerModal.tsx','src/features/reference-data/BodyZonePickerModal.tsx'}
observed=[];content={}
for p in sorted(paths):
    raw=git('show',BASE+':'+p);blob=git('rev-parse',BASE+':'+p).decode().strip();digest=sha(raw)
    observed.append({'path':p,'revision':BASE,'git_blob':blob,'sha256':digest,'bytes':len(raw),'content_key':digest});content[digest]=raw.decode('utf8')
write('baseline-observations.json',observed)
write('creation-observations.json',[{'path':x['path'],'candidate_id':x.get('candidateId'), 'policy':'Declared create slot from original plan; no baseline blob exists, not falsely reported as a read Git file.','intent':x['intent']} for x in files['creations']])
payload=json.dumps(content,ensure_ascii=False,separators=(',',':')).encode();write('baseline-blobs.json',{'encoding':'gzip-base64','uncompressed_bytes':len(payload),'sha256':sha(payload),'payload':base64.b64encode(gzip.compress(payload,mtime=0)).decode()})

write_files={x['path']:{**x,'action':'ADAPT' if '/__tests__/' in x['path'] else 'MODIFY'} for x in files['changes']}
for x in files['creations']:write_files[x['path']]={**x,'action':'CREATE'}
for p in sorted(set(t['path'] for t in tests)|set(baseline_tests)):
    exists=p in paths or subprocess.run(['git','cat-file','-e',BASE+':'+p],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0
    write_files.setdefault(p,{'path':p,'action':'ADAPT' if exists else 'CREATE','intent':'Assertions owned by this test boundary; preserve existing baseline behavior.'})
    if exists:
        write_files[p]['preservation_expected']='Conserver les scénarios baseline existants ; adapter seulement les attentes remplacées par les règles PRE-3 explicites, sans supprimer les assertions PRE-1/PRE-2.'
    else:
        write_files[p]['preservation_expected']='Nouvelle suite : aucun scénario baseline dans ce fichier ; ne supprime ni ne remplace les suites existantes.'
for p in ['src/shared/i18n/index.ts','src/shared/ui/tokens.ts']:
    write_files[p]['intent']='Libellés et messages PRE-3 uniquement, décisions métier inchangées.' if '/i18n/' in p else 'Réutiliser uniquement les tokens canoniques existants ; aucune nouvelle couleur ou typo canonique ; chapitre 12 et consommateurs existants conservés.'

control_specs=[
 ('wheel','src/features/activities/ExecutionParametersSheet.tsx','P3-19','SwiftUI.Picker.wheel','Ouvrir une roulette inline, sélectionner une valeur valide ; une autre roulette/segmenté remplace la première ; ✓ applique au parent et ✕ annule.'),
 ('stepper','src/features/activities/ExecutionParametersSheet.tsx','P3-19',None,'Tap une fois ; début maintien 500 ms, répétition 150 ms, paliers normatifs, bornes, arrêt immédiat et aucun tap au relâchement ; Bip/CR/Fin pas 1 ; Profil préservé.'),
 ('variable-toggle','src/features/activities/ExecutionParametersSheet.tsx','P3-05',None,'Copie uniforme→lignes ; première ligne actuelle vers uniforme ; restauration temporaire ; N=1 effectif immédiat ; égalité ne change pas VARIABLE.'),
 ('sortable-rows','src/features/activities/ExecutionParametersSheet.tsx','P3-07',None,'Déplacer cible et Pause ensemble ; Monter/Descendre accessibles identiques au drag ; renuméroter et recalculer PN ; ✕ annule.'),
 ('sheet-check-cross','src/features/activities/ExecutionParametersSheet.tsx','P3-16',None,'✓ atomique et sans SQLite ; cible active incomplète interdit ✓ même tableau replié ; ✕/retour restaure le parent.'),
 ('parameter-card','src/features/activities/ActivityEditorForm.tsx','P3-15',None,'Toute la carte ouvre Paramètres ; phrase complète, segments en flux, un seul libellé accessible ; génération à chaque affichage sans stockage.'),
 ('editor-finish','src/features/sessions/ExerciseScreen.tsx','P3-01',None,'Quatre parcours ; Terminer écrit Catalogue ou applique copie au brouillon Composition, Continuer persiste Séance ; double tap/échec conserve brouillon et médias.'),
 ('media-list','src/features/activities/ActivityMediaList.tsx','P3-23',None,'Ajouter multiple photo/vidéo ; annulation neutre ; import visible ; Réessayer local sans doublon ; Retirer/Monter/Descendre ; ordre conservé après réouverture/copie.'),
 ('category','src/features/reference-data/CategoryPickerModal.tsx','P3-03',None,'Sélection simple et validation isolée ; nom vide désactive Ajouter sans erreur ; suppression/réactivation PRE-2 conservées.'),
 ('zones','src/features/reference-data/BodyZonePickerModal.tsx','P3-03',None,'Sélection multiple de pastilles textuelles ; ✓/✕ isolés ; nom vide désactive Ajouter sans erreur ; affectations retirées conservées.')]
# Source assertions link behavior; each UI proof is owned by its rendered boundary.
control_sources={
 'wheel':['P3-19/exclusive-scroll'],
 'stepper':['P3-19/hold','P3-19/non-accelerated'],
 'variable-toggle':['P3-05/equal-variable','P3-05/toggle-restoration','P3-08/immediate-N1'],
 'sortable-rows':['P3-07/move-accessible','P3-07/move-terminal'],
 'sheet-check-cross':['P3-16/sheet-boundary','P3-16/fold-incomplete'],
 'parameter-card':['P3-15/long-phrase','P3-15/grammar-edges'],
 'editor-finish':['P3-01/Catalogue:create','P3-01/Catalogue:edit','P3-01/Session:create','P3-01/Session:edit','P3-16/failure-doubletap'],
 'media-list':['P3-23/import-multiple','P3-23/cancel-local-error','P3-23/file-preservation'],
 'category':['P3-03/empty-create-name','P3-03/reference-retired'],
 'zones':['P3-03/empty-create-name','P3-03/zones-presentation','P3-03/reference-retired']}
control_tests={name:([SHEET,'src/features/sessions/__tests__/DurationWheelPicker.test.tsx'] if name=='wheel' else
 [SHEET,'src/shared/ui/__tests__/ProfileStepper.test.ts'] if name=='stepper' else
 [SHEET] if name in ['variable-toggle','sortable-rows','sheet-check-cross'] else
 [EDITOR] if name=='parameter-card' else
 ['src/features/sessions/__tests__/ExerciseScreen.test.tsx'] if name=='editor-finish' else
 ['src/features/activities/__tests__/ActivityMediaList.test.tsx'] if name=='media-list' else
 ['src/features/reference-data/__tests__/CategoryPickerModal.test.tsx'] if name=='category' else
 ['src/features/reference-data/__tests__/BodyZonePickerModal.test.tsx']) for name,*_ in control_specs}
# Per-surface semantic assertions: no aggregate expected string copied ten times.
a11y={
 'wheel':('Valeur de la roulette annoncée par SwiftUI.Picker.wheel ; nom du réglage et unité identifiables ; Valider/Annuler nommés et atteignables ; retour du focus au réglage après fermeture.',
   ['nom du réglage et unité','valeur courante transmise à la primitive native','Valider/Annuler atteignables','retour au réglage après fermeture'],
   'VoiceOver : ouvrir Durée, ajuster la valeur native, entendre valeur/unité, atteindre Valider puis Annuler sur une seconde ouverture ; vérifier le retour au réglage.'),
 'stepper':('Valeur du champ exposée comme ajustable avec nom/unité ; actions incrémenter et décrémenter accessibles ; état de borne annoncé et respecté ; Bip/Compte à rebours/Fin restent au pas 1 ; politique Profil conservée.',
   ['rôle ajustable et nom/unité','valeur courante','incrément/décrément aux bornes','pas 1 pour Bip/Compte à rebours/Fin'],
   'VoiceOver : utiliser les gestes ajustables et les boutons nommés aux deux bornes ; vérifier valeur/unité et arrêt au relâchement sur les champs concernés, puis non-régression Profil.'),
 'variable-toggle':('Séries uniformes/variables exposées avec leur sélection effective ; N=1 rend le choix sans effet inactif et annoncé ; des valeurs égales ne changent pas la sélection VARIABLE ; lignes actives restent dans l’ordre de lecture.',
   ['nom Séries uniformes/variables','état sélectionné effectif','inactif à N=1','égalité sans perte de VARIABLE'],
   'VoiceOver : basculer le mode, parcourir les lignes puis réduire N à 1 ; vérifier sélection/inactivité annoncées et absence de contrôles fantômes dans le parcours.'),
 'sortable-rows':('Chaque Série est identifiée par son rang avec cible et Pause ; Monter/Descendre portent ce rang et transportent la même ligne que le drag ; action hors première/dernière borne inactive ; rangs accessibles actualisés après déplacement.',
   ['rang Série, cible et Pause groupés','Monter/Descendre nommés par Série','actions aux bornes inactives','nouvel ordre et rangs annoncés'],
   'VoiceOver sans drag : déplacer une Série par Monter/Descendre ; entendre le nouveau rang et retrouver cible/Pause, puis vérifier première/dernière bornes.'),
 'sheet-check-cross':('Actions Valider les paramètres et Annuler les paramètres nommées ; cible active incomplète empêche Valider, même repliée ; message nommant la Série incomplète annoncé et focus placé sur la correction atteignable ; Annuler restitue le focus au déclencheur.',
   ['Valider/Annuler les paramètres nommés','Série incomplète annoncée','focus sur la correction même tableau replié','retour à la carte après annulation'],
   'VoiceOver : laisser Série 2 incomplète, replier et tenter Valider ; entendre Série 2 et atteindre sa correction ; Annuler puis contrôler le retour à la carte Paramètres.'),
 'parameter-card':('Une seule cible accessible nommée Paramètres contient la phrase intégrale annoncée une seule fois ; les segments Text imbriqués ne deviennent pas des cibles répétées ; activation ouvre la feuille, fermeture retourne à la carte ; texte agrandi sans troncature.',
   ['une seule cible Paramètres','phrase complète sans annonces dupliquées','activation ouvre la feuille','phrase longue accessible en texte agrandi'],
   'VoiceOver : parcourir une phrase longue, entendre toute la phrase une fois, ouvrir Paramètres et revenir ; répéter avec texte agrandi sans ellipse ni perte du bas.'),
 'editor-finish':('Nom, description et Terminer identifiables dans les quatre parcours ; état indisponible/en cours de Terminer exposé et double activation neutralisée ; erreur de sauvegarde annoncée sans perdre le brouillon ; action et champ corrigé atteignables avec clavier.',
   ['Nom/Description/Terminer nommés','état indisponible ou en cours exposé','erreur de sauvegarde annoncée','Terminer et champ accessibles avec clavier'],
   'VoiceOver : parcourir Créer/Modifier Catalogue et copie Séance, atteindre Terminer avec clavier ouvert, entendre son état et une erreur injectée ; aucun abandon du brouillon.'),
 'media-list':('Chaque média est identifié par son rang/type ; actions Retirer/Monter/Descendre nommées pour ce média et bornes inactives ; état Importation et erreur locale annoncés ; Réessayer atteignable pour le seul élément échoué ; ordre accessible actualisé.',
   ['rang/type du média','Retirer/Monter/Descendre identifiables','Importation et erreur locale annoncées','Réessayer local atteignable','nouvel ordre après déplacement'],
   'VoiceOver avec photo/vidéo : entendre Importation, parcourir les actions par média, provoquer une erreur locale et atteindre Réessayer ; déplacer puis retirer un média sans drag.'),
 'category':('Chaque catégorie porte son nom et l’état de sélection simple ; Valider/Annuler nommés ; formulaire Nom et Ajouter identifiables ; nom vide annonce Ajouter désactivé sans message d’erreur ; retour du focus au déclencheur Catégorie.',
   ['nom et état sélectionné simple','Valider/Annuler nommés','Nom/Ajouter identifiables','Ajouter désactivé sans erreur si nom vide','retour au déclencheur Catégorie'],
   'VoiceOver : choisir une catégorie, ouvrir Nouvelle catégorie avec nom vide et entendre Ajouter désactivé sans erreur ; annuler puis vérifier le retour au bouton Catégorie.'),
 'zones':('Chaque pastille expose le nom de la zone et son état sélectionné multiple ; changement d’une zone conserve les autres sélections ; Valider/Annuler nommés ; dans Nouvelle zone, Ajouter désactivé sans erreur pour nom vide ; retour au déclencheur Zones.',
   ['nom et état sélectionné de chaque zone','sélection multiple conservée','Valider/Annuler nommés','Ajouter désactivé sans erreur si nom vide','retour au déclencheur Zones'],
   'VoiceOver : sélectionner deux zones, désélectionner une seule et entendre les états ; ouvrir Nouvelle zone vide, contrôler Ajouter sans erreur, annuler et retrouver Zones.')}
interactions=[];accessibility=[]
for name,p,sc,primitive,expected in control_specs:
    paths_owned=control_tests[name]
    interactions.append({'assertion_id':'INTERACTION/'+name,'property_type':'INTERACTION','source_authority':'FUNCTIONAL','source_scope':sc,'source_assertions':control_sources[name],'path':p,'expected':expected,'risk_types':['FUNCTIONAL','ACCESSIBILITY']+(['DEVICE'] if name in ['wheel','stepper','media-list'] else []),'proof_required':['FUNCTIONAL_TEST'],'test_paths':paths_owned,'native_primitive':primitive,'status':'PLANNED_NOT_EXECUTED'})
    tests.append({'test_id':'INTERACTION/'+name,'scope_id':sc,'path':paths_owned[0],'expected':'Rendu et actions de cette surface ; assertions métier/SQLite dans leurs suites propres. '+expected,'source_assertion_refs':control_sources[name],'status':'PLANNED_NOT_EXECUTED'})
    expected_access,cases,device=a11y[name]
    accessibility.append({'proof_id':'ACCESSIBILITY/'+name,'kind':'ACCESSIBILITY_CHECK','path':p,'source_refs':['../../perimetre-et-couverture.md#P3-21']+control_sources[name]+(['../../perimetre-et-couverture.md#D-335'] if name=='media-list' else []),'expected':expected_access,'semantic_cases':cases,'touch_target':'Au moins 44 pt selon le contrat ciblé ; garder les cibles existantes de 48 pt, aucune réduction.','automated':paths_owned,'automated_expected':'Propriétés accessibles, états, actions, messages et ordre/focus demandés par cette surface ; une simulation ne prouve pas la perception VoiceOver native.','device':device,'status':'PLANNED_NOT_EXECUTED'})
    tests.append({'test_id':'ACCESSIBILITY/'+name,'scope_id':'P3-21','path':paths_owned[0],'expected':expected_access,'semantic_cases':cases,'proof_kind':'ACCESSIBILITY_CHECK','native_perception_proven':False,'status':'PLANNED_NOT_EXECUTED'})
# Ensure every targeted UI test is declared before freezing the write scope.
for p in sorted(set(t['path'] for t in tests)|{p for ps in control_tests.values() for p in ps}):
    if p not in write_files:
        exists=subprocess.run(['git','cat-file','-e',BASE+':'+p],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0
        write_files[p]={'path':p,'action':'ADAPT' if exists else 'CREATE','intent':'Rendu/actions/accessibilité propres à cette surface ; aucune preuve métier ou SQLite par mock UI.','preservation_expected':'Conserver les scénarios baseline de cette suite.' if exists else 'Nouvelle suite locale, sans remplacement des suites baseline.'}

preservation=[]
for p,row in sorted(write_files.items()):
    if row['action']=='CREATE':continue
    owned=[o for o in observed if o['path']==p]
    direct_contract={'src/shared/i18n/index.ts':'src/shared/i18n/index.test.ts','src/shared/ui/tokens.ts':'src/shared/ui/__tests__/tokensSpecification.test.ts'}
    regression=sorted(set(baseline_tests)|({direct_contract[p]} if p in direct_contract else set())|{q for q in paths if '/__tests__/' in q and pathlib.Path(q).stem.startswith(pathlib.Path(p).stem.split('.')[0])})
    preservation.append({'path':p,'baseline_observation':owned[0] if owned else None,'preservation_candidate_paths':regression,'action':'ADAPT','expected':'Contrat public existant et consommateurs hors périmètre conservés ; différences PRE-3 explicitement tracées.'})
nochange=[]
for imp in scan['importers']:
    if imp['path'] in write_files:continue
    tpaths=[imp['path']] if imp['candidate_kind']=='TEST' else sorted(set(baseline_tests)|{q for q in paths if '/__tests__/' in q and pathlib.Path(q).stem.startswith(pathlib.Path(imp['path']).stem.split('.')[0])})
    nochange.append({**imp,'classification':'NO_CHANGE','test_action':'RUN_EXISTING','tests_affected_paths':tpaths,'expected':'Imports, navigation et données publiques compatibles via adaptateur canonique ; aucun élargissement fonctionnel hors PRE-3.'})

uirows=[]
internal={'vectorPaths','blendMode','strokeJoin','strokeAlign','strokeCap','dashPattern'}
for row in mapping[1:]:
    record,node,name,typ,visible,source,master,layout,digest,disposition=row
    frame=record.split('/')[0]
    uirows.append([record,surface[frame],source,layout,digest,'VISUAL_COMPARE' if visible else 'HIDDEN_SOURCE_PRESERVED',master])
write('ui-elements.json',{'columns':['record_id','target_path','source_node_ref','layout_schema','raw_properties_sha256','disposition','master_ref'],'elements':uirows,'source_root':'../../figma/','reference_policy':{
 'asserted':'Rendu observable : géométrie relative au parent, dimensions/espacement/adaptation, contenu/typographie, couleur/opacité/effets, coins et rendu de contour/forme visibles. Comparaison PNG par état + mesures ; valeurs d’exemple distinctes des règles métier.',
 'source_context_only':sorted(internal),'context_reason':'Métadonnées Figma internes de construction vectorielle/compositing ; conservées comme provenance, aucune assertion VISUAL_COMPARE de valeur interne. La forme/le contour final visible reste comparé sur capture.',
 'hidden':'Les 65 descendants masqués restent conservés ; vérifier leur absence dans cet état et leur apparition dans les états fonctionnels concernés.',
 'adaptive':'360/402/440 ; texte agrandi ; hauteur intrinsèque et parent relations, aucun canvas x/y global appliqué au device.'}})
framechecks=[]
for f in frames:
    fid=f['frameId'];framechecks.append({'frame_id':fid,'path':surface[fid],'scopes':figscope[fid]+['P3-20'],'source':'../../figma/ecrans/'+fid.replace(':','-')+'.json','capture':'../../figma/captures/'+fid.replace(':','-')+'.png','expected':'Fidélité des propriétés observables de cet état ; comportements selon exigences fonctionnelles liées ; chaque écart a impact/justification/statut/décision.','status':'PLANNED_NOT_EXECUTED'})
write('ui-criteria.json',{'interactions':interactions,'accessibility':accessibility,'visual_states':framechecks,'native_assessments':{'primitive':'SwiftUI.Picker.wheel','interaction_assertion_ref':'INTERACTION/wheel','baseline_path':'src/features/sessions/DurationWheelPicker.tsx','existing_four_available_assessments':'Rattachées à INTERACTION/wheel pour preuve de sélection/annulation/exclusivité ; aucune nouvelle roue native.'},'capture_aliases':{'3542:4656':'6407:9458','policy':'PNG identiques historiquement ne prouvent pas une équivalence sémantique ; conserver deux contrôles d’état/shell distincts, ne pas fusionner automatiquement.'}})
write('requirements.json',{'documentary_requirements':rules,'migration_requirements':[{'requirement_id':'PRE3-MIG-'+key,'kind':'MIGRATION','scope_ids':['P3-17'],'expected':expected} for key,expected in migrations],'canonical_data_requirement':{'requirement_id':'PRE3-DATA-ExecutionParameters','kind':'DATA','scope_ids':['P3-04','P3-08','P3-17','P3-18'],'expected':'Version 1 ; mode et series UNIFORM/VARIABLE explicitement discriminés ; pas de phrase/total persistés ; projections dérivées, N=1 effectif normalisé ; R occurrence seulement.'},'assertions':assertions})
write('tests-and-preservation.json',{'test_obligations':tests,'write_scope':list(write_files.values()),'modify_preservation':preservation,'no_change_direct_importers':nochange,'proof_policy':'Attendus écrits avant développement. SQLite et fichiers réels testés par pilote ; appareil réservé au natif/perceptif. Aucun résultat d’application annoncé.'})
write('traceability.json',{'scopes':[{'scope_id':t['id'],'requirement':t['exigence'],'rule_ids':[r['requirement_id'] for r in rules if t['id'] in r['scope_ids']], 'assertion_ids':[a['assertionId'] for a in assertions if a['scopeId']==t['id']],'tests':[x['test_id'] for x in tests if x['scope_id']==t['id']],'assertion_test_paths':owners(t['id']),'test_paths':sorted(set(x['path'] for x in tests if x['scope_id']==t['id'])),'figma_frames':[f for f,sc in figscope.items() if t['id'] in sc or t['id']=='P3-20'],'visual_ref':'ui-criteria.json','proofs':['FUNCTIONAL_TEST']+(['VISUAL_COMPARE'] if t['id'] in ['P3-02','P3-03','P3-19','P3-20'] else [])+(['ACCESSIBILITY_CHECK'] if t['id']=='P3-21' else []),'status':'CORRECTED_PENDING_INDEPENDENT_REVIEW'} for t in trace]})
fixes={
 '22dcb':'INTERACTION assertions with FUNCTIONAL authority and native wheel binding: ui-criteria.json#/interactions',
 '2aa59':'Explicit numeric separators, normative values unchanged: requirements.json#/assertions; requirements.json#/documentary_requirements; existing resolved numeric Decision A retained.',
 '45a23':'95 documentary requirements retyped; DATA canonical representation, eight MIGRATION requirements, PRESERVATION REQUIRED: requirements.json',
 '50bc1':'Eight separate migration tests, 13 numeric fixtures, 276 text+bold+amount fixtures: tests-and-preservation.json#/test_obligations',
 '50fdb':'Exact baseline blobs materialized for all changed files/direct consumers/reuse targets: baseline-observations.json + baseline-blobs.json',
 '5b6a6':'Ten per-control/surface ACCESSIBILITY obligations with individual expected data, device/native separation: ui-criteria.json#/accessibility',
 '6bcfec':'Vector/compositing metadata explicitly source context only; rendered outline/shape preserved as visual comparison: ui-elements.json#/reference_policy',
 '8b2fc':'Six baseline suites present in ADAPT write scope and conservation expectations: tests-and-preservation.json#/write_scope',
 'aa97':'Every MODIFY boundary has baseline preservation suites; every NO_CHANGE importer has RUN_EXISTING obligations: tests-and-preservation.json',
 'c3c952':'Domain, repository, migration, i18n/tokens and screen owners separated; sheet test expected is rendering/actions only: tests-and-preservation.json#/test_obligations',
 'd9a6d':'95 state mappings explicit; inverse states bound to P3-14/P3-12, visual message separately P3-20: requirements.json; traceability.json',
 'f5a1':'File-specific intents preserved from proposed source; i18n/tokens own intents corrected, geometry resides on surface: tests-and-preservation.json#/write_scope',
 'f86f':'Explicit inverse domain test, nearest total/tie higher N/message predicate; separate sheet rendering: tests-and-preservation.json#P3-14/inverse-explicit'}
review=json.loads((OUT/'reviews/2026-10-09_revue-passe2-claude.json').read_text())
reviewed={f['finding_id']:f for f in review['finding_resolutions']}
ledger=[]
for f in findings:
    if not f['blocking']:continue
    key=next(k for k in fixes if f['finding_id'].startswith('FND-'+k))
    accepted=reviewed[f['finding_id']]['status']=='RESOLVED'
    ledger.append({'finding_id':f['finding_id'],'original_required_correction':f['required_correction'],'original_target':f['target_id'],'correction_applied':fixes[key],'status':'RESOLVED' if accepted else 'CORRECTED_PENDING_INDEPENDENT_REVIEW','resolution_accepted':accepted,'independent_review_ref':'reviews/2026-10-09_revue-passe2-claude.json','review_revision':review['reviewed_git_revision'],'independent_justification':reviewed[f['finding_id']]['justification']})
write('finding-resolutions.json',{'base_receipt_hash':read('registre-corrections-revue-initiale.json')['base_receipt_hash'],'findings':ledger,'regressions':[{'regression_id':x['regression_id'],'required_correction':x['required_correction'],'status':'CORRECTED_PENDING_INDEPENDENT_REVIEW','resolution_accepted':False} for x in review['correction_regressions']]})
manifest={'schema':'kodjo.pre3.corrected-review-dossier.v1','operation':340,'application_baseline':BASE,'status':'CORRECTED_PENDING_INDEPENDENT_REVIEW','protocol_exception':{'authority':'Owner instruction 2026-10-09: corriger le plan, relancer la revue Claude, voir après ; contourner le verrou si nécessaire.','scope':'Bypass blocked AllowedChangeSet scope-supplement admission for this planning revision only. This dossier replaces the old planning projections for review; it is NOT a canonical VNext produced/receipt nor a development admission.','owner_plan_approval':False,'implementation_started':False},'previous_produced_hash':'603de045f94fec3f14aa2198edaaad0b91020b79adddb19041b06314cc725e16','review_round':3,'previous_review_commit':'bf6a8cbc0d770031d7940f1aafe209f427f5f627','review_scope':['FND-5b6a6d10170c7a649a2c3861','FND-c3c9529d7f622ac36707b163','REG-01','REG-02'],'resolved_findings_preserved':11,'source_version':'Git frozen extraction #333, no new global Figma extraction','counts':{'documentary_states':len(rules),'figma_frames':len(frames),'elements':len(uirows),'original_blocking_findings':len(ledger),'open_findings':2,'pending_regressions':2,'numeric_cases':len(read('attendus-numeriques.json')['cases']),'phrase_cases':276,'baseline_blobs':len(observed)},'files':[]}
manifest['source_inputs']=[{'path':'../'+n,'sha256':sha((HERE/n).read_bytes())} for n in ['schema-et-ecritures.md','plan-technique-travail.md','attendus-numeriques.json','attendus-phrases-276.json','tracabilite-travail.json','inventaire-etats-scenarios.json','mapping-elements-ui.jsonl','assertions-recette.json','direct-import-scan.json','candidate-manifest.json','fichiers-cible-proposes.json','registre-corrections-revue-initiale.json','decision-revue-numeriques-resolue.json','corriger-plan-passe2.py']]
manifest['source_inputs'].append({'path':'reviews/2026-10-09_revue-passe2-claude.json','sha256':sha((OUT/'reviews/2026-10-09_revue-passe2-claude.json').read_bytes())})
for p in sorted(OUT.iterdir()):
    if not p.is_file() or p.suffix not in ['.json','.md','.cjs'] or p.name in ['manifest.json','verification.json']:continue
    data=p.read_bytes();manifest['files'].append({'path':p.name,'bytes':len(data),'sha256':sha(data)})
write('manifest.json',manifest)
print(json.dumps({'status':manifest['status'],'counts':manifest['counts'],'files':len(manifest['files'])}))
