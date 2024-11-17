let tl = gsap.timeline();
//start preloader gsap animation
tl.to("body", {
  overflow: "hidden",
})
  .to(".preloader .text-container", {
    duration: 0,
    opacity: 1,
    ease: "Power3.easeOut"
  })
  .from("#logo-img", {
    x: -200,
    duration: 0.5,
    scale: 0.5,
    opacity: 0
  }, "sametime")
  .from(".preloader .text-container h1", {
    duration: 1.5,
    delay: 0.2,
    y: 300,
    skewY: 10,
    stagger: 0.4,
    ease: "Power3.easeOut",
    text: "Welcome to the Doctor's Appointment Portal"
  }, "sametime")
  .to(".preloader .text-container h1", {
    duration: 1.2,
    y: 300,
    skewY: -25,
    delay: 2,
    ease: "Power3.easeOut"
  })
  .to("#logo-img", {
    duration: 0.5,
    x: -200,
    opacity: 0,
    scale: 0.5
  })
  .to(".preloader", {
    duration: 1,
    height: "0vh",
    ease: "Power3.easeOut"
  })
  .to(
    "body",
    {
      overflow: "auto"
    },
    "-=1"
  )
  .to(".preloader", {
    display: "none",
  });
//end gsap preloader animation 

tl.from("#logo", {
  opacity: 0,
  // rotation:360,
  y: -50,
  scale: 0,
  transformOrigin: "50% 50%",
  duration: 1,
  ease: "back(4)",
})
tl.from("#nav-item li", {
  opacity: 0,
  y: -50,
  scale: 0,
  transformOrigin: "50% 50%",
  duration: 1,
  ease: "back(4)",
  stagger: 0.2
}, "-=1")
tl.from("#mode", {
  opacity: 0,
  y: -50,
  scale: 0,
  transformOrigin: "50% 50%",
  duration: 0.8,
  ease: "back(4)",
}, "-=0.5")
tl.from("#help", {
  opacity: 0,
  y: -50,
  duration: 0.8,
  ease: "back(4)",
  scale: 0,
  transformOrigin: "50% 50%",
}, "-=0.5")

const help = document.getElementById("help");
const scaleTween = gsap.to(help, { scale: 1.2, repeat: -1, yoyo: true, paused: true });

help.addEventListener("mouseenter", () => scaleTween.restart())

help.addEventListener("mouseleave", () => {
  scaleTween.pause()
  //create a new tween to return to normal size smoothly
  gsap.to(help, { scale: 1 })
})

const mode = document.getElementById("mode");
mode.addEventListener("click", () => {
  if (mode.className === "ri-sun-fill") {
    mode.className = "ri-moon-fill";
    document.body.style.backgroundColor = "black";
  } else {
    mode.className = "ri-sun-fill";
    document.body.style.backgroundColor = "#f7fcff";
  }
});