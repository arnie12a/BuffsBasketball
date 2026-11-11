function App() {
  const imagePath = `${import.meta.env.BASE_URL}visualizations/nil/big12_nil_height.png`;

  return (
    <div>
      <h1>Big 12 NIL Analysis</h1>

      <img
        src={imagePath}
        alt="Big 12 NIL spending vs average player height"
        style={{
          width: "100%",
          maxWidth: "1400px",
          height: "auto",
          display: "block",
          margin: "0 auto",
        }}
      />
    </div>
  );
}

export default App;