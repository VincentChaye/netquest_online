import { useGame } from './game/GameContext.jsx';
import AccueilScreen from './screens/AccueilScreen.jsx';
import MaisonScreen from './screens/MaisonScreen.jsx';
import DnsScreen from './screens/DnsScreen.jsx';
import RouteurScreen from './screens/RouteurScreen.jsx';
import ServeurScreen from './screens/ServeurScreen.jsx';
import VictoireScreen from './screens/VictoireScreen.jsx';

export default function App() {
  const { state } = useGame();

  function ecranDeJeu() {
    switch (state.zone) {
      case 'dns':
        return <DnsScreen />;
      case 'routeur':
        return <RouteurScreen />;
      case 'serveur':
        return <ServeurScreen />;
      case 'fin':
        return <VictoireScreen />;
      default:
        return <MaisonScreen />;
    }
  }

  return (
    <div className="app">
      <div className="ciel" aria-hidden="true" />
      {state.screen === 'accueil' ? <AccueilScreen /> : ecranDeJeu()}
    </div>
  );
}
