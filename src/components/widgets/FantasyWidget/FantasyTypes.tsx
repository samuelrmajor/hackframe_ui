// src/types.ts

export interface TeamMatchup {
    rosterId: number;
    matchupId: number;
    points: number;
    manager: {
        name: string;
        avatar: string;
    };
}

export interface MatchupPair {
    matchupId: number;
    team1: TeamMatchup;
    team2: TeamMatchup | null;
}

export interface LeagueData {
    id: string;
    name: string;
    avatar: string | null; 
    week: number;
    matches: MatchupPair[];
    loading: boolean;
    error: string | null;
}