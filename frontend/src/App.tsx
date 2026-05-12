import './App.css'
import { StoreProvider } from "./app/providers/StoreProvider";
import { AppRouter } from "./app/router";

function App() {
  return (
      <StoreProvider>
        <AppRouter />
      </StoreProvider>
  );
}

export default App;