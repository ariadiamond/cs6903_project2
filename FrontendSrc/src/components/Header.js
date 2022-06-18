import { LongButton } from "./Input.js";

import "./components.css";

function Header(props) {
  return (
    <div className="header">
      <div className="left-group">
        <h1 className="brand">Cryptik</h1>
      </div>
      <div className="right-group">
        <LongButton text="Log Out" buttonClick={() => props.setPage("login")} buttonClass="log-out" />
      </div>
    </div>
  );
}

export default Header;
