import { ensureUniqueName, pickRandomCandidate } from '../../api/find-new-support';

describe('find-new support helpers', () => {
  test('pickRandomCandidate returns unique name and bio aligned', () => {
    const existing = new Set<string>(['jordan lee', 'priya nair']);
    const candidate = pickRandomCandidate(existing);
    expect(candidate.name).toBeTruthy();
    expect(existing.has(candidate.name.toLowerCase())).toBe(true); // ensureUniqueName adds to set
    expect(candidate.domain).toBeTruthy();
    expect(candidate.bio.toLowerCase()).toContain(candidate.domain.split(' ')[0].toLowerCase());
  });

  test('ensureUniqueName suffixes duplicates', () => {
    const existing = new Set<string>(['alex chen']);
    const name = ensureUniqueName('Alex Chen', existing);
    expect(name).toBe('Alex Chen 2');
    expect(existing.has('alex chen 2')).toBe(true);
  });
});
