import { LongButton } from "./Input.js";

import "./components.css";

function Header(props) {
  const isLoggedIn = props.login?.id !== undefined && props.login?.token !== undefined;
  return (
    <div className="header">
      <div className="left-group">
        <h1 className="brand">Cryptik</h1>
      </div>
      <div className="right-group">
        {isLoggedIn && <LongButton
          text="Log Out"
          buttonClick={() => {
            props.logout();
            props.setPage("login");
          }}
          buttonClass="log-out"
        />}
      </div>
    </div>
  );
}

export default Header;
