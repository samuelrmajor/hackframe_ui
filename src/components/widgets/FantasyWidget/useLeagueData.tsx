// src/useLeagueData.ts

import { useEffect, useState } from 'react';
import type { LeagueData, MatchupPair, TeamMatchup } from './FantasyTypes';

const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours in ms

const fetchWithCache = async (key: string, url: string) => {
    const cached = localStorage.getItem(key);
    if (cached) {
        try {
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data;
            }
        } catch (e) {
            console.error("Error parsing cache", e);
        }
    }
    const response = await fetch(url);
    const data = await response.json();
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
    return data;
};

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
        // Don't set loading to true on every refresh if we already have data
        // setData(prev => ({ ...prev, loading: true, error: null }));
        
        // 1. Get League Details and Week concurrently (Cached)
        const [stateData, leagueDetails] = await Promise.all([
             fetchWithCache('sleeper_nfl_state', "https://api.sleeper.app/v1/state/nfl"),
             fetchWithCache(`sleeper_league_${leagueId}`, `https://api.sleeper.app/v1/league/${leagueId}`),
        ]);
        
        const currentWeek = stateData.week;
        const leagueName = leagueDetails.name || "Fantasy League";
        const leagueAvatar = leagueDetails.avatar || null; 

        // 2. Fetch Users, Rosters (Cached), Matchups (Fresh)
        const [users, rosters, matchups] = await Promise.all([
          fetchWithCache(`sleeper_users_${leagueId}`, `https://api.sleeper.app/v1/league/${leagueId}/users`),
          fetchWithCache(`sleeper_rosters_${leagueId}`, `https://api.sleeper.app/v1/league/${leagueId}/rosters`),
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