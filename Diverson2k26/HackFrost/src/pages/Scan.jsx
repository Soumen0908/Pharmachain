import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Camera, Square, Search, Keyboard, Upload, Image, CheckCircle2, Loader2, X } from 'lucide-react';
import './Scan.css';

export default function Scan() {
    const navigate = useNavigate();
    const [scanning, setScanning] = useState(false);
    const [manualId, setManualId] = useState('');
    const [error, setError] = useState('');
    const [scannerRef, setScannerRef] = useState(null);
    const videoRef = useRef(null);

    // Upload QR state
    const [uploadPreview, setUploadPreview] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    async function startCamera() {
        setScanning(true);
        setError('');
        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const scanner = new Html5Qrcode('qr-reader');
            setScannerRef(scanner);

            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    // QR codes hold the scratch code value
                    scanner.stop().catch(() => { });
                    setScanning(false);
                    const scratchCode = decodedText.trim();
                    navigate(`/verify?scratch=${encodeURIComponent(scratchCode)}`);
                },
                () => { }
            );
        } catch (err) {
            setError('Camera access denied or not available. Try entering the batch ID manually.');
            setScanning(false);
        }
    }

    function stopCamera() {
        if (scannerRef) {
            scannerRef.stop().catch(() => { });
        }
        setScanning(false);
    }

    function handleManualVerify() {
        if (manualId.trim()) {
            navigate(`/verify?batch=${encodeURIComponent(manualId.trim())}`);
        }
    }

    // ── Upload QR handlers ──
    function handleFileSelect(e) {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    }

    function processFile(file) {
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file (PNG, JPG, etc.)');
            return;
        }
        setUploadFile(file);
        setUploadResult(null);
        setError('');
        const reader = new FileReader();
        reader.onload = (e) => setUploadPreview(e.target.result);
        reader.readAsDataURL(file);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZoneRef.current?.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZoneRef.current?.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZoneRef.current?.classList.remove('drag-over');
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    }

    function clearUpload() {
        setUploadFile(null);
        setUploadPreview(null);
        setUploadResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function decodeUploadedQR() {
        if (!uploadFile) return;
        setUploadLoading(true);
        setUploadResult(null);
        setError('');
        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const scanner = new Html5Qrcode('qr-upload-reader', /* verbose */ false);
            const decodedText = await scanner.scanFile(uploadFile, /* showImage */ false);
            scanner.clear();

            // QR codes hold the scratch code value
            const scratchCode = decodedText.trim();
            setUploadResult({ success: true, scratchCode, raw: decodedText });
        } catch (err) {
            console.error('QR decode error:', err);
            setUploadResult({ success: false, error: 'Could not detect a valid QR code in this image. Please try a clearer image.' });
        } finally {
            setUploadLoading(false);
        }
    }

    useEffect(() => {
        return () => {
            if (scannerRef) scannerRef.stop().catch(() => { });
        };
    }, [scannerRef]);

    return (
        <div className="page">
            <div className="page-header" style={{ textAlign: 'center' }}>
                <h1 className="page-title">Scan Medicine</h1>
                <p className="page-subtitle">Scan the QR code on your medicine packaging to verify authenticity</p>
            </div>

            <div className="scan-container">
                {/* Camera Scanner */}
                <div className="scanner-section glass-card animate-fade-up">
                    <div className="scanner-frame">
                        <div id="qr-reader" className={`qr-reader ${scanning ? 'active' : ''}`}></div>
                        {!scanning && (
                            <div className="scanner-placeholder">
                                <QrCode size={48} strokeWidth={1} style={{ opacity: 0.2, marginBottom: 12 }} className="animate-float" />
                                <p>Tap to activate camera scanner</p>
                            </div>
                        )}
                        <div className="scanner-corners">
                            <span className="corner tl"></span>
                            <span className="corner tr"></span>
                            <span className="corner bl"></span>
                            <span className="corner br"></span>
                        </div>
                    </div>

                    <div className="scanner-actions">
                        {!scanning ? (
                            <button className="btn btn-primary btn-lg" onClick={startCamera}>
                                <Camera size={18} /> Start Camera Scan
                            </button>
                        ) : (
                            <button className="btn btn-secondary btn-lg" onClick={stopCamera}>
                                <Square size={16} /> Stop Scanning
                            </button>
                        )}
                    </div>

                    {error && <div className="form-error" style={{ marginTop: '12px' }}>{error}</div>}
                </div>

                {/* Manual Entry */}
                <div className="manual-section glass-card animate-fade-up" style={{ animationDelay: '0.15s' }}>
                    <h3><Keyboard size={16} /> Or Enter Manually</h3>
                    <p>Type the batch ID printed on the medicine packaging</p>
                    <div className="manual-form">
                        <input
                            className="input-field"
                            placeholder="e.g. PCM-2026-001"
                            value={manualId}
                            onChange={e => setManualId(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleManualVerify()}
                        />
                        <button className="btn btn-primary" onClick={handleManualVerify}>
                            <Search size={16} /> Verify
                        </button>
                    </div>
                </div>

                {/* Upload QR Code */}
                <div className="upload-section glass-card animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <h3><Upload size={16} /> Upload QR Code Image</h3>
                    <p>Upload a photo or screenshot of the QR code from the medicine packaging to extract the scratch code</p>

                    <div
                        ref={dropZoneRef}
                        className={`upload-dropzone ${uploadPreview ? 'has-file' : ''}`}
                        onClick={() => !uploadPreview && fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />

                        {!uploadPreview ? (
                            <div className="dropzone-placeholder">
                                <Image size={40} strokeWidth={1} />
                                <p>Drag & drop QR image here</p>
                                <span>or click to browse files</span>
                                <span className="dropzone-formats">PNG, JPG, WEBP supported</span>
                            </div>
                        ) : (
                            <div className="dropzone-preview">
                                <button className="preview-clear" onClick={(e) => { e.stopPropagation(); clearUpload(); }}>
                                    <X size={14} />
                                </button>
                                <img src={uploadPreview} alt="QR Preview" />
                            </div>
                        )}
                    </div>

                    {/* Hidden element for html5-qrcode scanFile */}
                    <div id="qr-upload-reader" style={{ display: 'none' }}></div>

                    {uploadPreview && (
                        <div className="upload-actions">
                            <button className="btn btn-primary" onClick={decodeUploadedQR} disabled={uploadLoading}>
                                {uploadLoading ? (
                                    <><Loader2 size={16} className="spin" /> Decoding...</>
                                ) : (
                                    <><QrCode size={16} /> Decode & Verify</>
                                )}
                            </button>
                            <button className="btn btn-secondary" onClick={clearUpload}>
                                <X size={16} /> Clear
                            </button>
                        </div>
                    )}

                    {uploadResult && uploadResult.success && (
                        <div className="upload-result success">
                            <CheckCircle2 size={18} />
                            <div>
                                <strong>QR Code Detected!</strong>
                                <p>Scratch Code: <code>{uploadResult.scratchCode}</code></p>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={() => navigate(`/verify?scratch=${encodeURIComponent(uploadResult.scratchCode)}`)}>
                                Verify Now →
                            </button>
                        </div>
                    )}

                    {uploadResult && !uploadResult.success && (
                        <div className="upload-result error">
                            <X size={18} />
                            <div>
                                <strong>Decode Failed</strong>
                                <p>{uploadResult.error}</p>
                            </div>
                            <button className="btn btn-secondary btn-sm" onClick={clearUpload}>
                                Try Again
                            </button>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="scan-instructions glass-card animate-fade-up" style={{ animationDelay: '0.35s' }}>
                    <h3>How to Verify</h3>
                    <div className="instruction-steps">
                        <div className="instruction-step">
                            <span className="step-num">1</span>
                            <div>
                                <strong>Scan or Upload QR Code</strong>
                                <p>Point your camera at the QR code or upload a photo — the QR contains the scratch code</p>
                            </div>
                        </div>
                        <div className="instruction-step">
                            <span className="step-num">2</span>
                            <div>
                                <strong>Enter Batch ID</strong>
                                <p>Type the batch ID printed on the medicine box on the Verify page</p>
                            </div>
                        </div>
                        <div className="instruction-step">
                            <span className="step-num">3</span>
                            <div>
                                <strong>Activate with Scratch Code</strong>
                                <p>The scratch code from the QR is auto-filled — verify to claim ownership</p>
                            </div>
                        </div>
                        <div className="instruction-step">
                            <span className="step-num">4</span>
                            <div>
                                <strong>Earn Rewards</strong>
                                <p>Get points for verifying — help fight counterfeit drugs!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
