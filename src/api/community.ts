import { api } from './client';
import type { CommunityLink } from './types';

/** Active community links, in display order. */
export async function getCommunityLinks() {
  return (await api<{ links: CommunityLink[] }>('/community')).links;
}
