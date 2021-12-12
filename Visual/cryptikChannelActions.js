const message = document.querySelectorAll(".message");
let delay = 0;
message.forEach(el=>{
  el.style.animation = "fade-in 1s ease forwards";
  el.style.animationDelay= delay +"s";
  delay += 0.33;
});
