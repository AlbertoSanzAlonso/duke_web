import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

const ImageCropper = ({ image, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const handleCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const getCroppedImg = async () => {
        try {
            const canvas = document.createElement('canvas');
            const img = new Image();
            img.src = image;
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            const ctx = canvas.getContext('2d');
            const { x, y, width, height } = croppedAreaPixels;

            canvas.width = 800; // Standardize output size
            canvas.height = 800;

            ctx.drawImage(
                img,
                x, y, width, height,
                0, 0, 800, 800
            );

            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/webp', 0.85); // Save as WebP
            });
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const handleSave = async () => {
        const croppedBlob = await getCroppedImg();
        if (croppedBlob) {
            onCropComplete(croppedBlob);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 20000, display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', flex: 1 }}>
                <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    aspect={1} // Force square crop
                    onCropChange={onCropChange}
                    onZoomChange={onZoomChange}
                    onCropComplete={handleCropComplete}
                />
            </div>
            <div style={{ padding: '30px', background: '#111', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: '300px' }}>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(e.target.value)}
                        style={{ width: '100%', cursor: 'pointer' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '15px', width: '100%', maxWidth: '400px' }}>
                    <button 
                        onClick={onCancel}
                        style={{ flex: 1, padding: '15px', background: '#333', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        CANCELAR
                    </button>
                    <button 
                        onClick={handleSave}
                        style={{ flex: 2, padding: '15px', background: '#f03e3e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}
                    >
                        ✓ APLICAR CORTE
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
