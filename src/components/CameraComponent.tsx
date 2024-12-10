import React, { useEffect, useRef, useState } from 'react';
import ProgressBar from './ProgressBar';

interface CameraComponentProps {
    onResult: (isValid: boolean | null) => void;
}

const CameraComponent: React.FC<CameraComponentProps> = ({ onResult }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
    const [isFrontFacing, setIsFrontFacing] = useState<boolean>(true);
    const [progress, setProgress] = useState<number>(0);
    const [responseText, setResponseText] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [error, setError] = useState<string>('');

    const startCamera = async (facingMode: 'user' | 'environment') => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                getLocation();
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode
                     } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsCameraActive(true);
                }
            } catch (error) {
                console.error('Error accessing the camera: ', error);
            }
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsCameraActive(false);
            setProgress(0);
            onResult(null);
            setResponseText('');
            setAddress('');
          
        }
    };

    const toggleCameraFacing = () => {
        stopCamera();
        setIsFrontFacing(!isFrontFacing);
        startCamera(isFrontFacing ? 'environment' : 'user');
    };

    const takePhoto = async () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setProgress(0);
                await sendPhotoToAPI(dataUrl);
                setProgress(100);
            }
        }

    };

    const sendPhotoToAPI = async (photo: string) => {
        setProgress(25);
        const response = await fetch('https://pallet-detector-api.azurewebsites.net/api/ProcessImageRequest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ photo }),
        });
        setProgress(50);
        const data = await response.json();
        console.log(data);
        setResponseText(data || 'No response message');
        setProgress(75);
        // create a regular expression to grab the barcode from the response
        // an example is Barcode found with value: 195410000048874426.
        const barcodeRegex = /Barcode found with value: (\d+)./;
        const match = data.match(barcodeRegex);
        // extract the barcode value from the match
        const barcode = match ? match[1] : '';
        console.log(barcode);
        // using the GetLocation Azure function to get the address bases on the barcode value
        const responseLocation = await fetch(`https://pallet-detector-api.azurewebsites.net/api/GetLocation?code=ByAFQlcEdJ56ZC2JFkaYeyQNl7OcJuaFHVNAR7hpo-R3AzFu6e54GQ%3D%3D&id=${barcode}`);
        const dataLocation = await responseLocation.json();
        console.log(dataLocation);
        var isValid = false; // Assuming the API response contains an isValid field
        if (dataLocation.address === address) {
            isValid = true;
        }
        onResult(isValid);
    };

    useEffect(() => {
        return () => {
            if (isCameraActive) {
                stopCamera();
            }
        };
    }, [isCameraActive]);

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, showError);
        } else {
            setError('Geolocation is not supported by this browser.');
        }
    };

    const showPosition = async (position: GeolocationPosition) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Use Azure Maps API to convert coordinates to a text address
        const response = await fetch(`https://atlas.microsoft.com/search/address/reverse/json?api-version=1.0&query=${lat},${lon}&subscription-key=BiGLDrNOuP5J5eYiMdaeAUB6hRlOGVlGSrZ6yhQGpEw8I4QI4xO3JQQJ99ALAC8vTInJ0deGAAAgAZMP3bLr`);
        const data = await response.json();

        if (data.addresses && data.addresses.length > 0) {
            const formattedAddress = data.addresses[0].address.freeformAddress;
            setAddress(formattedAddress);
        } else {
            setError('Unable to retrieve address.');
        }
    };

    const showError = (error: GeolocationPositionError) => {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                setError('User denied the request for Geolocation.');
                break;
            case error.POSITION_UNAVAILABLE:
                setError('Location information is unavailable.');
                break;
            case error.TIMEOUT:
                setError('The request to get user location timed out.');
                break;
        }
        console.error('Error getting location: ', error);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
           <div style={{ alignItems: 'center', justifyContent: 'center', marginTop: '10px', width: '320px', border: '1px solid black', padding: '10px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>Your Current Location:</h3>
                <p style={{ margin: '0', fontWeight: 'bold', color: '#333' }}>{address}</p>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </div>
            <video ref={videoRef} autoPlay playsInline style={{ width: '320px', height: '240px', border: '1px solid black' }} />
            <div style={{ marginTop: '10px', width: '320px' }}>
                <ProgressBar progress={progress} />
            </div>
            <div style={{ marginTop: '10px' }}>
                <button onClick={isCameraActive ? stopCamera : () => startCamera(isFrontFacing ? 'user' : 'environment')}>
                    {isCameraActive ? 'Stop Camera' : 'Start Camera'}
                </button>
                <button onClick={takePhoto} disabled={!isCameraActive} style={{ marginLeft: '10px' }}>
                    Take Photo
                </button>
                <button onClick={toggleCameraFacing} disabled={!isCameraActive} style={{ marginLeft: '10px' }}>
                    Swap {isFrontFacing ? 'Back' : 'Front'} Camera
                </button>
            </div>
            <div style={{ marginTop: '10px', width: '320px', border: '1px solid black', padding: '10px', borderRadius: '5px' }}>
                <textarea
                    id='responseTextField'
                    value={responseText}
                    readOnly
                    rows={10}
                    style={{ width: '100%', height: '100%', border: 'none', resize: 'none', backgroundColor: 'transparent' }}
                />
            </div>
        </div>
    );
};

export default CameraComponent;