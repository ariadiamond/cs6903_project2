import Header from "./components/Header";

import SignUp from "./screens/SignUp";
import Login from "./screens/Login";
import Home from "./screens/Home";
import CreateChannel from "./screens/CreateChannel";
import Channel from "./screens/Channel";

import './App.css';

import { useState } from "react";

function changePage(page) {
  switch(page) {
    case "signUp":
      return SignUp;
    case "login":
      return Login;
    case "home":
      return Home;
    case "createChannel":
      return CreateChannel;
    case "channel":
      return Channel;
    default:
      return <p>I don't know that page, sorry</p>;
  }
}

function App() {
  const [page, setPage] = useState("signUp");
  const PageComponent = changePage(page); 
  return (
    <div className="App">
      <Header setPage={setPage} />
      <div className="main-content">
        <PageComponent setPage={setPage} />
      </div>
    </div>
  );
}

export default App;
