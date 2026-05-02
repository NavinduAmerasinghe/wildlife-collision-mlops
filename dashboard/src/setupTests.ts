import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Optional: mocks for browser APIs that some libs need
window.scrollTo = vi.fn();

// If Recharts / Leaflet / ResizeObserver cause errors, you can also mock them here.
