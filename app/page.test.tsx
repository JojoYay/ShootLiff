import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Home from './page';

describe('Home', () => {
  it('renders without crashing', () => {
    const { container } = render(<Home />);
    expect(container).toBeDefined();
  });

  it('renders root div', () => {
    const { container } = render(<Home />);
    const div = container.querySelector('div');
    expect(div).toBeTruthy();
  });
});
