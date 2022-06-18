import { TextInput, LongButton } from "./Input";

function Form(props) {
  return (
    <form 
      className={props.formClass}
      onSubmit={e => {e.preventDefault(); props.submitFn();}}
    >
      <div className="form-control">
        {props.fields.map(field => field.renderField
          ? <field.renderField key={field.inputId} />
          : <TextInput {...field} key={field.inputId} />
        )}
      </div>
      <LongButton
        buttonId="submitButton"
        text={props.buttonText}
      />
    </form>  
  );
}

export default Form;
