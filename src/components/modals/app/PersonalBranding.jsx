import ContentError from "@/components/common/ContentError";
import Loader from "@/components/common/Loader";
import FormControl from "@/components/FormControl";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { personalBrandingInitialState } from "@/config/state-data/personal-branding";
import {
  changeFieldvalue,
  generateRequestPayload,
  personalBrandingReducer,
  selectPersonalBrandToEdit
} from "@/config/state-reducers/personal-branding";
import { sendDataWithFormData } from "@/lib/api";
import { getPersonalBranding } from "@/lib/fetchers/app";
import { getObjectUrl, normalizeHexColor } from "@/lib/utils";
import useCurrentStateContext, { CurrentStateProvider } from "@/providers/CurrentStateContext";
import { Palette, Pen, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

// Utility function to extract dominant color from image
async function extractDominantColor(file) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        // Sample pixels from the image (reduce for performance)
        const sampleSize = 50;
        const stepX = Math.max(1, Math.floor(img.width / sampleSize));
        const stepY = Math.max(1, Math.floor(img.height / sampleSize));
        
        const colorCounts = {};
        let totalPixels = 0;
        
        for (let y = 0; y < img.height; y += stepY) {
          for (let x = 0; x < img.width; x += stepX) {
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            const r = pixel[0];
            const g = pixel[1];
            const b = pixel[2];
            const a = pixel[3];
            
            // Skip transparent pixels
            if (a < 128) continue;
            
            // Skip very light/white pixels (likely background)
            if (r > 240 && g > 240 && b > 240) continue;
            
            // Quantize colors to reduce variations
            const qr = Math.floor(r / 16) * 16;
            const qg = Math.floor(g / 16) * 16;
            const qb = Math.floor(b / 16) * 16;
            const colorKey = `${qr},${qg},${qb}`;
            
            colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
            totalPixels++;
          }
        }
        
        // Find the most common color
        let maxCount = 0;
        let dominantColor = null;
        for (const [color, count] of Object.entries(colorCounts)) {
          if (count > maxCount) {
            maxCount = count;
            dominantColor = color;
          }
        }
        
        if (dominantColor) {
          const [r, g, b] = dominantColor.split(',').map(Number);
          const hex = `#${[r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          }).join('')}`;
          resolve(hex);
        } else {
          resolve('#000000'); // Default to black if no color found
        }
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function PersonalBranding({
  onClose
}) {
  return <Dialog
    open={true}
    onOpenChange={onClose}
  >
    <DialogTrigger />
    <DialogContent className="!max-w-[500px] w-full max-h-[85vh] border-0 p-0 overflow-hidden flex flex-col">
      <DialogHeader className="bg-[var(--comp-1)] p-5 border-b-1 flex-shrink-0">
        <DialogTitle className="text-lg font-semibold">
          App Personalization
        </DialogTitle>
      </DialogHeader>
      <CurrentStateProvider
        state={personalBrandingInitialState}
        reducer={personalBrandingReducer}
      >
        <div className="flex-1 overflow-y-auto p-5">
          <PersonalBrandingContainer />
        </div>
      </CurrentStateProvider>
    </DialogContent>
  </Dialog>
}

function PersonalBrandingContainer({ onClose }) {
  const { stage } = useCurrentStateContext();
  if (stage === 1) return <Stage1 />
  if (stage === 2) return <Stage2 />
  return <Stage3 />
}

function Stage1() {
  const { isLoading, error, data, mutate } = useSWR("app/personalBranding", () => getPersonalBranding());
  const { dispatch } = useCurrentStateContext();
  const brands = data?.data;

  useEffect(function () {
    if (!error && data?.status_code === 200) dispatch(selectPersonalBrandToEdit(brands, mutate))
  }, [data, isLoading])

  if (isLoading) return <div className="h-[200px] flex items-center justify-center">
    <Loader />
  </div>

  if (error || data.status_code !== 200) return <ContentError className="border-0 min-h-auto h-[200px] mt-0" title={error || data.message} />
  return <>
    {brands.slice(0, 1).map(brand => <div
      key={brand._id}
      className="mb-4 px-4 py-2 flex items-center gap-2 border-2 border-[var(--accent-1)] rounded-[8px]"
    >
      <Avatar>
        <AvatarImage src={brand.brandLogo || "/not-found.png"} />
      </Avatar>
      <h3>{brand.brandName}</h3>
      <Pen
        onClick={() => dispatch(selectPersonalBrandToEdit(brand))}
        className="w-[16px] h-[16px] text-[var(--dark-1)]/25 hover:text-[var(--dark-1)] ml-auto cursor-pointer"
      />
    </div>)}
  </>
}

async function getRequestLink(data, type, id) {
  if (Boolean(type)) {
    const response = await sendDataWithFormData("app/update", data, "PUT");
    return response;
  } else {
    const response = await sendDataWithFormData("app/create", data);
    return response
  }
}

function Stage2() {
  const { selectedBrand, formData, dispatch } = useCurrentStateContext();
  const [loading, setLoading] = useState(false);
  const [extractingColor, setExtractingColor] = useState(false);
  const brandLogoRef = useRef();

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    dispatch(changeFieldvalue("brandLogo", file));
    
    // Extract color from logo
    if (file && file.type.startsWith('image/')) {
      try {
        setExtractingColor(true);
        const dominantColor = await extractDominantColor(file);
        // Set primary color to extracted color
        dispatch(changeFieldvalue("primaryColor", dominantColor.slice(1)));
        // Set text color to a contrasting color (light or dark based on brightness)
        const brightness = getBrightness(dominantColor);
        const textColor = brightness > 128 ? '#000000' : '#ffffff';
        dispatch(changeFieldvalue("textColor", textColor.slice(1)));
        toast.success("Brand colors extracted from logo!");
      } catch (error) {
        console.error("Error extracting color:", error);
        toast.error("Could not extract colors from logo");
      } finally {
        setExtractingColor(false);
      }
    }
  };

  async function savePersonalBrandDetails() {
    try {
      setLoading(true);
      const data = generateRequestPayload(formData, selectedBrand._id);
      const response = await getRequestLink(data, selectedBrand._id);
      if (response.status_code !== 200) throw new Error(response.message);
      mutate("app/personalBranding");
      toast.success(response.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <div className="space-y-6">
    <FormControl
      label="Brand Name"
      placeholder="Company Name"
      value={formData.brandName}
      onChange={e => dispatch(changeFieldvalue("brandName", e.target.value))}
      className="block"
    />
    
    <div className="space-y-3">
      <label className="text-sm font-medium text-black/80">Brand Logo</label>
      <SelectBrandLogo fieldName="file" brandLogoRef={brandLogoRef} extractingColor={extractingColor} />
      <input
        type="file"
        ref={brandLogoRef}
        accept="image/*"
        onChange={handleLogoChange}
        hidden
      />
      {extractingColor && (
        <p className="text-xs text-black/60 flex items-center gap-2">
          <Palette className="w-3 h-3" />
          Extracting colors from logo...
        </p>
      )}
    </div>

    <div className="space-y-3">
      <label className="text-sm font-medium text-black/80">Brand Colors</label>
      <div className="p-3 bg-[var(--comp-2)] rounded-lg border-1 space-y-3">
        <div className="flex items-center justify-between p-3 bg-white rounded-md border-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Primary Color</span>
            <span className="text-xs text-black/50">(Auto-detected from logo)</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="w-10 h-10 rounded-md cursor-pointer border-1"
              value={normalizeHexColor(formData.primaryColor) || "#000000"}
              onChange={e => dispatch(changeFieldvalue("primaryColor", e.target.value.slice(1)))}
            />
            <span className="text-xs font-mono text-black/60 w-16">
              {normalizeHexColor(formData.primaryColor) || "#000000"}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-white rounded-md border-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Text Color</span>
            <span className="text-xs text-black/50">(Contrast color)</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="w-10 h-10 rounded-md cursor-pointer border-1"
              value={normalizeHexColor(formData.textColor) || "#000000"}
              onChange={e => dispatch(changeFieldvalue("textColor", e.target.value.slice(1)))}
            />
            <span className="text-xs font-mono text-black/60 w-16">
              {normalizeHexColor(formData.textColor) || "#000000"}
            </span>
          </div>
        </div>
      </div>
    </div>

    <Button
      onClick={savePersonalBrandDetails}
      variant="wz"
      className="w-full mt-6"
      disabled={loading || extractingColor}
    >
      {loading ? "Saving..." : "Save Changes"}
    </Button>
  </div>
}

// Helper function to calculate brightness
function getBrightness(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function Stage3() {
  const { formData, dispatch } = useCurrentStateContext();
  const [loading, setLoading] = useState(false);
  const [extractingColor, setExtractingColor] = useState(false);
  const brandLogoRef = useRef();

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    dispatch(changeFieldvalue("brandLogo", file));
    
    // Extract color from logo
    if (file && file.type.startsWith('image/')) {
      try {
        setExtractingColor(true);
        const dominantColor = await extractDominantColor(file);
        // Set primary color to extracted color
        dispatch(changeFieldvalue("primaryColor", dominantColor.slice(1)));
        // Set text color to a contrasting color
        const brightness = getBrightness(dominantColor);
        const textColor = brightness > 128 ? '#000000' : '#ffffff';
        dispatch(changeFieldvalue("textColor", textColor.slice(1)));
        toast.success("Brand colors extracted from logo!");
      } catch (error) {
        console.error("Error extracting color:", error);
        toast.error("Could not extract colors from logo");
      } finally {
        setExtractingColor(false);
      }
    }
  };

  async function savePersonalBrandDetails() {
    try {
      setLoading(true);
      const data = generateRequestPayload(formData, formData._id);
      const response = await getRequestLink(data);
      if (response.status_code !== 200) throw new Error(response.message);
      mutate("app/personalBranding");
      toast.success(response.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <div className="space-y-6">
    <FormControl
      label="Brand Name"
      placeholder="Brand Name"
      value={formData.brandName}
      onChange={e => dispatch(changeFieldvalue("brandName", e.target.value))}
      className="block"
    />
    
    <div className="space-y-3">
      <label className="text-sm font-medium text-black/80">Brand Logo</label>
      <SelectBrandLogo fieldName="file" brandLogoRef={brandLogoRef} extractingColor={extractingColor} />
      <input
        type="file"
        ref={brandLogoRef}
        accept="image/*"
        onChange={handleLogoChange}
        hidden
      />
      {extractingColor && (
        <p className="text-xs text-black/60 flex items-center gap-2">
          <Palette className="w-3 h-3" />
          Extracting colors from logo...
        </p>
      )}
    </div>

    <div className="space-y-3">
      <label className="text-sm font-medium text-black/80">Brand Colors</label>
      <div className="p-3 bg-[var(--comp-2)] rounded-lg border-1 space-y-3">
        <div className="flex items-center justify-between p-3 bg-white rounded-md border-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Primary Color</span>
            <span className="text-xs text-black/50">(Auto-detected from logo)</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="w-10 h-10 rounded-md cursor-pointer border-1"
              value={normalizeHexColor(formData.primaryColor) || "#000000"}
              onChange={e => dispatch(changeFieldvalue("primaryColor", e.target.value.slice(1)))}
            />
            <span className="text-xs font-mono text-black/60 w-16">
              {normalizeHexColor(formData.primaryColor) || "#000000"}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 bg-white rounded-md border-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Text Color</span>
            <span className="text-xs text-black/50">(Contrast color)</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="w-10 h-10 rounded-md cursor-pointer border-1"
              value={normalizeHexColor(formData.textColor) || "#000000"}
              onChange={e => dispatch(changeFieldvalue("textColor", e.target.value.slice(1)))}
            />
            <span className="text-xs font-mono text-black/60 w-16">
              {normalizeHexColor(formData.textColor) || "#000000"}
            </span>
          </div>
        </div>
      </div>
    </div>

    <Button
      onClick={savePersonalBrandDetails}
      variant="wz"
      className="w-full mt-6"
      disabled={loading || extractingColor}
    >
      {loading ? "Saving..." : "Save Changes"}
    </Button>
  </div>
}

function SelectBrandLogo({ brandLogoRef, fieldName, extractingColor }) {
  const { formData, selectedBrand, dispatch } = useCurrentStateContext();
  
  if (Boolean(formData["brandLogo"])) {
    return <div className="relative group">
      <div className="relative border-2 border-dashed border-[var(--accent-1)]/30 rounded-lg p-4 bg-[var(--comp-2)] transition-all hover:border-[var(--accent-1)]/50">
        <Image
          src={getObjectUrl(formData["brandLogo"]) || "/not-found.png"}
          alt="Brand Logo"
          width={200}
          height={200}
          className="w-full max-h-[200px] object-contain rounded-md"
          onClick={() => brandLogoRef.current?.click()}
        />
        {extractingColor && (
          <div className="absolute inset-0 bg-black/20 rounded-md flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader />
              <span className="text-xs text-white">Extracting colors...</span>
            </div>
          </div>
        )}
        <button
          type="button"
          className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            dispatch(changeFieldvalue("brandLogo", undefined));
          }}
        >
          <X className="w-4 h-4 text-black/70" />
        </button>
      </div>
    </div>
  }

  return <div
    onClick={() => brandLogoRef.current?.click()}
    className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-[var(--comp-2)] hover:border-[var(--accent-1)] hover:bg-[var(--comp-1)] transition-all cursor-pointer"
  >
    <div className="flex flex-col items-center justify-center gap-3">
      {selectedBrand?.brandLogo ? (
        <Image
          src={selectedBrand.brandLogo || "/not-found.png"}
          alt="Current Logo"
          height={120}
          width={120}
          className="max-h-[120px] object-contain"
        />
      ) : (
        <Upload className="w-12 h-12 text-gray-400" />
      )}
      <div className="text-center">
        <p className="text-sm font-medium text-black/80">
          {selectedBrand?.brandLogo ? "Click to change logo" : "Click to upload logo"}
        </p>
        <p className="text-xs text-black/50 mt-1">
          PNG, JPG up to 5MB
        </p>
      </div>
    </div>
  </div>
}