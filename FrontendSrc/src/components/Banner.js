function Banner(props) {
  return (
    <div className="banner">
      {props.icon}
      {props.message}
    </div>
  );
}

export default Banner;
