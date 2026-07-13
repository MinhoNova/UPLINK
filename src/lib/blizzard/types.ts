export interface BlizzardToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface BlizzardMythicSeason {
  _links: Record<string, unknown>;
  id: number;
  leaderboards: {
    keystone_leaderboard: { id: number };
    dungeon: { id: number; name: string };
  }[];
}

export interface BlizzardMythicLeaderboard {
  _links: Record<string, unknown>;
  season: { id: number };
  name: string;
  leaders: {
    character: {
      name: string;
      id: number;
      realm: { id: number; slug: string; name: string };
      faction: { type: string };
      playable_class: { id: number; name: string };
      playable_spec: { id: number; name: string };
    };
    mythic_rating: number;
    keystone: { mythic_level: number };
  }[];
}

export interface BlizzardCharacterEquipment {
  _links: Record<string, unknown>;
  character: { name: string; id: number };
  equipped_items: BlizzardEquippedItem[];
}

export interface BlizzardEquippedItem {
  item: { id: number; name: string };
  slot: { type: string; name: string };
  quantity: number;
  context: number;
  bonus_list?: number[];
  enchant?: { display_string: string; source_item_id: number; enchantment_id: number };
  sockets?: { socket_type: { name: string } }[];
  gems?: { id: number; name: string }[];
  stats?: { type: { type: string; name: string }; value: number }[];
  level?: { value: number };
  quality?: { type: string; name: string };
  name_description?: { display_string: string; color: string };
  media?: { id: number };
  transmog?: { item: { id: number; name: string } };
  durability?: number;
  binding?: { type: string };
  limit_category?: string;
  spells?: { spell: { id: number; name: string }; description: string }[];
  unique_equipped?: boolean;
}

export interface BlizzardCharacterTalents {
  _links: Record<string, unknown>;
  character: { name: string; id: number };
  talent_tree: BlizzardTalentTree[];
}

export interface BlizzardTalentTree {
  name: string;
  spec_name?: string;
  icon?: string;
  selected_node_ids?: number[];
  nodes?: BlizzardTalentNode[];
}

export interface BlizzardTalentNode {
  id: number;
  node_id: number;
  rank: number;
  talent?: { id: number; name: string; icon: string };
  unlocked: boolean;
}

export interface BlizzardCharacterStats {
  _links: Record<string, unknown>;
  character: { name: string; id: number };
  strength?: number;
  agility?: number;
  intellect?: number;
  stamina?: number;
  mastery?: number;
  haste?: number;
  critical_strike?: number;
  versatility?: number;
  leech?: number;
  avoidance?: number;
  speed?: number;
}

export interface PlayerListing {
  name: string;
  realm: string;
  region: string;
  score: number;
  specId: string;
  classId: string;
  race?: string;
  itemLevel?: number;
}

export interface AggregatedCharacter {
  name: string;
  realm: string;
  region: string;
  specId: string;
  classId: string;
  score: number;
  race?: string;
  talents: { nodeId: number; name: string; selected: boolean; spellId?: number; iconName?: string; row?: number; col?: number; treeName?: string; treeKind?: string }[];
  gear: { slot: string; name: string; itemId: number }[];
  gems: string[];
  enchants: { slot: string; name: string }[];
  statPriority: string[];
}

export interface AggregatedSpecData {
  totalPlayers: number;
  bis: { slot: string; names: { name: string; count: number; pct: string }[] }[];
  enchants: { slot: string; names: { name: string; count: number; pct: string }[] }[];
  gems: { name: string; count: number; pct: string }[];
  statPriority: string[];
  topPlayers: AggregatedCharacter[];
  players: PlayerListing[];
  lastUpdated: number;
}

export interface MetaPipelineResult {
  specs: Record<string, AggregatedSpecData>;
  timestamp: number;
  season: string;
  totalCharacters: number;
}
