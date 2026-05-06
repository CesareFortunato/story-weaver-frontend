import { useEffect } from "react";

function App() {

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/stories")
      .then(res => res.json())
      .then(data => console.log(data));
  }, []);

  return (
    <div>
      <h1>StoryWeaver</h1>
    </div>
  );
}

export default App;