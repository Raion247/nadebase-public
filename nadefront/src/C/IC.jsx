import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../C/noti';
import Cropper from 'react-easy-crop';
import UL from '../C/UL';
import useAuth from '../hooks/UA';
 
const IC = ({ currentImageIndex, setCurrentImageIndex, onImageCropped, onAddingNewImage, visibility, ufOpen }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { showNotification, NotificationComponent } = useNotification();
  const [pendingRedirect, setPendingRedirect] = useState(false);
  const redirectTimeoutRef = useRef(null);
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [addingNewImage, setAddingNewImage] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImages, setCroppedImages] = useState([]);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isCroppedOpen, setIsCroppedOpen] = useState(false);
  const [imageError, setImageError] = useState('');
  const [uploadLimits, setUploadLimits] = useState({
      daily: { used: 0, remaining: 3, total: 3 },
      monthly: { used: 0, remaining: 10, total: 10 }
  });
  const [privateInfo, setPrivateInfo] = useState({
    canPrivateUploads: false,
    used: 0,
    cap: 250,
    remaining: 0
  });
  const [uploadLimitsFetched, setUploadLimitsFetched] = useState(false);
  const fileInputRef = useRef(null);
  const isNotAdmin = user && !user.isAdmin;
  
  const onFileChange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      const validTypes = ['image/png', 'image/jpeg'];

      if (!validTypes.includes(file.type)) {
        setImageError('Only PNG and JPEG files are allowed');
        return;
      }

      const maxSizeInBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        setImageError('Image must be less than 5MB');
        return;
      }
      
      setImageError('');
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
          setImage(reader.result);
      };
      }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
  }, []);
  
  const createCroppedImage = useCallback(async () => {
  try {
    const croppedImg = await getCroppedImg(
      image,
      croppedAreaPixels,
      rotation
    );
    
    const updatedImages = [...croppedImages, croppedImg];
    setCroppedImages(updatedImages);
    onImageCropped(updatedImages);
    
    setImage(null);
    setZoom(1);
    setRotation(0);
    setCrop({ x: 0, y: 0 });
    setAddingNewImage(false);
    if (onAddingNewImage) onAddingNewImage(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  } catch (e) {
      console.error('Error creating cropped image:', e);
  }
  }, [croppedAreaPixels, rotation, image, croppedImages, onImageCropped, onAddingNewImage]);
    
  const resetCropper = () => {
      setCroppedImages([]);
      setCurrentImageIndex(0);
      onImageCropped([]);
  };
    
  const selectNewImage = () => {
    setAddingNewImage(true);
    if (onAddingNewImage) onAddingNewImage(true);
    // Create a new input element
    const newInput = document.createElement('input');
    newInput.type = 'file';
    newInput.accept = 'image/png,image/jpeg';
    newInput.onchange = (e) => {
        onFileChange(e);
        document.body.removeChild(newInput);
    };
    newInput.style.display = 'none';
    document.body.appendChild(newInput);
    newInput.click();
    
    // Clear the cropper state
    setImage(null);
    setZoom(1);
    setRotation(0);
    setCrop({ x: 0, y: 0 });
  };

  const showNextImage = () => {
      setCurrentImageIndex((prev) => (prev + 1) % croppedImages.length);
  };

  const showPrevImage = () => {
      setCurrentImageIndex((prev) => 
          prev === 0 ? croppedImages.length - 1 : prev - 1
      );
  };

  useEffect(() => {
    setIsCropperOpen(!!image);
  }, [image]);

  
  useEffect(() => {
    setIsCroppedOpen(croppedImages.length > 0 && !addingNewImage);
  }, [croppedImages, addingNewImage]);

  const fetchUploadStats = useCallback(async () => {
    try {
      if (user?.isAdmin) {
        setUploadLimitsFetched(true);
        return;
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/upload-stats`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      setUploadLimits({
        daily: {
          used: data.stats.dailyCount,
          remaining: Math.max(0, data.stats.dailyLimit - data.stats.dailyCount),
          total: data.stats.dailyLimit
        },
        monthly: {
          used: data.stats.monthlyCount,
          remaining: Math.max(0, data.stats.monthlyLimit - data.stats.monthlyCount),
          total: data.stats.monthlyLimit
        }
      });

      const usedPrivate = data.stats.privateUploads ?? 0;
      const cap = data.stats.privateCap ?? 250;
      setPrivateInfo({
        canPrivateUploads: !!data.stats.canPrivateUploads,
        used: usedPrivate,
        cap,
        remaining: Math.max(0, cap - usedPrivate)
      });
      
      setUploadLimitsFetched(true);
    } catch (error) {
      console.error('Error fetching upload stats:', error);
      setUploadLimitsFetched(true);
    }
  }, [user?.isAdmin]);

  useEffect(() => {
    if (!isCropperOpen && !isCroppedOpen && user?.steamid) {
      fetchUploadStats();
    }
  }, [isCropperOpen, isCroppedOpen, user?.steamid, fetchUploadStats]);

  useEffect(() => {
    if (!uploadLimitsFetched) return;
    if (!user) return;
    if (user.isAdmin) return;

    const isPrivateMode = visibility === "private";

    const outOfUploads = isPrivateMode
      ? (!user?.isAdmin && (!privateInfo.canPrivateUploads || privateInfo.remaining <= 0))
      : (!user?.isAdmin && (uploadLimits.daily.remaining <= 0 || uploadLimits.monthly.remaining <= 0));

    if (!outOfUploads) return;

    // Trigger only once
    if (pendingRedirect) return;
    setPendingRedirect(true);

    // Let UL render first, then show toast, then redirect
    showNotification("No uploads left. Redirecting…", "warning", 2000);

    redirectTimeoutRef.current = setTimeout(() => {
      navigate("/upgrade", { replace: true, state: { reason: "upload-limit" } });
    }, 2000);
  }, [
    uploadLimitsFetched,
    user,
    visibility,
    privateInfo.canPrivateUploads,
    privateInfo.remaining,
    uploadLimits.daily.remaining,
    uploadLimits.monthly.remaining,
    navigate,
    showNotification,
    pendingRedirect
  ]);

  useEffect(() => {
    return () => {
        // Cleanup when component unmounts (form closes)
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
          redirectTimeoutRef.current = null;
        }
        setImage(null);
        setZoom(1);
        setRotation(0);
        setCrop({ x: 0, y: 0 });
    };
  }, []);

  const isPrivateMode = visibility === "private";
  const REQUIRED_IMAGES = isPrivateMode ? 1 : 2;
  const MAX_IMAGES = 2;

  const canUploadPublic =
    user?.isAdmin ||
    (uploadLimits.daily.remaining > 0 && uploadLimits.monthly.remaining > 0);

  const canUploadPrivate =
    user?.isAdmin ||
    (privateInfo.canPrivateUploads && privateInfo.remaining > 0);

  const canUpload = isPrivateMode ? canUploadPrivate : canUploadPublic;
 
  return (
    <div className={`max-w-2xl mx-auto p-6 bg-gray-700 rounded-lg
      ${ufOpen ? 'rounded-r-none' : ''}`
    }>
      <NotificationComponent />
      <h1 className={`text-2xl font-bold text-center mb-6 text-white
        ${ufOpen ? 'text-right relative left-15' : ''}`
      }>
      Upload your lineup
      </h1>
      {/* FIX THIS FUCKING PIECE OF SHIT */}
      {/* added 2 usestates to fix */}
      {(!isCropperOpen && !isCroppedOpen) && (
        <div className="mb-2">
          {/* Show loading state or input based on fetch completion */}
          {!uploadLimitsFetched ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {croppedImages.length < MAX_IMAGES && (
                <div className="text-gray-400 text-center -mt-3 mb-3">
                  {isPrivateMode ? (
                    <>
                      <p>You can upload <strong>1 or 2 images</strong></p>
                      <p><strong>First image</strong> is required</p>
                      <p><strong>Second image</strong> is optional</p>
                    </>
                  ) : (
                    <>
                      <p>You will upload and crop <strong>2 images</strong></p>
                      <p><strong>First image</strong> shows the starting position</p>
                      <p><strong>Second image</strong> shows the lineup</p>
                    </>
                  )}
                </div>
              )}
              {/* Only show input if limits remain */}
              {canUpload && croppedImages.length < MAX_IMAGES && (
                <div className="flex items-center justify-center">
                  <label className="flex flex-col items-center px-4 py-6 bg-gray-700 text-blue-500 rounded-lg shadow-lg tracking-wide uppercase border-2 border-blue-500 cursor-pointer hover:bg-blue-500 hover:text-white">
                    <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                    </svg>
                    {croppedImages.length === 0 ? (
                      <span>Select <strong>first image</strong></span>
                    ) : (
                      <span>
                        Select <strong>{isPrivateMode ? "optional second image" : "second image"}</strong>
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={onFileChange}
                      ref={fileInputRef}
                      disabled={!uploadLimitsFetched} // Disable until fetched
                    />
                  </label>
                </div>
              )}

              {imageError && (
                <p className="text-red-500 text-center mt-2">{imageError}</p>
              )}

              {uploadLimitsFetched && isNotAdmin && (
                <div className="flex w-full justify-center items-center mt-4">
                  {isPrivateMode ? (
                    <UL privateInfo={privateInfo} />
                  ) : (
                    <UL limits={uploadLimits} />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {image && (
        <div>
          {/* Cropper Container */}
          <div className="relative h-64 md:h-96 bg-gray-200 mb-4">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              rotation={rotation}
              zoomWithScroll={false}
            />
          </div>
          
          {/* Zoom Control */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Zoom: {zoom.toFixed(1)}x
            </label>
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{background: '#e5e7eb'}}
            />
          </div>
          
          {/* Controls */}
          <div className="flex justify-between">
            <button
              onClick={selectNewImage}
              className="border border-red-500 bg-red-500/30 hover:bg-red-500/40 text-white px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={createCroppedImage}
              className="border border-blue-500 bg-blue-500/30 hover:bg-blue-500/40 text-white px-4 py-2 rounded-xl"
            >
              Crop Image
            </button>
          </div>
        </div>
      )}
      
      {croppedImages.length > 0 && !addingNewImage && (
        <div>
          <h2 className="relative font-mono bottom-2 text-lg text-white font-semibold">Cropped Result:</h2>
          <div className="mb-6 flex justify-center w-[500px] h-[500px] overflow-hidden relative group">
            <img
              src={croppedImages[currentImageIndex] || croppedImages[0]}
              alt={`Cropped ${currentImageIndex + 1}`}
              className="max-w-full h-auto border rounded shadow-sm"
            />
            {croppedImages.length > 1 && (
              <>
              <div className="absolute text-white left-2 top-1 font-semibold">{currentImageIndex + 1}/{croppedImages.length}</div>
                <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      showPrevImage();
                  }}
                  className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-black/70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      showNextImage();
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-black/70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </>
          )}
          </div>
          <div className="flex justify-between">
            <button
              onClick={resetCropper}
              className="border border-red-500 bg-red-500/30 hover:bg-red-500/40 cursor-pointer text-white font-mono px-4 py-2 rounded-xl"
            >
              {croppedImages.length >= REQUIRED_IMAGES ? 'Start Over' : 'Crop Again'}
            </button>
            {croppedImages.length === 1 && (
              <button
                onClick={selectNewImage}
                className="font-mono border border-green-500 bg-green-500/40 hover:bg-green-500/50 text-white px-4 py-2 rounded-xl"
              >
                Add Second Image
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
 
// Helper function to create a cropped image
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
 
const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
 
  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));
 
  // Set canvas dimensions to handle the rotation
  canvas.width = safeArea;
  canvas.height = safeArea;
 
  // Translate canvas center point to the origin
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);
 
  // Draw the rotated image and drop off-canvas pixels
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );
 
  // Extract the cropped portion
  const data = ctx.getImageData(0, 0, safeArea, safeArea);
 
  // Set canvas width to final desired crop size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
 
  // Place the cropped data into a new canvas with proper position
  ctx.putImageData(
    data,
    0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x,
    0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y
  );
 
  // Return as data URL
  return canvas.toDataURL('image/png');
};
 
export default IC;