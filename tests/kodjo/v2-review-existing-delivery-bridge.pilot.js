'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const bridge = fs.readFileSync(path.join(root, '.github', 'workflows', 'kodjo-v2-review-existing-delivery-bridge.yml'), 'utf8');

test('existing delivery bridge réutilise le moteur historique et ne relance aucune implémentation', () => {
  assert.match(bridge, /\[KODJO_V2\] REVIEW_EXISTING_DELIVERY/);
  assert.match(bridge, /\[KODJO_SLICE\] IMPLEMENTATION_OUTPUT/);
  assert.match(bridge, /continuity_origin=V2_LEAN_QUEUE/);
  assert.doesNotMatch(bridge, /repos\/\$GITHUB_REPOSITORY\/dispatches|event_type:"kodjo_implementation_ready"/);
  assert.match(bridge, /STATUT : IMPLEMENTATION_READY_FOR_REVIEW/);
  assert.doesNotMatch(bridge, /claude|run-local-claude|start-kodjo-v2|IMPLEMENTATION_REVISION/);
});

test('existing delivery bridge lie queue, checkpoint, PR et HEAD exact', () => {
  assert.match(bridge, /verify-authorizations\.js/);
  assert.match(bridge, /\[KODJO_V2\] APPLICATION_CHECKPOINT/);
  assert.match(bridge, /cp_head.*application_head/);
  assert.match(bridge, /cp_delivery.*application_head/);
  assert.match(bridge, /\.state == "open" and \.base\.ref == "main" and \.head\.sha == \$head/);
  assert.match(bridge, /compare\/\$implementation_base\.\.\.\$application_head/);
});

test('existing delivery bridge conserve le contrat historique LOT_1_OF_1', () => {
  assert.match(bridge, /increment=LOT_1_OF_1/);
  assert.match(bridge, /STATUT : IMPLEMENTATION_READY_FOR_REVIEW/);
  assert.match(bridge, /source_implementation_trigger_comment_id=\$GATE_ID/);
});

test('existing delivery bridge compare uniquement le delta applicatif depuis le parent exact', () => {
  assert.match(bridge, /parents \| length/);
  assert.match(bridge, /implementation_base=\$\(jq -r '\.parents\[0\]\.sha'/);
  assert.match(bridge, /Implementation base does not match immutable V2 source_head/);
  assert.match(bridge, /compare\/\$implementation_base\.\.\.\$application_head/);
  assert.match(bridge, /base_head=\$BASE/);
  assert.match(bridge, /contains\("\\nbase_head=" \+ \$base \+ "\\n"\)/);
});


test('existing delivery bridge accepte une VISUAL_CORRECTION livrée sur le HEAD applicatif antérieur', () => {
  assert.match(bridge, /operation_kind=\$\(jq -r '\.operation_kind \/\/ "IMPLEMENT"'/);
  assert.match(bridge, /delivery_target\.application_head/);
  assert.match(bridge, /Visual correction base does not match delivery_target\.application_head/);
});
