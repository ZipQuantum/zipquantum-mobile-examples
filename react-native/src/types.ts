export type RouteAcknowledgement = {receipt: string; expires_in: number; endpoint: string};
export type ResolvedLink = {
  url: string;
  code?: string;
  host?: string;
  destination_url?: string;
  fallback_url?: string;
  parameters?: Record<string, unknown> | unknown[];
};
export type Delivery = {
  success: true;
  delivery: 'deep_link' | 'deferred_deep_link';
  session_key?: string;
  link: ResolvedLink;
  route_ack?: RouteAcknowledgement;
};
export type DeferredHandoff = {token: string; host: string};
