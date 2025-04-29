import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import styled from "@emotion/styled";

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const splashRef = useRef<HTMLDivElement>(null);
  const bubblesRef = useRef<HTMLDivElement[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!splashRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Initial floating bubbles
    bubblesRef.current.forEach((bubble, i) => {
      gsap.set(bubble, { y: 20, opacity: 0 });
      tl.to(bubble, { 
        y: -10 + Math.random() * 20,
        x: -5 + Math.random() * 10,
        opacity: 1,
        duration: 1,
        delay: i * 0.2,
      }, 0);
    });

    // Logo animation
    tl.from(".logo", { 
      scale: 0.8, 
      opacity: 0, 
      duration: 1.2,
      ease: "elastic.out(1, 0.5)"
    }, 0.5);

    // Progress bar fill
    tl.to(progressRef.current, {
      width: "100%",
      duration: 2,
      ease: "sine.inOut",
    }, 1);

    // Background gradient shift
    tl.to(splashRef.current, {
      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      duration: 2,
    }, 0);

    // Exit animation
    tl.to(splashRef.current, {
      opacity: 0,
      duration: 0.5,
      onComplete,
    }, 3);
  }, [onComplete]);

  return (
    <SplashContainer ref={splashRef}>
      <Logo className="logo">💬</Logo>
      
      {/* Floating Bubbles */}
      {[...Array(5)].map((_, i) => (
        <Bubble
          key={i}
          ref={(el) => {
            if (el) {
              bubblesRef.current[i] = el;
            }
          }}
          style={{ 
            left: `${10 + Math.random() * 80}%`,
            top: `${30 + Math.random() * 40}%`,
            width: `${20 + Math.random() * 30}px`,
            height: `${20 + Math.random() * 30}px`,
          }}
        />
      ))}

      <ProgressBar>
        <ProgressFill ref={progressRef} />
      </ProgressBar>

      <LoadingText>Connecting you to the world...</LoadingText>
    </SplashContainer>
  );
};

// Styled Components (Emotion)
const SplashContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow: hidden;
`;

const Logo = styled.div`
  font-size: 80px;
  margin-bottom: 30px;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.1));
`;

const Bubble = styled.div`
  position: absolute;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  filter: blur(2px);
  will-change: transform;
`;

const ProgressBar = styled.div`
  width: 70%;
  max-width: 300px;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  margin: 20px 0;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: 0;
  background: white;
  border-radius: 3px;
  will-change: width;
`;

const LoadingText = styled.div`
  color: white;
  font-size: 14px;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

export default SplashScreen;