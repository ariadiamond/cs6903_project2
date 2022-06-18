import Form from "../components/Form";

function Login(props) {
  const fields = [
    {
      inputId: "cryptikId",
      placeholderText: "Enter Cryptik ID"
    },
    {
      inputId: "password",
      isPassword: true,
      placeholderText: "Enter Passcode"      
    }
  ];
  
  return (
    <>
      <h3>Login</h3>
      <Form submitFn={() => props.setPage("home")} fields={fields} buttonText="Login" />
      <p>
        Don't have an account? &nbsp;
        <span className="aref" onClick={() => props.setPage("signUp")}>Sign Up</span>
      </p>
    </>
  );
}

export default Login;
