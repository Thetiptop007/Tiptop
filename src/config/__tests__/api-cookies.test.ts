import { describe, it, expect, beforeEach, vi } from 'vitest';

// We need to import the function we want to test. 
// Since it's not exported, we might need to export it for testing or test through getCsrfTokenForScope
import { getCsrfTokenForScope } from '../api';

describe('API Cookie Retrieval', () => {
  beforeEach(() => {
    // Clear cookies before each test
    vi.stubGlobal('document', {
      cookie: ''
    });
  });

  it('prefers non-empty cookies when duplicates exist', () => {
    // Simulate duplicate cookies (common on Render with different paths)
    // One is empty, one is valid
    const mockCookies = 'adminCsrfToken=; adminCsrfToken=valid-token-123';
    vi.stubGlobal('document', {
      cookie: mockCookies
    });

    const token = getCsrfTokenForScope('admin');
    expect(token).toBe('valid-token-123');
  });

  it('returns null if no cookies exist', () => {
    vi.stubGlobal('document', {
      cookie: ''
    });

    const token = getCsrfTokenForScope('admin');
    expect(token).toBe(null);
  });

  it('returns the empty value if ONLY empty cookies exist', () => {
    vi.stubGlobal('document', {
      cookie: 'adminCsrfToken='
    });

    const token = getCsrfTokenForScope('admin');
    expect(token).toBe('');
  });
});
