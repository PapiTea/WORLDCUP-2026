export interface Team {
  id: string;
  name: string;
  code: string;
  imageId: string;
  flag: string;
  flagImage?: string;
}

export interface Group {
  id: string;
  name: string;
  teams: Team[];
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  kickoff: string;
  ukKickoff: string;
  group: string;
  status: 'PENDING' | 'LIVE' | 'FINISHED';
  venue: string;
  location: string;
  hostEmoji: string;
  actualScore?: { home: number; away: number };
}

const FLAG_IMAGES: Record<string, string> = {
  MEX: 'https://flagcdn.com/w80/mx.png', RSA: 'https://flagcdn.com/w80/za.png', KOR: 'https://flagcdn.com/w80/kr.png', CZE: 'https://flagcdn.com/w80/cz.png',
  CAN: 'https://flagcdn.com/w80/ca.png', SUI: 'https://flagcdn.com/w80/ch.png', QAT: 'https://flagcdn.com/w80/qa.png', BIH: 'https://flagcdn.com/w80/ba.png',
  BRA: 'https://flagcdn.com/w80/br.png', MAR: 'https://flagcdn.com/w80/ma.png', HAI: 'https://flagcdn.com/w80/ht.png', SCO: 'https://flagcdn.com/w80/gb-sct.png',
  USA: 'https://flagcdn.com/w80/us.png', PAR: 'https://flagcdn.com/w80/py.png', AUS: 'https://flagcdn.com/w80/au.png', TUR: 'https://flagcdn.com/w80/tr.png',
  GER: 'https://flagcdn.com/w80/de.png', CUR: 'https://flagcdn.com/w80/cw.png', ECU: 'https://flagcdn.com/w80/ec.png', CIV: 'https://flagcdn.com/w80/ci.png',
  NED: 'https://flagcdn.com/w80/nl.png', JPN: 'https://flagcdn.com/w80/jp.png', SWE: 'https://flagcdn.com/w80/se.png', TUN: 'https://flagcdn.com/w80/tn.png',
  BEL: 'https://flagcdn.com/w80/be.png', EGY: 'https://flagcdn.com/w80/eg.png', IRN: '/flags/iran.png', NZL: 'https://flagcdn.com/w80/nz.png',
  CPV: 'https://flagcdn.com/w80/cv.png', KSA: 'https://flagcdn.com/w80/sa.png', ESP: 'https://flagcdn.com/w80/es.png', URU: 'https://flagcdn.com/w80/uy.png',
  FRA: 'https://flagcdn.com/w80/fr.png', IRQ: 'https://flagcdn.com/w80/iq.png', NOR: 'https://flagcdn.com/w80/no.png', SEN: 'https://flagcdn.com/w80/sn.png',
  ALG: 'https://flagcdn.com/w80/dz.png', ARG: 'https://flagcdn.com/w80/ar.png', AUT: 'https://flagcdn.com/w80/at.png', JOR: 'https://flagcdn.com/w80/jo.png',
  COL: 'https://flagcdn.com/w80/co.png', COD: 'https://flagcdn.com/w80/cd.png', POR: 'https://flagcdn.com/w80/pt.png', UZB: 'https://flagcdn.com/w80/uz.png',
  CRO: 'https://flagcdn.com/w80/hr.png', ENG: 'https://flagcdn.com/w80/gb-eng.png', GHA: 'https://flagcdn.com/w80/gh.png', PAN: 'https://flagcdn.com/w80/pa.png',
};

const team = (code: string, name: string, emoji: string, flagImage?: string): Team => ({
  id: code.toLowerCase(),
  name,
  code,
  imageId: `flag-${code.toLowerCase()}`,
  flag: emoji,
  flagImage: flagImage || FLAG_IMAGES[code]
});

export const TEAMS: Record<string, Team> = {
  MEX: team('MEX', 'Mexico', '🇲🇽'), RSA: team('RSA', 'South Africa', '🇿🇦'), KOR: team('KOR', 'South Korea', '🇰🇷'), CZE: team('CZE', 'Czechia', '🇨🇿'),
  CAN: team('CAN', 'Canada', '🇨🇦'), SUI: team('SUI', 'Switzerland', '🇨🇭'), QAT: team('QAT', 'Qatar', '🇶🇦'), BIH: team('BIH', 'Bosnia and Herzegovina', '🇧🇦'),
  BRA: team('BRA', 'Brazil', '🇧🇷'), MAR: team('MAR', 'Morocco', '🇲🇦'), HAI: team('HAI', 'Haiti', '🇭🇹'), SCO: team('SCO', 'Scotland', '🏴'),
  USA: team('USA', 'USA', '🇺🇸'), PAR: team('PAR', 'Paraguay', '🇵🇾'), AUS: team('AUS', 'Australia', '🇦🇺'), TUR: team('TUR', 'Türkiye', '🇹🇷'),
  GER: team('GER', 'Germany', '🇩🇪'), CUR: team('CUR', 'Curaçao', '🇨🇼'), ECU: team('ECU', 'Ecuador', '🇪🇨'), CIV: team('CIV', "Côte d'Ivoire", '🇨🇮'),
  NED: team('NED', 'Netherlands', '🇳🇱'), JPN: team('JPN', 'Japan', '🇯🇵'), SWE: team('SWE', 'Sweden', '🇸🇪'), TUN: team('TUN', 'Tunisia', '🇹🇳'),
  BEL: team('BEL', 'Belgium', '🇧🇪'), EGY: team('EGY', 'Egypt', '🇪🇬'), IRN: team('IRN', 'Iran', '🇮🇷', '/flags/iran.png'), NZL: team('NZL', 'New Zealand', '🇳🇿'),
  CPV: team('CPV', 'Cape Verde', '🇨🇻'), KSA: team('KSA', 'Saudi Arabia', '🇸🇦'), ESP: team('ESP', 'Spain', '🇪🇸'), URU: team('URU', 'Uruguay', '🇺🇾'),
  FRA: team('FRA', 'France', '🇫🇷'), IRQ: team('IRQ', 'Iraq', '🇮🇶'), NOR: team('NOR', 'Norway', '🇳🇴'), SEN: team('SEN', 'Senegal', '🇸🇳'),
  ALG: team('ALG', 'Algeria', '🇩🇿'), ARG: team('ARG', 'Argentina', '🇦🇷'), AUT: team('AUT', 'Austria', '🇦🇹'), JOR: team('JOR', 'Jordan', '🇯🇴'),
  COL: team('COL', 'Colombia', '🇨🇴'), COD: team('COD', 'DR Congo', '🇨🇩'), POR: team('POR', 'Portugal', '🇵🇹'), UZB: team('UZB', 'Uzbekistan', '🇺🇿'),
  CRO: team('CRO', 'Croatia', '🇭🇷'), ENG: team('ENG', 'England', '🏴'), GHA: team('GHA', 'Ghana', '🇬🇭'), PAN: team('PAN', 'Panama', '🇵🇦'),
};

export const GROUPS: Group[] = [
  { id: 'A', name: 'Group A', teams: [TEAMS.MEX, TEAMS.RSA, TEAMS.KOR, TEAMS.CZE] },
  { id: 'B', name: 'Group B', teams: [TEAMS.CAN, TEAMS.SUI, TEAMS.QAT, TEAMS.BIH] },
  { id: 'C', name: 'Group C', teams: [TEAMS.BRA, TEAMS.MAR, TEAMS.HAI, TEAMS.SCO] },
  { id: 'D', name: 'Group D', teams: [TEAMS.USA, TEAMS.PAR, TEAMS.AUS, TEAMS.TUR] },
  { id: 'E', name: 'Group E', teams: [TEAMS.GER, TEAMS.CUR, TEAMS.ECU, TEAMS.CIV] },
  { id: 'F', name: 'Group F', teams: [TEAMS.NED, TEAMS.JPN, TEAMS.SWE, TEAMS.TUN] },
  { id: 'G', name: 'Group G', teams: [TEAMS.BEL, TEAMS.EGY, TEAMS.IRN, TEAMS.NZL] },
  { id: 'H', name: 'Group H', teams: [TEAMS.CPV, TEAMS.KSA, TEAMS.ESP, TEAMS.URU] },
  { id: 'I', name: 'Group I', teams: [TEAMS.FRA, TEAMS.IRQ, TEAMS.NOR, TEAMS.SEN] },
  { id: 'J', name: 'Group J', teams: [TEAMS.ALG, TEAMS.ARG, TEAMS.AUT, TEAMS.JOR] },
  { id: 'K', name: 'Group K', teams: [TEAMS.COL, TEAMS.COD, TEAMS.POR, TEAMS.UZB] },
  { id: 'L', name: 'Group L', teams: [TEAMS.CRO, TEAMS.ENG, TEAMS.GHA, TEAMS.PAN] },
];

const fixtures = [
  ['m1', 'MEX', 'RSA', '2026-06-11T20:30:00Z', 'A', '21:30', 'Estadio Azteca', 'Mexico City, Mexico', '🇲🇽'],
  ['m2', 'KOR', 'CZE', '2026-06-12T02:00:00Z', 'A', '03:00', 'Estadio Akron', 'Zapopan, Mexico', '🇲🇽'],
  ['m3', 'CAN', 'BIH', '2026-06-12T20:30:00Z', 'B', '21:30', 'BMO Field', 'Toronto, Canada', '🇨🇦'],
  ['m4', 'USA', 'PAR', '2026-06-13T02:00:00Z', 'D', '03:00', 'SoFi Stadium', 'Los Angeles, USA', '🇺🇸'],
  ['m5', 'QAT', 'SUI', '2026-06-13T20:30:00Z', 'B', '21:30', 'Levi’s Stadium', 'Santa Clara, USA', '🇺🇸'],
  ['m6', 'BRA', 'MAR', '2026-06-13T17:00:00Z', 'C', '18:00', 'MetLife Stadium', 'New Jersey, USA', '🇺🇸'],
  ['m7', 'HAI', 'SCO', '2026-06-14T02:00:00Z', 'C', '03:00', 'Gillette Stadium', 'Foxborough, USA', '🇺🇸'],
  ['m8', 'AUS', 'TUR', '2026-06-14T23:00:00Z', 'D', '00:00', 'BC Place', 'Vancouver, Canada', '🇨🇦'],
  ['m9', 'GER', 'CUR', '2026-06-14T20:30:00Z', 'E', '21:30', 'NRG Stadium', 'Houston, USA', '🇺🇸'],
  ['m10', 'NED', 'JPN', '2026-06-14T17:00:00Z', 'F', '18:00', 'AT&T Stadium', 'Arlington, USA', '🇺🇸'],
  ['m11', 'CIV', 'ECU', '2026-06-14T23:00:00Z', 'E', '00:00', 'Lincoln Financial Field', 'Philadelphia, USA', '🇺🇸'],
  ['m12', 'SWE', 'TUN', '2026-06-15T02:00:00Z', 'F', '03:00', 'Estadio BBVA', 'Guadalupe, Mexico', '🇲🇽'],
  ['m13', 'ESP', 'CPV', '2026-06-15T17:00:00Z', 'H', '18:00', 'Mercedes-Benz Stadium', 'Atlanta, USA', '🇺🇸'],
  ['m14', 'BEL', 'EGY', '2026-06-15T20:30:00Z', 'G', '21:30', 'Lumen Field', 'Seattle, USA', '🇺🇸'],
  ['m15', 'KSA', 'URU', '2026-06-15T23:00:00Z', 'H', '00:00', 'Hard Rock Stadium', 'Miami, USA', '🇺🇸'],
  ['m16', 'IRN', 'NZL', '2026-06-16T02:00:00Z', 'G', '03:00', 'SoFi Stadium', 'Los Angeles, USA', '🇺🇸'],
  ['m17', 'FRA', 'SEN', '2026-06-16T17:00:00Z', 'I', '18:00', 'MetLife Stadium', 'New Jersey, USA', '🇺🇸'],
  ['m18', 'IRQ', 'NOR', '2026-06-16T20:30:00Z', 'I', '21:30', 'Gillette Stadium', 'Foxborough, USA', '🇺🇸'],
  ['m19', 'ARG', 'ALG', '2026-06-17T23:00:00Z', 'J', '00:00', 'GEHA Field at Arrowhead Stadium', 'Kansas City, USA', '🇺🇸'],
  ['m20', 'AUT', 'JOR', '2026-06-17T02:00:00Z', 'J', '03:00', 'Levi’s Stadium', 'Santa Clara, USA', '🇺🇸'],
  ['m21', 'POR', 'COD', '2026-06-17T17:00:00Z', 'K', '18:00', 'NRG Stadium', 'Houston, USA', '🇺🇸'],
  ['m22', 'ENG', 'CRO', '2026-06-17T20:30:00Z', 'L', '21:30', 'AT&T Stadium', 'Arlington, USA', '🇺🇸'],
  ['m23', 'GHA', 'PAN', '2026-06-17T23:00:00Z', 'L', '00:00', 'BMO Field', 'Toronto, Canada', '🇨🇦'],
  ['m24', 'UZB', 'COL', '2026-06-18T02:00:00Z', 'K', '03:00', 'Estadio Azteca', 'Mexico City, Mexico', '🇲🇽'],
  ['m25', 'CZE', 'RSA', '2026-06-18T17:00:00Z', 'A', '18:00', 'Mercedes-Benz Stadium', 'Atlanta, USA', '🇺🇸'],
  ['m26', 'SUI', 'BIH', '2026-06-18T20:30:00Z', 'B', '21:30', 'SoFi Stadium', 'Los Angeles, USA', '🇺🇸'],
  ['m27', 'CAN', 'QAT', '2026-06-18T23:00:00Z', 'B', '00:00', 'BC Place', 'Vancouver, Canada', '🇨🇦'],
  ['m28', 'MEX', 'KOR', '2026-06-19T02:00:00Z', 'A', '03:00', 'Estadio Akron', 'Zapopan, Mexico', '🇲🇽'],
  ['m29', 'USA', 'AUS', '2026-06-19T20:30:00Z', 'D', '21:30', 'Lumen Field', 'Seattle, USA', '🇺🇸'],
  ['m30', 'SCO', 'MAR', '2026-06-19T17:00:00Z', 'C', '18:00', 'Gillette Stadium', 'Foxborough, USA', '🇺🇸'],
  ['m31', 'BRA', 'HAI', '2026-06-20T23:00:00Z', 'C', '00:00', 'Lincoln Financial Field', 'Philadelphia, USA', '🇺🇸'],
  ['m32', 'TUR', 'PAR', '2026-06-20T02:00:00Z', 'D', '03:00', 'Levi’s Stadium', 'Santa Clara, USA', '🇺🇸'],
  ['m33', 'NED', 'SWE', '2026-06-20T17:00:00Z', 'F', '18:00', 'NRG Stadium', 'Houston, USA', '🇺🇸'],
  ['m34', 'GER', 'CIV', '2026-06-20T20:30:00Z', 'E', '21:30', 'BMO Field', 'Toronto, Canada', '🇨🇦'],
  ['m35', 'ECU', 'CUR', '2026-06-21T23:00:00Z', 'E', '00:00', 'GEHA Field at Arrowhead Stadium', 'Kansas City, USA', '🇺🇸'],
  ['m36', 'TUN', 'JPN', '2026-06-21T02:00:00Z', 'F', '03:00', 'Estadio BBVA', 'Guadalupe, Mexico', '🇲🇽'],
  ['m37', 'ESP', 'KSA', '2026-06-21T17:00:00Z', 'H', '18:00', 'Mercedes-Benz Stadium', 'Atlanta, USA', '🇺🇸'],
  ['m38', 'BEL', 'IRN', '2026-06-21T20:30:00Z', 'G', '21:30', 'SoFi Stadium', 'Los Angeles, USA', '🇺🇸'],
