import { TextInput, CircleButton } from "../components/Input";

import "./screens.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faPaperPlane } from "@fortawesome/free-solid-svg-icons";

const messages = [
  {
    from: "aria",
    message: "Hiya bestie"
  },
  {
    from: "Gabi",
    message: "Hey Girlie"
  },
  {
    from: "aria",
    message: "How are you?"
  },
  {
    from: "Adam",
    message: "Hi besties girlbosses"
  }
];
const id = "aria";
const chat = "290";

function Message(props) {
  const isMyMsg = props.from === props.id;
  return (
    <div className={`message-line ${isMyMsg && "right"}`}>
      <div className={`message ${isMyMsg ? "sent" : "received"}`}>
        <h5 className="message-from">{props.from}</h5>
        <p className="message-text">{props.message}</p>
      </div>
    </div>
  );
}

function Channel(props) {
  return (
    <>
      <div className="title">
        <FontAwesomeIcon icon={faArrowLeftLong} className="fa" onClick={() => props.setPage("home")} />
        <h3>&nbsp; {chat}</h3>
      </div>
      <div className="channel">
        <div className="messages">
          {messages.map(message => 
            <Message key={message.from + message.message} {...message} id={id} />
          )}
        </div>
        <div className="send-message">
          <TextInput inputClass="draft" />
          <CircleButton icon={<FontAwesomeIcon icon={faPaperPlane} className="fa" />} buttonClass="send" />
        </div>
      </div>
    </>
  );
}

export default Channel;
