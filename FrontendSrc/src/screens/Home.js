import { LongButton } from "../components/Input.js";

const chats = ["290", "1190", "3924"];

function Home(props) {
  return (
    <>
      <h3>Welcome</h3>
      {chats.map(chat => <LongButton key={chat} text={chat} buttonClick={() => props.setPage("channel")}/>)}
      <LongButton text="Add Chat" buttonClick={() => props.setPage("createChannel")} />
    </>
  );
}

export default Home;
