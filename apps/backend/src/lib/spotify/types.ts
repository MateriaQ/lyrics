export type SpotifyErrCodes =
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "AUTH_FAILED"
  | "API_ERROR"
  | "INTERNAL_ERROR";

export type SpotifyResult<T> =
  | { success: true; data: T }
  | { success: false; code: SpotifyErrCodes; message: string };

export interface Lyrics {
  syncType: "UNSYNCED" | "LINE_SYNCED";
  lines: Line[];
  provider: string;
  providerLyricsId: string;
  providerDisplayName: string;
  syncLyricsUri: string;
  isDenseTypeface: boolean;
  alternatives: any[];
  language: string;
  isRtlLanguage: boolean;
  capStatus: string;
  previewLines: PreviewLine[];
}

export interface Line {
  startTimeMs: string;
  words: string;
  /**
   * End time is most of the times 0, and inaccurate
   */
  endTimeMs: string;
  // syllables: any[];
  // transliteratedWords: string;
}

export type PreviewLine = Line;

export interface SpotifyLyricsResponse {
  lyrics: Lyrics;
  colors: Record<"background" | "text" | "highlightText", number>;
  // hasAlts: boolean;
  hasVocalRemoval: boolean;
}

export interface TokenData {
  clientId: string;
  accessToken: string;
  accessTokenExpirationTimestampMs: number;
  isAnonymous: boolean;
}

export interface SPTrack {
  gid: string;
  name: string;
  album: AlbumMetadata;
  artist: ArtistMetadata[];
  number: number;
  disc_number: number;
  duration: number;
  popularity: number;
  has_lyrics: boolean;
  external_id: ExternalIdMetadata[];
  restriction: RestrictionMetadata[];
  earliest_live_timestamp: number;
  licensor: LicensorMetadata;
  language_of_performance: string[];
  original_audio: AudioMetadata;
  original_title: string;
  artist_with_role: ArtistWithRole[];
  canonical_uri: string;
  content_authorization_attributes: string;
  audio_formats: AudioFormat[];
  media_type: string;
  implementation_details: ImplementationDetails;
}

export interface AlbumMetadata {
  gid: string;
  name: string;
  artist: ArtistMetadata[];
  label: string;
  date: DateMetadata;
  cover_group: CoverGroup;
  licensor: LicensorMetadata;
}

export interface ArtistMetadata {
  gid: string;
  name: string;
}

export interface ArtistWithRole extends ArtistMetadata {
  artist_gid: string;
  artist_name: string;
  role: "ARTIST_ROLE_MAIN_ARTIST" | string;
}

export interface DateMetadata {
  year: number;
  month: number;
  day: number;
}

export interface CoverGroup {
  image: ImageMetadata[];
}

export interface ImageMetadata {
  file_id: string;
  size: "DEFAULT" | "SMALL" | "LARGE";
  width: number;
  height: number;
}

export interface ExternalIdMetadata {
  type: string; // e.g., "isrc"
  id: string;
}

export interface RestrictionMetadata {
  countries_forbidden: string;
  catalogue_str: string[];
}

export interface LicensorMetadata {
  uuid: string;
}

export interface AudioMetadata {
  uuid: string;
  format: "AUDIO_FORMAT_STEREO" | string;
}

export interface AudioFormat {
  original_audio: AudioMetadata;
}

export interface ImplementationDetails {
  catalog_insertion_date: {
    seconds: number;
    nanos: number;
  };
}

// from https://github.com/spotify/spotify-web-api-ts-sdk/blob/c6f34491eaa17ab73698d5464ee10332d0c551cc/src/types.ts
export interface LinkedFrom {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  type: string;
  uri: string;
}

export interface SimplifiedTrack {
  artists: SimplifiedArtist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  episode: boolean;
  explicit: boolean;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  is_local: boolean;
  name: string;
  preview_url: string | null;
  track: boolean;
  track_number: number;
  type: string;
  uri: string;
  is_playable?: boolean;
  linked_from?: LinkedFrom;
  restrictions?: Restrictions;
}

export interface ExternalIds {
  isrc: string;
  ean: string;
  upc: string;
}

interface Copyright {
  text: string;
  type: string;
}

export interface ExternalUrls {
  spotify: string;
}

interface Image {
  url: string;
  height: number;
  width: number;
}

export interface Restrictions {
  reason: string;
}

interface AlbumBase {
  album_type: string;
  available_markets: string[];
  copyrights: Copyright[];
  external_ids: ExternalIds;
  external_urls: ExternalUrls;
  genres: string[];
  href: string;
  id: string;
  images: Image[];
  label: string;
  name: string;
  popularity: number;
  release_date: string;
  release_date_precision: string;
  restrictions?: Restrictions;
  total_tracks: number;
  type: string;
  uri: string;
}

export interface SimplifiedArtist {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}

export interface SimplifiedAlbum extends AlbumBase {
  album_group: string;
  artists: SimplifiedArtist[];
}

export interface Track extends SimplifiedTrack {
  album: SimplifiedAlbum;
  external_ids: ExternalIds;
  popularity: number;
}

export type Token = {
  access_token: string;
  token_type: string;
  expires_in: number;
};
