import React, { useEffect, useRef, useState } from 'react';

type Props = { onDetected: (code: string) => void };

export default function CameraScanner({ onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDetected, setLastDetected] = useState<string | null>(null);
  const readerRef = useRef<any>(null);

  useEffect(() => {
    return () => stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startScanner() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      if ((window as any).BarcodeDetector) {
        const formats = ['ean_13','ean_8','upc_a','upc_e','code_128','code_39'];
        const detector = new (window as any).BarcodeDetector({ formats });
        let active = true;
        const scanLoop = async () => {
          if (!active) return;
          try {
            const barcodes = await detector.detect(videoRef.current!);
            if (barcodes && barcodes.length) {
              const code = barcodes[0].rawValue || barcodes[0].raw_text || barcodes[0].raw_value;
              setLastDetected(code);
              stopScanner();
              onDetected(code);
              return;
            }
          } catch (e) {
            console.error('BarcodeDetector detect error', e);
          }
          requestAnimationFrame(scanLoop);
        };
        scanLoop();
      } else {
        try {
          const ZXing = await import('@zxing/library');
          const codeReader = new ZXing.BrowserMultiFormatReader();
          readerRef.current = codeReader;
          codeReader.decodeFromVideoDevice(undefined, videoRef.current!, (result: any, err: any) => {
            if (result) {
              const code = result.getText();
              setLastDetected(code);
              stopScanner();
              onDetected(code);
            }
            // ignore not found errors
          });
        } catch (err) {
          console.error('ZXing fallback failed', err);
          setError('Camera scanning not supported in this browser.');
        }
      }
    } catch (err: any) {
      console.error('startScanner', err);
      setError(err?.message || 'Could not access camera.');
    }
  }

  function stopScanner() {
    setScanning(false);
    if (readerRef.current && readerRef.current.reset) {
      try { readerRef.current.reset(); } catch (e) { /* ignore */ }
      readerRef.current = null;
    }
    const video = videoRef.current;
    if (video && video.srcObject) {
      const tracks = (video.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      (video as HTMLVideoElement).srcObject = null;
    }
  }

  return (
    <div>
      <div>
        {!scanning ? (
          <button aria-pressed="false" aria-label="Start camera scanning" onClick={startScanner}>Start camera scan</button>
        ) : (
          <button aria-pressed="true" aria-label="Stop camera scanning" onClick={stopScanner}>Stop</button>
        )}
      </div>
      <div style={{ marginTop: 8 }}>
        <video ref={videoRef} style={{ width: '100%', maxHeight: 360 }} muted playsInline aria-label="Camera preview" />
        <div className="visually-hidden" aria-live="polite">{lastDetected ? `Scanned: ${lastDetected}` : ''}</div>
        {error && <div role="alert" style={{ color: 'red' }}>{error}</div>}
      </div>
    </div>
  );
}
