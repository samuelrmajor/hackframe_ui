// src/useLeagueData.ts

import { useEffect, useState } from 'react';
import type { LeagueData, MatchupPair, TeamMatchup } from './FantasyTypes';

// --- Custom Hook to Fetch and Process Data ---
export const useLeagueData = (leagueId: string, userId?: string): LeagueData => { 
  const [data, setData] = useState<LeagueData>({
    id: leagueId,
    name: 'Loading...',
    avatar: null, 
    week: 0,
    matches: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!leagueId) return;

    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        // 1. Get League Details and Week concurrently
        const [stateData, leagueDetails] = await Promise.all([
             fetch("https://api.sleeper.app/v1/state/nfl").then(r => r.json()),
             fetch(`https://api.sleeper.app/v1/league/${leagueId}`).then(r => r.json()),
        ]);
        
        const currentWeek = stateData.week;
        const leagueName = leagueDetails.name || "Fantasy League";
        const leagueAvatar = leagueDetails.avatar || null; 

        // 2. Fetch Users, Rosters, Matchups Parallel
        const [users, rosters, matchups] = await Promise.all([
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`).then(r => r.json()),
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`).then(r => r.json()),
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${currentWeek}`).then(r => r.json())
        ]);
        
        // Find the user's Roster ID for sorting
        const activeUser = users.find((u: any) => u.user_id === userId);
        let userRosterId: number | undefined;
        if (activeUser) {
             const userRoster = rosters.find((r: any) => r.owner_id === activeUser.user_id);
             userRosterId = userRoster?.roster_id;
        }

        // 3. Map Data (Roster ID -> Name/Avatar)
        const rosterMap = new Map();
        rosters.forEach((r: any) => {
          const user = users.find((u: any) => u.user_id === r.owner_id);
          rosterMap.set(r.roster_id, {
            name: user?.metadata?.team_name || user?.display_name || "Team",
            avatar: user?.avatar
          });
        });

        // 4. Group Matchups by Matchup ID
        const grouped = new Map<number, TeamMatchup[]>();
        matchups.forEach((m: any) => {
          grouped.set(m.matchup_id, [...(grouped.get(m.matchup_id) || []), {
            rosterId: m.roster_id,
            matchupId: m.matchup_id,
            points: m.points,
            manager: rosterMap.get(m.roster_id)
          }]);
        });

        // 5. Flatten to pairs and apply custom sort
        const pairs: MatchupPair[] = [];
        grouped.forEach((teams, mId) => pairs.push({ matchupId: mId, team1: teams[0], team2: teams[1] || null }));
        
        let sortedPairs = pairs;
        
        // APPLY CUSTOM SORTING: User's game goes to the top
        if (userRosterId !== undefined) {
            sortedPairs = pairs.sort((a, b) => {
                const aContainsUser = a.team1.rosterId === userRosterId || a.team2?.rosterId === userRosterId;
                const bContainsUser = b.team1.rosterId === userRosterId || b.team2?.rosterId === userRosterId;

                // Move user's game up
                if (aContainsUser && !bContainsUser) return -1; 
                if (!aContainsUser && bContainsUser) return 1;  
                
                // Default sort by matchup ID
                return a.matchupId - b.matchupId;
            });
        } else {
             sortedPairs.sort((a, b) => a.matchupId - b.matchupId);
        }

        setData({
            id: leagueId,
            name: leagueName,
            avatar: leagueAvatar, 
            week: currentWeek,
            matches: sortedPairs, 
            loading: false,
            error: null,
        });

      } catch (e) {
        console.error(`Error fetching data for ${leagueId}:`, e);
        setData(prev => ({ ...prev, loading: false, error: 'Failed to load league data.' }));
      }
    };
    fetchData();
  }, [leagueId, userId]); 

  return data;
};