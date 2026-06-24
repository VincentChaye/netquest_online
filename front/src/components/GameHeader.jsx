import { useGame } from '../game/GameContext.jsx';
import TokenBar from './TokenBar.jsx';

// En-tête commun à toutes les zones de jeu : marque + parcours + quitter.
export default function GameHeader() {
  const { state, dispatch } = useGame();
  return (
    <header className="jeu-tete">
      <span className="marque">Net<span>Quest</span></span>
      <TokenBar tokens={state.tokens} zone={state.zone} />
      <button className="btn-fantome" onClick={() => dispatch({ type: 'RESET' })}>
        ↺ Changer d'aventure
      </button>
    </header>
  );
}
