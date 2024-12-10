import React, { useState, useRef, useEffect } from 'react';
import CameraComponent from '../components/CameraComponent';

const Home: React.FC = () => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const goodAudioRef = useRef<HTMLAudioElement | null>(null);
  const badAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleResult = (result: boolean | null) => {
    setIsValid(result);
  };

  useEffect(() => {
    try {
      if (isValid && goodAudioRef.current) {
        goodAudioRef.current.play();
      } else if (!isValid && badAudioRef.current) {
        badAudioRef.current.play();
      }
    } catch (error) {
      console.error('Expected onload error: ', error);
    }
  }, [isValid]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', position: 'relative' }}>
      <img
        src="primary_connect_logo.png"
        alt="Primary Connect Logo"
        style={{ padding: '10px', width: '200px', height: 'auto' }}
      />
      <h1>Pallet Inspector</h1>
      {isValid === true ? (
        <div>
          <img
            src="/tick.png"
            alt="Tick"
            style={{ width: '150px', height: '150px', marginBottom: '5px' }}
          />
          <audio ref={goodAudioRef}>
            <source src="/good.wav" type="audio/wav" />
          </audio>
        </div>
      ) : isValid === false ? (
        <div>
          <img
            src="/cross.png"
            alt="Cross"
            style={{ width: '150px', height: '150px', marginBottom: '5px' }}
          />
          <audio ref={badAudioRef}>
            <source src="/bad.wav" type="audio/wav" />
          </audio>
        </div>
      ) : null}
      <CameraComponent onResult={handleResult} />
{/*       <img
        src="/primary_connect_logo.png"
        alt="Primary Connect Logo"
        style={{ position: 'absolute', bottom: '10px', left: '10px', width: '100px', height: 'auto' }}
      /> */}
    </div>
  );
};

export default Home;