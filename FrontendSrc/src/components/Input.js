function TextInput(props) {
  const type = props.isPassword ? "password" : "text";
  return (
    <input
      id={props.inputId}
      className={props.inputClass}
      type={type}
      placeholder={props.placeholderText}
    />
  );
}

function LongButton(props) {
  return (
    <button
      id={props.buttonId}
      className={`long-button ${props.buttonClass}`}
      onClick={props.buttonClick}
    >
      {props.text}
    </button>
  );
}

function CircleButton(props) {
  return (
    <button
      id={props.buttonId}
      className={`circle-button ${props.buttonClass}`}
      onClick={props.buttonClick}
    >
      {props.icon}
    </button>
  );
}

export { TextInput, LongButton, CircleButton };
