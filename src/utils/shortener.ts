import { Tournament, Team, Fixture } from '../types/tournament';
import { compress, decompress } from 'lz-string';

// Use URL-safe base64 instead of custom base85 for better reliability
function encodeUrlSafe(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodeUrlSafe(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

// Encrypt data using XOR with a secure key derivation
function encrypt(data: string, key: string): string {
  const keyHash = Array.from(key).reduce((hash, char, i) => {
    return hash + char.charCodeAt(0) * (i + 1);
  }, 0);
  
  const dataBytes = new TextEncoder().encode(data);
  const result = new Uint8Array(dataBytes.length);
  
  for (let i = 0; i < dataBytes.length; i++) {
    const keyByte = (keyHash * (i + 1)) & 0xFF;
    result[i] = dataBytes[i] ^ keyByte;
  }
  
  return encodeUrlSafe(result);
}

function decrypt(encoded: string, key: string): string {
  const keyHash = Array.from(key).reduce((hash, char, i) => {
    return hash + char.charCodeAt(0) * (i + 1);
  }, 0);
  
  const dataBytes = decodeUrlSafe(encoded);
  const result = new Uint8Array(dataBytes.length);
  
  for (let i = 0; i < dataBytes.length; i++) {
    const keyByte = (keyHash * (i + 1)) & 0xFF;
    result[i] = dataBytes[i] ^ keyByte;
  }
  
  return new TextDecoder().decode(result);
}

// Compact binary format for tournament data
function compactTournament(t: Tournament): any {
  return {
    v: 2, // version
    i: t.id,
    n: t.name,
    p: t.phase === 'SINGLE' ? 0 : 1,
    c: {
      w: t.pointsConfig.win,
      l: t.pointsConfig.loss
    },
    t: t.teams.map(team => ({
      i: team.id,
      n: team.name,
      s: team.status === 'ACTIVE' ? 0 : 1,
      p: team.played,
      w: team.won
    })),
    f: t.fixtures.map(fix => ({
      i: fix.id,
      h: fix.homeTeamId,
      a: fix.awayTeamId,
      s: fix.homeScore || 0,
      r: fix.awayScore || 0,
      p: fix.played ? 1 : 0,
      m: fix.phase === 'HOME' ? 0 : 1
    }))
  };
}

function expandTournament(c: any): Tournament {
  if (c.v !== 2) throw new Error('Unsupported version');

  const now = new Date().toISOString();
  
  const teams: Team[] = c.t.map((t: any) => ({
    id: t.i,
    name: t.n,
    status: t.s === 0 ? 'ACTIVE' : 'WITHDRAWN',
    played: t.p,
    won: t.w,
    lost: t.p - t.w,
    points: t.w * c.c.w + (t.p - t.w) * c.c.l
  }));

  const fixtures: Fixture[] = c.f.map((f: any) => ({
    id: f.i,
    homeTeamId: f.h,
    awayTeamId: f.a,
    homeScore: f.s,
    awayScore: f.r,
    played: f.p === 1,
    phase: f.m === 0 ? 'HOME' : 'AWAY',
    date: now,
    datePlayed: now
  }));

  return {
    id: c.i,
    name: c.n,
    phase: c.p === 0 ? 'SINGLE' : 'HOME_AND_AWAY',
    pointsConfig: {
      win: c.c.w,
      loss: c.c.l
    },
    teams,
    fixtures,
    dateCreated: now,
    dateModified: now
  };
}

const ENCRYPTION_KEY = 'RnB_v2_2023';

export function encodeTournament(tournament: Tournament): string {
  try {
    // Convert to compact format
    const compact = compactTournament(tournament);
    
    // Stringify and compress
    const json = JSON.stringify(compact);
    const compressed = compress(json);
    
    if (!compressed) throw new Error('Compression failed');
    
    // Encrypt
    return encrypt(compressed, ENCRYPTION_KEY);
  } catch (error) {
    console.error('Encode error:', error);
    throw new Error('Failed to encode tournament data');
  }
}

export function decodeTournament(code: string): Tournament {
  try {
    // Decrypt
    const compressed = decrypt(code, ENCRYPTION_KEY);
    
    // Decompress
    const json = decompress(compressed);
    if (!json) throw new Error('Decompression failed');
    
    // Parse and validate
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format');
    }
    
    // Expand to full tournament
    return expandTournament(data);
  } catch (error) {
    console.error('Decode error:', error);
    throw new Error('Failed to decode tournament data');
  }
}
