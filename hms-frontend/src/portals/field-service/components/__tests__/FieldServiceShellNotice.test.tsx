import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FieldServiceShellNotice } from '../FieldServiceShellNotice';

describe('FieldServiceShellNotice — truthful wording (post-truth-gap fix)', () => {
  it('does NOT falsely claim that all field-service data is mock', () => {
    render(<FieldServiceShellNotice />);
    const text = screen.getByTestId('field-service-shell-notice').textContent || '';
    expect(text).not.toMatch(/functional prototype shell/i);
    expect(text).not.toMatch(/mock-generated for demonstration/i);
    expect(text).not.toMatch(/No real GPS, offline sync, or signature data is persisted/i);
  });

  it('does not label the page as "Field Service Sandbox" anymore', () => {
    render(<FieldServiceShellNotice />);
    const text = screen.getByTestId('field-service-shell-notice').textContent || '';
    expect(text).not.toMatch(/Field Service Sandbox/i);
  });

  it('describes the actual mixed state: live + WIP areas', () => {
    render(<FieldServiceShellNotice />);
    const text = screen.getByTestId('field-service-shell-notice').textContent || '';
    expect(text).toMatch(/mixed availability/i);
    expect(text).toMatch(/live-wired/i);
    expect(text).toMatch(/in progress/i);
  });
});
