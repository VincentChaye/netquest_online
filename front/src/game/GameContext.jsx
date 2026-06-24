import { createContext, useContext, useReducer } from 'react';

// État global du jeu (simple, suffisant pour le mode solo).
const initialState = {
  screen: 'accueil', // 'accueil' | 'maison'
  quest: null,
  sessionId: null,
  zone: 'maison',
  tokens: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        screen: 'maison',
        quest: action.quest,
        sessionId: action.sessionId,
        zone: action.zone || 'maison',
        tokens: action.tokens || [],
      };
    case 'SYNC':
      return { ...state, zone: action.zone ?? state.zone, tokens: action.tokens ?? state.tokens };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame doit être utilisé dans un <GameProvider>');
  return ctx;
}
