import {describe, expect, it} from 'vitest';
import {parseDeliveryRoute, parseDesktopRoute, validateDirectMobileLink} from './routing';

describe('allowlisted route parser', () => {
  it('accepts an allowlisted desktop direct route', () => {
    expect(parseDesktopRoute('zq-example://product/example-42')).toEqual({
      kind: 'product',
      identifier: 'example-42',
    });
  });

  it('rejects unknown and malformed desktop routes', () => {
    expect(() => parseDesktopRoute('zq-example://admin/example-42')).toThrow(/Unknown/);
    expect(() => parseDesktopRoute('other://product/example-42')).toThrow(/Unconfigured/);
    expect(() => parseDesktopRoute('zq-example://product/../../secret')).toThrow(/Unknown/);
  });

  it('accepts only the configured mobile link host', () => {
    expect(validateDirectMobileLink('https://links.example.com/open/abc_123')).toMatchObject({
      host: 'links.example.com',
      reference: 'abc_123',
    });
    expect(() => validateDirectMobileLink('https://attacker.example/open/abc')).toThrow(/Unconfigured/);
  });

  it('parses only allowlisted server destinations', () => {
    expect(parseDeliveryRoute({
      success: true,
      delivery: 'deep_link',
      link: {url: 'https://links.example.com/a', destination_url: 'https://app.example.com/invite/team_1'},
    })).toEqual({kind: 'invite', identifier: 'team_1'});

    expect(() => parseDeliveryRoute({
      success: true,
      delivery: 'deep_link',
      link: {url: 'https://links.example.com/a', destination_url: 'https://attacker.example/invite/team_1'},
    })).toThrow(/Unconfigured/);
  });
});
