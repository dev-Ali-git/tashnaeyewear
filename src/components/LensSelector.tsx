import { useState, useRef } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, FileImage } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LensType {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  priceAdjustment: number;
}

interface LensSelectorProps {
  lensTypes: LensType[];
  onLensConfigChange: (config: LensConfiguration) => void;
}

export interface LensConfiguration {
  hasEyesight: boolean;
  lensTypeId?: string;
  prescriptionType?: 'upload' | 'manual';
  prescriptionImage?: File;
  prescriptionData?: {
    rightEye: EyeData;
    leftEye: EyeData;
  };
}

interface EyeData {
  sph: string;
  cyl: string;
  axis: string;
  add: string;
  pd: string;
}

const LensSelector = ({ lensTypes, onLensConfigChange }: LensSelectorProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasEyesight, setHasEyesight] = useState<boolean>(false);
  const [selectedLensType, setSelectedLensType] = useState<string>("");
  const [prescriptionType, setPrescriptionType] = useState<'upload' | 'manual'>('upload');
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string | null>(null);
  const [rightEye, setRightEye] = useState<EyeData>({
    sph: '', cyl: '', axis: '', add: '', pd: ''
  });
  const [leftEye, setLeftEye] = useState<EyeData>({
    sph: '', cyl: '', axis: '', add: '', pd: ''
  });

  const handleEyesightChange = (value: string) => {
    const hasEye = value === "yes";
    setHasEyesight(hasEye);
    onLensConfigChange({
      hasEyesight: hasEye,
      lensTypeId: selectedLensType || undefined, // Include lens type if selected
      prescriptionType: hasEye ? prescriptionType : undefined,
      prescriptionImage: hasEye && prescriptionType === 'upload' ? prescriptionFile || undefined : undefined
    });
  };

  const handleLensTypeChange = (lensTypeId: string) => {
    setSelectedLensType(lensTypeId);
    onLensConfigChange({
      hasEyesight,
      lensTypeId, // Always send lens type ID even when hasEyesight is false
      prescriptionType: hasEyesight ? prescriptionType : undefined,
      prescriptionImage: hasEyesight && prescriptionType === 'upload' ? prescriptionFile || undefined : undefined,
      prescriptionData: hasEyesight && prescriptionType === 'manual' ? { rightEye, leftEye } : undefined
    });
  };

  const handlePrescriptionTypeChange = (type: 'upload' | 'manual') => {
    // Selecting a prescription input method implies eyesight lenses
    setHasEyesight(true);
    setPrescriptionType(type);
    onLensConfigChange({
      hasEyesight: true,
      lensTypeId: selectedLensType,
      prescriptionType: type,
      prescriptionImage: type === 'upload' ? prescriptionFile || undefined : undefined,
      prescriptionData: type === 'manual' ? { rightEye, leftEye } : undefined
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or PDF file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setPrescriptionFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPrescriptionPreview(null);
    }

    setHasEyesight(true);
    onLensConfigChange({
      hasEyesight: true,
      lensTypeId: selectedLensType,
      prescriptionType: 'upload',
      prescriptionImage: file
    });

    toast({
      title: "Prescription uploaded",
      description: `${file.name} has been uploaded successfully`
    });
  };

  const handleRemoveFile = () => {
    setPrescriptionFile(null);
    setPrescriptionPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onLensConfigChange({
      hasEyesight,
      lensTypeId: selectedLensType,
      prescriptionType: 'upload',
      prescriptionImage: undefined
    });
  };

  return (
    <div className="space-y-8">
      {/* Step 1: Select Lens Option */}
      <div>
        <h3 className="font-semibold text-lg mb-4 flex items-center">
          <span className="text-red-500 mr-2">*</span>
          Select Lense
        </h3>
        <RadioGroup value={hasEyesight ? "yes" : "no"} onValueChange={handleEyesightChange}>
          <div className="grid grid-cols-2 gap-4">
            <Label 
              htmlFor="no-eyesight" 
              className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-gray-400 ${
                !hasEyesight ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-300'
              }`}
            >
              <RadioGroupItem value="no" id="no-eyesight" className="mr-2" />
              <span className="font-medium">No Eyesight</span>
            </Label>
            <Label 
              htmlFor="yes-eyesight" 
              className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-gray-400 ${
                hasEyesight ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-300'
              }`}
            >
              <RadioGroupItem value="yes" id="yes-eyesight" className="mr-2" />
              <span className="font-medium">Eyesight Lenses</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Step 2: Choose Lens Type */}
      <div>
        <h3 className="font-semibold text-lg mb-4 flex items-center">
          <span className="text-red-500 mr-2">*</span>
          Lenses options
        </h3>
        <RadioGroup value={selectedLensType} onValueChange={handleLensTypeChange}>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {lensTypes.map((lens) => (
              <Label
                key={lens.id}
                htmlFor={lens.id}
                className={`block border-2 rounded-lg overflow-hidden cursor-pointer transition-all hover:border-gray-400 ${
                  selectedLensType === lens.id ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-300'
                }`}
              >
                <RadioGroupItem value={lens.id} id={lens.id} className="sr-only" />
                  {lens.imageUrl && (
                    <div className="aspect-square sm:aspect-[4/3] bg-gray-100 overflow-hidden">
                      <img 
                        src={lens.imageUrl} 
                        alt={lens.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-2 sm:p-4 bg-white text-center">
                    <p className="font-medium text-sm sm:text-base mb-1">{lens.name}</p>
                    {lens.description && (
                      <p className="text-xs text-muted-foreground mb-1 sm:mb-2 line-clamp-2">{lens.description}</p>
                    )}
                    {lens.priceAdjustment > 0 && (
                      <p className="text-orange-600 font-bold text-sm sm:text-base">
                        Rs {lens.priceAdjustment.toLocaleString()}
                      </p>
                    )}
                  </div>
              </Label>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Step 3: Enter Eyesight Numbers */}
      {hasEyesight && selectedLensType && (
        <div>
          <h3 className="font-semibold text-lg mb-4">Enter Eyesight Number</h3>
          
          <RadioGroup value={prescriptionType} onValueChange={(v) => handlePrescriptionTypeChange(v as 'upload' | 'manual')}>
            <div className="space-y-3 mb-6">
              <Label 
                htmlFor="upload" 
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-gray-400 ${
                  prescriptionType === 'upload' ? 'border-gray-900 bg-gray-50' : 'border-gray-300'
                }`}
              >
                <RadioGroupItem value="upload" id="upload" />
                <span className="font-medium">Upload Prescription Image</span>
              </Label>
              <Label 
                htmlFor="manual" 
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-gray-400 ${
                  prescriptionType === 'manual' ? 'border-gray-900 bg-gray-50' : 'border-gray-300'
                }`}
              >
                <RadioGroupItem value="manual" id="manual" />
                <span className="font-medium">Enter Eyesight Number</span>
              </Label>
            </div>
          </RadioGroup>

          <div className="mt-6">
            {/* Upload mode */}
            <div className={prescriptionType === 'upload' ? 'space-y-4' : 'hidden'}>
              {!prescriptionFile ? (
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload your prescription image
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Supported formats: JPG, PNG, PDF (max 5MB)
                  </p>
                  <Button type="button" variant="outline" onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <FileImage className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{prescriptionFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(prescriptionFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {prescriptionPreview && (
                    <img 
                      src={prescriptionPreview} 
                      alt="Prescription preview" 
                      className="w-full rounded-md border"
                    />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Manual mode */}
            <div className={prescriptionType === 'manual' ? 'space-y-6' : 'hidden'}>
                {/* Right Eye */}
                <div>
                <h4 className="font-medium mb-3">Right Eye (OD)</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <Label htmlFor="right-sph" className="text-xs">SPH</Label>
                    <Input
                      id="right-sph"
                      placeholder="0.00"
                      value={rightEye.sph}
                      onChange={(e) => {
                        const newRightEye = { ...rightEye, sph: e.target.value };
                        setHasEyesight(true);
                        setRightEye(newRightEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: { rightEye: newRightEye, leftEye }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="right-cyl" className="text-xs">CYL</Label>
                    <Input
                      id="right-cyl"
                      placeholder="0.00"
                      value={rightEye.cyl}
                      onChange={(e) => {
                        const newRightEye = { ...rightEye, cyl: e.target.value };
                        setHasEyesight(true);
                        setRightEye(newRightEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: { rightEye: newRightEye, leftEye }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="right-axis" className="text-xs">AXIS</Label>
                    <Input
                      id="right-axis"
                      placeholder="0"
                      value={rightEye.axis}
                      onChange={(e) => {
                        const newRightEye = { ...rightEye, axis: e.target.value };
                        setHasEyesight(true);
                        setRightEye(newRightEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: { rightEye: newRightEye, leftEye }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="right-add" className="text-xs">ADD</Label>
                    <Input
                      id="right-add"
                      placeholder="0.00"
                      value={rightEye.add}
                      onChange={(e) => {
                        const newRightEye = { ...rightEye, add: e.target.value };
                        setHasEyesight(true);
                        setRightEye(newRightEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: { rightEye: newRightEye, leftEye }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="right-pd" className="text-xs">PD</Label>
                    <Input
                      id="right-pd"
                      placeholder="0.0"
                      value={rightEye.pd}
                      onChange={(e) => {
                        const newRightEye = { ...rightEye, pd: e.target.value };
                        setHasEyesight(true);
                        setRightEye(newRightEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: { rightEye: newRightEye, leftEye }
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Left Eye */}
              <div>
                <h4 className="font-medium mb-3">Left Eye (OS)</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <Label htmlFor="left-sph" className="text-xs">SPH</Label>
                    <Input
                      id="left-sph"
                      placeholder="0.00"
                      value={leftEye.sph}
                      onChange={(e) => {
                        const newLeftEye = { ...leftEye, sph: e.target.value };
                        setHasEyesight(true);
                        setLeftEye(newLeftEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: { rightEye, leftEye: newLeftEye }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="left-cyl" className="text-xs">CYL</Label>
                    <Input
                      id="left-cyl"
                      placeholder="0.00"
                      value={leftEye.cyl}
                      onChange={(e) => {
                        const newLeftEye = { ...leftEye, cyl: e.target.value };
                        setHasEyesight(true);
                        setLeftEye(newLeftEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: { rightEye, leftEye: newLeftEye }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="left-axis" className="text-xs">AXIS</Label>
                    <Input
                      id="left-axis"
                      placeholder="0"
                      value={leftEye.axis}
                      onChange={(e) => {
                        const newLeftEye = { ...leftEye, axis: e.target.value };
                        setHasEyesight(true);
                        setLeftEye(newLeftEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: { rightEye, leftEye: newLeftEye }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="left-add" className="text-xs">ADD</Label>
                    <Input
                      id="left-add"
                      placeholder="0.00"
                      value={leftEye.add}
                      onChange={(e) => {
                        const newLeftEye = { ...leftEye, add: e.target.value };
                        setHasEyesight(true);
                        setLeftEye(newLeftEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: { rightEye, leftEye: newLeftEye }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="left-pd" className="text-xs">PD</Label>
                    <Input
                      id="left-pd"
                      placeholder="0.0"
                      value={leftEye.pd}
                      onChange={(e) => {
                        const newLeftEye = { ...leftEye, pd: e.target.value };
                        setHasEyesight(true);
                        setLeftEye(newLeftEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: { rightEye, leftEye: newLeftEye }
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LensSelector;
