import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Camera, Square, Search, Keyboard, Upload, Image, CheckCircle2, Loader2, X, Lock, Unlock, Clock, AlertTriangle, ShieldAlert, FlaskConical, PartyPopper, RotateCcw, XCircle } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { verifyScratchCode, verifyBatch as serverVerifyBatch } from '../services/api';
import { calculateReward } from '../services/rewardEngine';
import { addRewardPoints, getRewards } from '../services/offChainStore';
import ScratchCard from '../components/ScratchCard';
import './Scan.css';

export default function Scan() {
    const navigate = useNavigate();
    const { contract, account, isConnected, truncateAddress } = useWeb3();
    const { user, isAuthenticated } = useAuth();
    const toast = useToast();
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

    // Physical Authentication state
    const [scratchInput, setScratchInput] = useState('');
    const [batchForActivation, setBatchForActivation] = useState('');
    const [activationLoading, setActivationLoading] = useState(false);
    const [activationError, setActivationError] = useState('');
    const [activationResult, setActivationResult] = useState(null);
    const [alreadyActivated, setAlreadyActivated] = useState(null);

    // Success popup state
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successData, setSuccessData] = useState(null);

    function resetActivationForm() {
        setScratchInput('');
        setBatchForActivation('');
        setActivationResult(null);
        setActivationError('');
        setAlreadyActivated(null);
        setShowSuccessPopup(false);
        setSuccessData(null);
    }

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
                    scanner.stop().catch(() => { });
                    setScanning(false);
                    // Parse QR JSON: { batchNumber, scratchCode }
                    try {
                        const data = JSON.parse(decodedText.trim());
                        if (data.scratchCode) setScratchInput(data.scratchCode);
                        if (data.batchNumber) setBatchForActivation(data.batchNumber);
                        // Scroll to activation section
                        setTimeout(() => document.querySelector('.activation-section')?.scrollIntoView({ behavior: 'smooth' }), 200);
                    } catch {
                        // Fallback: treat entire text as scratch code
                        setScratchInput(decodedText.trim());
                        setTimeout(() => document.querySelector('.activation-section')?.scrollIntoView({ behavior: 'smooth' }), 200);
                    }
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

            // Parse QR JSON: { batchNumber, scratchCode }
            let scratchCode = decodedText.trim();
            let batchNumber = '';
            try {
                const data = JSON.parse(decodedText.trim());
                if (data.scratchCode) scratchCode = data.scratchCode;
                if (data.batchNumber) batchNumber = data.batchNumber;
            } catch {
                // Fallback: treat entire text as scratch code
            }
            setUploadResult({ success: true, scratchCode, batchNumber, raw: decodedText });
        } catch (err) {
            console.error('QR decode error:', err);
            setUploadResult({ success: false, error: 'Could not detect a valid QR code in this image. Please try a clearer image.' });
        } finally {
            setUploadLoading(false);
        }
    }

    // Cancel controller for MetaMask transactions
    const abortRef = useRef(null);

    function handleCancelActivation() {
        if (abortRef.current) abortRef.current.cancelled = true;
        setActivationLoading(false);
        setActivationError('Activation cancelled by user.');
    }

    // ── Physical Authentication (Scratch Code Activation) ──
    async function handleActivate() {
        if (!scratchInput) { setActivationError('Enter the scratch code from the medicine packaging'); return; }
        if (!batchForActivation) { setActivationError('Enter the Batch ID first'); return; }

        setActivationLoading(true);
        setActivationError('');
        setActivationResult(null);
        setAlreadyActivated(null);

        const cancelToken = { cancelled: false };
        abortRef.current = cancelToken;

        function showSuccess(result) {
            setActivationResult(result);
            setSuccessData({
                batchId: batchForActivation,
                scratchCode: scratchInput,
                firstActivation: result.firstActivation,
                reward: result.reward || null,
                timestamp: new Date().toLocaleString(),
            });
            setShowSuccessPopup(true);
            toast.success('Product activated successfully!');
        }

        // If wallet is connected, try MetaMask transaction first
        if (contract && isConnected) {
            try {
                const { ethers } = await import('ethers');
                const batchHash = ethers.keccak256(ethers.toUtf8Bytes(batchForActivation));
                const tx = await contract.activateProduct(batchHash, scratchInput);

                if (cancelToken.cancelled) return;

                await tx.wait();

                if (cancelToken.cancelled) return;

                const updatedDetails = await contract.getBatchDetails(batchHash);
                const isFirst = updatedDetails[6].toLowerCase() === account.toLowerCase();

                let result;
                if (isFirst) {
                    const reward = calculateReward(true, 0);
                    addRewardPoints(account, reward.points, 'First product activation');
                    result = { firstActivation: true, reward };
                } else {
                    result = { firstActivation: false };
                }

                showSuccess(result);
                setActivationLoading(false);
                return;
            } catch (err) {
                if (cancelToken.cancelled) return;
                console.warn('MetaMask activation failed, trying server fallback:', err.message);
                if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
                    setActivationError('Transaction rejected in MetaMask.');
                    setActivationLoading(false);
                    return;
                }
                if (err.reason?.includes('Already activated')) {
                    setAlreadyActivated({ by: 'another user' });
                    setActivationLoading(false);
                    return;
                }
                if (err.reason?.includes('Invalid scratch code')) {
                    setActivationError('Invalid scratch code! This may be a counterfeit product.');
                    setActivationLoading(false);
                    return;
                }
                if (err.reason?.includes('not yet inspector-approved')) {
                    setActivationError('Product is not yet inspector-approved for sale.');
                    setActivationLoading(false);
                    return;
                }
            }
        }

        // Server API fallback
        try {
            const result = await verifyScratchCode(batchForActivation, scratchInput);
            if (cancelToken.cancelled) return;
            const activResult = {
                firstActivation: result.firstActivation,
                reward: result.firstActivation ? calculateReward(true, 0) : null,
            };
            showSuccess(activResult);
        } catch (err) {
            if (!cancelToken.cancelled) setActivationError(err.message || 'Activation failed');
        } finally { if (!cancelToken.cancelled) setActivationLoading(false); }
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
                                {uploadResult.batchNumber && <p>Batch: <code>{uploadResult.batchNumber}</code></p>}
                                <p>Scratch Code: <code>{uploadResult.scratchCode}</code></p>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={() => {
                                setScratchInput(uploadResult.scratchCode);
                                if (uploadResult.batchNumber) setBatchForActivation(uploadResult.batchNumber);
                                document.querySelector('.activation-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}>
                                Use for Activation →
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

                {/* Physical Authentication — Scratch Code */}
                <div className="activation-section glass-card animate-fade-up" style={{ animationDelay: '0.25s' }}>
                    <div className="activation-section-header">
                        <div className="activation-section-icon"><FlaskConical size={18} /></div>
                        <div>
                            <h3><Lock size={16} /> Physical Authentication</h3>
                            <p>Enter the batch ID and scratch code from the medicine packaging to activate &amp; claim ownership</p>
                        </div>
                    </div>

                    {alreadyActivated ? (
                        <div className="activation-already">
                            <AlertTriangle size={14} /> Product already activated.
                            <div className="activation-warning-inline">
                                <ShieldAlert size={14} /> This product was activated by another address. This may indicate a <strong>counterfeit</strong>.
                            </div>
                        </div>
                    ) : (
                        <div className="activation-form-row">
                            <input
                                className="input-field"
                                placeholder="Batch ID (e.g. PCM-2026-001)"
                                value={batchForActivation}
                                onChange={e => setBatchForActivation(e.target.value)}
                                disabled={activationLoading}
                            />
                            <input
                                className="input-field"
                                placeholder="Scratch code from packaging"
                                value={scratchInput}
                                onChange={e => setScratchInput(e.target.value.toUpperCase())}
                                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.15em' }}
                                disabled={activationLoading}
                            />
                            <button className="btn btn-primary" onClick={handleActivate} disabled={activationLoading}>
                                {activationLoading ? <><Loader2 size={14} className="spin" /> Activating...</> : <><Unlock size={14} /> Activate</>}
                            </button>
                            {activationLoading && (
                                <button className="btn btn-danger" onClick={handleCancelActivation} title="Cancel activation">
                                    <XCircle size={14} /> Cancel
                                </button>
                            )}
                        </div>
                    )}

                    {activationError && <div className="form-error" style={{ marginTop: '10px' }}>{activationError}</div>}

                    {activationResult && (
                        <div style={{ marginTop: '16px' }}>
                            <ScratchCard
                                isFirstActivation={activationResult.firstActivation}
                                reward={activationResult.reward}
                                onComplete={() => { }}
                            />
                            <button className="btn btn-secondary" onClick={resetActivationForm} style={{ marginTop: '12px', width: '100%' }}>
                                <RotateCcw size={14} /> Activate Another Batch
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
                                <p>Enter the batch ID and scratch code below to activate &amp; claim product ownership</p>
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

            {/* Success Popup Modal */}
            {showSuccessPopup && successData && (
                <div className="success-popup-overlay" onClick={() => { }}>
                    <div className="success-popup-modal animate-fade-up" onClick={e => e.stopPropagation()}>
                        <div className="success-popup-icon">
                            <PartyPopper size={48} />
                        </div>
                        <h2 className="success-popup-title">Transaction Complete!</h2>
                        <p className="success-popup-subtitle">
                            {successData.firstActivation
                                ? 'You are the first to activate this product. Congratulations!'
                                : 'Product has been verified and activated successfully.'}
                        </p>

                        <div className="success-popup-details">
                            <div className="success-detail-row">
                                <span className="detail-label">Batch ID</span>
                                <span className="detail-value">{successData.batchId}</span>
                            </div>
                            <div className="success-detail-row">
                                <span className="detail-label">Scratch Code</span>
                                <span className="detail-value mono">{successData.scratchCode}</span>
                            </div>
                            <div className="success-detail-row">
                                <span className="detail-label">Time</span>
                                <span className="detail-value">{successData.timestamp}</span>
                            </div>
                            {successData.reward && (
                                <div className="success-detail-row reward-row">
                                    <span className="detail-label">Reward Earned</span>
                                    <span className="detail-value reward-value">+{successData.reward.points} pts</span>
                                </div>
                            )}
                        </div>

                        <div className="success-popup-actions">
                            <button className="btn btn-primary btn-lg" onClick={resetActivationForm}>
                                <RotateCcw size={16} /> Activate New Batch
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/verify')}>
                                Go to Verify Page
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
