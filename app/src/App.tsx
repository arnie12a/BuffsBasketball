import "./App.css";

function App() {
  return (
    <div>
      <header>
        <h1>College Basketball</h1>
      </header>

      <main>
        <section>
        <img
          src={`${import.meta.env.BASE_URL}visualizations/nil/big12_nil_height.png`}
          alt="Big 12 NIL Spending vs Player Height"
          style={{
            width: "100%",
            maxWidth: "1400px",
            height: "auto"
          }}
        />
        </section>
      </main>
    </div>
  );
}

export default App;