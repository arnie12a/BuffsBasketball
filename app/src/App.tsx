import "./App.css";

function App() {
  return (
    <div>
      <header>
        <h1>College Basketball</h1>
      </header>

      <main>
        <section>
          <h2>Big 12 NIL Analysis</h2>


          <img
            src={`${import.meta.env.BASE_URL}visualizations/nil/big12_nil_height.png`}
            alt="Big 12 NIL spending vs average height of top eight contributing players"
            className="analysis-image"
          />
        </section>
      </main>
    </div>
  );
}

export default App;