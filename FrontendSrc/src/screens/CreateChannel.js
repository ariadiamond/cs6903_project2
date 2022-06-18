import Form from "../components/Form";
import { LongButton } from "../components/Input";

import "./screens.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faXmark } from "@fortawesome/free-solid-svg-icons";

function MemberList(props) {
  return (
    <div className="member-list">
      {props.members.map(member =>
        <div key={member} className="member-item" >
          {member}
          &nbsp; <FontAwesomeIcon icon={faXmark} className="fa left-padding" />
        </div>
      )}
    </div>
  );
}

const members = ["aria", "tony", "vant"];

function CreateChannel(props) {
  
  const fields = [
    {
      inputId: "newMember",
      placeholderText: "Enter Participant Cryptik ID"
    },
    {
      inputId: "includedMembers",
      renderField: () => (
        <div>
          <LongButton text="Add Member to Channel" />
          <MemberList members={members} />
        </div>
      )
    }
  ];
  return (
    <>
      <FontAwesomeIcon
        icon={faXmark}
        className="top-right fa"
        onClick={() => props.setPage("home")}
      />
      <h3>
        <FontAwesomeIcon icon={faUserPlus} />
        &nbsp; Create Cryptik Channel
      </h3>
      <Form
        fields={fields}
        buttonText="Create"
        submitFn={() => props.setPage("home")}
      />
    </>
  );
}

export default CreateChannel;
