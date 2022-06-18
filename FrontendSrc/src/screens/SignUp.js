import Form from "../components/Form";

function SignUp(props) {
  const fields = [{
    inputId:         "password",
    isPassword:      true,
    placeholderText: "Create a Secure Passcode"
  }];

  return (
    <>
      <h3>Sign Up</h3>
      <Form submitFn={() => props.setPage("home")} fields={fields} buttonText="Sign Up" />
      <p>
        Already have an account? &nbsp;
        <span className="aref" onClick={() => props.setPage("login")}>Login</span>
      </p>
    </>
  );
}

export default SignUp;
