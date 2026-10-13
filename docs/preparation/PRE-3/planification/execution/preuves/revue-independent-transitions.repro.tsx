import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { expect, jest, test } from '@jest/globals';
import { useState } from 'react';
import { openSheetDraft, setVariable, setMode, setSeriesCount, applyRequestedTotal } from '@/domain/activities/ExecutionParametersDraft';
import { ActivityEditorForm } from '@/features/activities/ActivityEditorForm';
import { TestSafeAreaProvider } from '@/shared/ui/TestSafeAreaProvider';

jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(async () => undefined) }));
jest.mock('@/infrastructure/media/VideoPoster', () => ({ generateVideoPoster: jest.fn(async () => null) }));

const parameters: any = { version: 1, mode: 'DURATION', series: { kind: 'VARIABLE', rows: [{ target: 30, pauseSeconds: 10 }, { target: 60, pauseSeconds: 20 }] }, sideMode: 'UNILATERAL', sideOrder: 'BY_SIDE', sideRecoverySeconds: 0, cadenceBeepIntervalSeconds: 0, countdownSeconds: 10, endSeconds: 5 };

test('REV-01: a saved variable duration table must not become repetitions', () => {
  let draft = openSheetDraft(parameters);
  draft = setVariable(draft, false);
  draft = setMode(draft, 'REPETITIONS');
  draft = setVariable(draft, true);
  expect(draft.rows.map(row => row.target)).toEqual([null, null]);
});

test('REV-02: normalized N=1 uniform total control must apply its selection', () => {
  let draft = openSheetDraft(parameters);
  draft = setSeriesCount(draft, 1);
  expect(applyRequestedTotal(draft, 120)).not.toBeNull();
});

test('REV-03: retry of the first imported photo must preserve selection order', async () => {
  const picked: any = { uri: 'file:///cache/a.jpg', kind: 'PHOTO', mimeType: 'image/jpeg', fileName: null, sizeBytes: 1, durationMs: null, width: 1, height: 1, nativeAssetId: null };
  const photo = (id: string): any => ({ assetId: id, asset: { id, uri: `kodjo-media/${id}.jpg`, kind: 'PHOTO', createdAt: 'now' } });
  const service: any = {
    supportsMediaImport: true,
    resolveMediaUri: (uri: string) => uri,
    leaseDraftMedia: jest.fn(),
    importPendingMedia: jest.fn(async () => null),
    importMedia: jest.fn(async () => ({ status: 'IMPORTED', limitedAccess: false, items: [
      { key: 'a', state: 'FAILED', picked, error: 'COPY_FAILED' },
      { key: 'b', state: 'READY', picked, media: photo('b') },
    ] })),
    retryMediaImport: jest.fn(async () => ({ key: 'a', state: 'READY', picked, media: photo('a') })),
  };
  let observed: string[] = [];
  function Harness() {
    const [value, setValue] = useState<any>({ name: 'Exercice', instruction: null, executionParameters: parameters, bodyZoneIds: [], media: [] });
    return <TestSafeAreaProvider><ActivityEditorForm value={value} onChange={(patch) => {
      if (patch.media) observed = patch.media.map(item => item.assetId);
      setValue((current: any) => ({ ...current, ...patch }));
    }} bodyZones={[]} category={null} onOpenCategory={() => {}} profileSideRecoverySecondsDefault={10} mediaService={service} mediaDraftId="review" finishLabel="Terminer" onFinish={() => {}} finishSlotTestID="review-finish" finishActionTestID="review-finish-action" /></TestSafeAreaProvider>;
  }
  render(<Harness />);
  await act(async () => { fireEvent.press(screen.getByTestId('media-add')); });
  expect(observed).toEqual(['b']);
  await act(async () => { fireEvent.press(screen.getByTestId('media-pending-1-retry')); });
  expect(observed).toEqual(['a', 'b']);
});
