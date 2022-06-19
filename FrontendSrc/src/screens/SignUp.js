import Form from "../components/Form";
import Banner from "../components/Banner";

import Register from "../pureJS/Register";

import { useState } from "react";

function savePassword(store, setErrorBanner) {
  const password = document.getElementById("password").value;
  if (!password.length) {
    setErrorBanner("Please enter a password first");
    return false;
  }
  store.addPassword(password);
  return true;
}

async function registerWithServer(props, setErrorBanner) {
  const pubKey = await Register.createKey(props.store);
  const resp = await Register.register(pubKey);
  if (typeof resp === "number") {
    setErrorBanner("There was an issue with the server, retry?");
    return;
  }
  props.setLogin(resp);
  props.setPage("home");
}

function SignUp(props) {
  const fields = [{
    inputId:         "password",
    isPassword:      true,
    placeholderText: "Create a Secure Passcode"
  }];

  const [errorBanner, setErrorBanner] = useState("");

  return (
    <>
      {errorBanner && <Banner message={errorBanner} />}
      <h3>Sign Up</h3>
      <Form
        submitFn={() =>
          savePassword(props.store, setErrorBanner) && registerWithServer(props, setErrorBanner)
        }
        fields={fields}
        buttonText="Sign Up"
      />
      <p>
        Already have an account? &nbsp;
        <span className="aref" onClick={() => props.setPage("login")}>Login</span>
      </p>
    </>
  );
}

export default SignUp;
