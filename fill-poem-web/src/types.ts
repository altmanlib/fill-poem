export type RouteName = 'loading' | 'home' | 'rules' | 'stage' | 'combine' | 'intro' | 'lottery' | 'lead';

export type TransitionName = 'fade' | 'revealBurst';

export interface Store<T> {
  get: () => T;
  set: (patch: Partial<T>) => void;
  subscribe: (fn: (state: T) => void) => () => void;
}

export interface AppState {
  /** Zero-based index of the stage being played (0..3). */
  stage: number;
  /** Number of national-treasure gold badges collected (0..4). */
  badges: number;
  /** Remaining lottery chances (client-side until the ledger API lands, R016). */
  chances: number;
}

export interface PageContext {
  store: Store<AppState>;
  go: (name: RouteName, opts?: { transition?: TransitionName; data?: unknown }) => Promise<void>;
  data?: unknown;
}

export interface PageInstance {
  el: HTMLElement;
  enter?: () => void | Promise<void>;
  leave?: () => void | Promise<void>;
  /** System back key / gesture. Without it the press is swallowed and the user stays on the page. */
  back?: () => void;
  destroy?: () => void;
}

export type PageFactory = (ctx: PageContext) => PageInstance;
