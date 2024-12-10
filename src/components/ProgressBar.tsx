import React from 'react';

interface ProgressBarProps {
    progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
    return (
        <div style={{ width: '100%', backgroundColor: '#e0e0df', borderRadius: '5px', overflow: 'hidden', position: 'relative', height: '50px' }}>
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    backgroundImage: 'url(/truck.png)',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: `${progress}% center`,
                    backgroundSize: '50px 50px',
                    transition: 'background-position 0.3s ease-in-out',
                }}
            />
        </div>
    );
};

export default ProgressBar;