import { useGameLoop } from './hooks/useGameLoop';
import { useGameStore } from './stores/gameStore';
import { TownScreen, WorldMapScreen, CombatScreen, CharacterScreen } from './screens';
import { CombatMiniPanel } from './components';
import './App.css';

function App() {
  useGameLoop();

  const currentScreen = useGameStore(state => state.currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'town':
        return <TownScreen />;
      case 'worldMap':
        return <WorldMapScreen />;
      case 'combat':
        return <CombatScreen />;
      case 'character':
        return <CharacterScreen />;
      default:
        return <TownScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {renderScreen()}
      {/* Mini panel shows when combat is active but viewing another screen */}
      <CombatMiniPanel />
    </div>
  );
}

export default App;
