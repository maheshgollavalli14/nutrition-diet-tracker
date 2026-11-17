import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

export function useBarcodeScanner({ onDetected }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const readerRef = useRef(null);
  const streamRef = useRef(null);
  const detectedRef = useRef(onDetected);
  detectedRef.current = onDetected;

  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [cameraError, setCameraError] = useState('');

  const stopScanning = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {
      // Ignore controls stop cleanup warnings
    }
    controlsRef.current = null;

    if (streamRef.current) {
      const tracks = streamRef.current.getTracks?.() || [];
      tracks.forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks?.() || [];
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  const startScanning = useCallback(
    async (explicitDeviceId = null) => {
      setCameraError('');
      stopScanning();

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera access is not supported in this browser or context. Enter the barcode manually.');
        return;
      }

      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        setCameras(devices);

        const targetId =
          explicitDeviceId ||
          selectedDeviceId ||
          devices.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ||
          devices[0]?.deviceId ||
          undefined;

        if (targetId && !selectedDeviceId) {
          setSelectedDeviceId(targetId);
        }

        // Configure reader with EAN-13, EAN-8, UPC-A, UPC-E and TRY_HARDER for tilted barcodes
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.UPC_EAN_EXTENSION,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 150,
          delayBetweenScanSuccess: 500,
        });
        readerRef.current = reader;

        // Ensure video is visible in DOM
        setScanning(true);

        // Request camera stream with clear resolution constraints
        const videoConstraints = targetId
          ? { deviceId: { exact: targetId } }
          : { facingMode: { ideal: 'environment' } };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            ...videoConstraints,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          },
          audio: false,
        });
        streamRef.current = stream;

        const videoEl = videoRef.current;
        if (!videoEl) {
          throw new Error('Video element is not available.');
        }

        videoEl.srcObject = stream;
        videoEl.setAttribute('playsinline', 'true');
        videoEl.setAttribute('muted', 'true');
        await videoEl.play();

        // Wait for video readiness so capture canvas receives valid dimensions
        await new Promise((resolve) => {
          if (videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
            return resolve();
          }
          const onReady = () => {
            if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
              videoEl.removeEventListener('loadeddata', onReady);
              videoEl.removeEventListener('playing', onReady);
              resolve();
            }
          };
          videoEl.addEventListener('loadeddata', onReady);
          videoEl.addEventListener('playing', onReady);
          setTimeout(resolve, 1000); // safety fallback
        });

        // Start continuous decoding from the active stream and ready video element
        const controls = await reader.decodeFromStream(
          stream,
          videoEl,
          (result) => {
            if (result) {
              const text = result.getText();
              stopScanning();
              if (detectedRef.current) {
                detectedRef.current(text);
              }
            }
          }
        );

        controlsRef.current = controls;
      } catch (err) {
        stopScanning();
        if (err?.name === 'NotAllowedError') {
          setCameraError('Camera permission was denied. Allow camera access or enter the barcode manually.');
        } else if (err?.name === 'NotFoundError') {
          setCameraError('No camera device found on this machine. Enter the barcode manually below.');
        } else {
          setCameraError(err?.message || 'Unable to start camera scanner. Enter the barcode manually.');
        }
      }
    },
    [selectedDeviceId, stopScanning]
  );

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    videoRef,
    scanning,
    cameras,
    selectedDeviceId,
    setSelectedDeviceId,
    cameraError,
    startScanning,
    stopScanning,
  };
}
