import { useQuery } from '@tanstack/react-query';
import { getCommunityLinks } from '@/api/community';

/** The club's community group links. They rarely change, so they're only refetched after an hour. */
export function useCommunityLinks() {
  return useQuery({
    queryKey: ['community-links'],
    queryFn: getCommunityLinks,
    staleTime: 60 * 60 * 1000,
  });
}
