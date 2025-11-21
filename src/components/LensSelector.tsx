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
      lensTypeId: hasEye ? selectedLensType : undefined,
      prescriptionType: hasEye ? prescriptionType : undefined,
      prescriptionImage: hasEye && prescriptionType === 'upload' ? prescriptionFile || undefined : undefined
    });
  };

  const handleLensTypeChange = (lensTypeId: string) => {
    setSelectedLensType(lensTypeId);
    onLensConfigChange({
      hasEyesight,
      lensTypeId,
      prescriptionType,
      prescriptionImage: prescriptionType === 'upload' ? prescriptionFile || undefined : undefined
    });
  };

  const handlePrescriptionTypeChange = (type: 'upload' | 'manual') => {
    setPrescriptionType(type);
    onLensConfigChange({
      hasEyesight,
      lensTypeId: selectedLensType,
      prescriptionType: type,
      prescriptionImage: type === 'upload' ? prescriptionFile || undefined : undefined
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

    onLensConfigChange({
      hasEyesight,
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
    <div className="space-y-6">
      {/* Step 1: Select Lens Option */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Step 1: Select Lens Option</h3>
        <RadioGroup value={hasEyesight ? "yes" : "no"} onValueChange={handleEyesightChange}>
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-secondary cursor-pointer">
            <RadioGroupItem value="no" id="no-eyesight" />
            <Label htmlFor="no-eyesight" className="cursor-pointer flex-1">
              No Eyesight (Zero Power)
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-secondary cursor-pointer">
            <RadioGroupItem value="yes" id="yes-eyesight" />
            <Label htmlFor="yes-eyesight" className="cursor-pointer flex-1">
              Eyesight Lenses (Prescription)
            </Label>
          </div>
        </RadioGroup>
      </Card>

      {/* Step 2: Choose Lens Type */}
      {hasEyesight && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Step 2: Choose Lens Type</h3>
          <RadioGroup value={selectedLensType} onValueChange={handleLensTypeChange}>
            {lensTypes.map((lens) => (
              <div
                key={lens.id}
                className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-secondary cursor-pointer"
              >
                <RadioGroupItem value={lens.id} id={lens.id} />
                {lens.imageUrl && (
                  <img src={lens.imageUrl} alt={lens.name} className="h-12 w-12 object-cover rounded" />
                )}
                <div className="flex-1">
                  <Label htmlFor={lens.id} className="cursor-pointer font-medium">
                    {lens.name}
                  </Label>
                  {lens.description && (
                    <p className="text-sm text-muted-foreground">{lens.description}</p>
                  )}
                </div>
                {lens.priceAdjustment > 0 && (
                  <span className="text-sm font-semibold">
                    +Rs. {lens.priceAdjustment.toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </RadioGroup>
        </Card>
      )}

      {/* Step 3: Enter Eyesight Numbers */}
      {hasEyesight && selectedLensType && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Step 3: Enter Eyesight Numbers</h3>
          
          <RadioGroup value={prescriptionType} onValueChange={(v) => handlePrescriptionTypeChange(v as 'upload' | 'manual')}>
            <div className="flex items-center space-x-2 mb-4">
              <RadioGroupItem value="upload" id="upload" />
              <Label htmlFor="upload">Upload Prescription</Label>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <RadioGroupItem value="manual" id="manual" />
              <Label htmlFor="manual">Enter Manually</Label>
            </div>
          </RadioGroup>

          {prescriptionType === 'upload' ? (
            <div className="space-y-4">
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
          ) : (
            <div className="space-y-6">
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
                      onChange={(e) => setRightEye({...rightEye, sph: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="right-cyl" className="text-xs">CYL</Label>
                    <Input
                      id="right-cyl"
                      placeholder="0.00"
                      value={rightEye.cyl}
                      onChange={(e) => setRightEye({...rightEye, cyl: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="right-axis" className="text-xs">AXIS</Label>
                    <Input
                      id="right-axis"
                      placeholder="0"
                      value={rightEye.axis}
                      onChange={(e) => setRightEye({...rightEye, axis: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="right-add" className="text-xs">ADD</Label>
                    <Input
                      id="right-add"
                      placeholder="0.00"
                      value={rightEye.add}
                      onChange={(e) => setRightEye({...rightEye, add: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="right-pd" className="text-xs">PD</Label>
                    <Input
                      id="right-pd"
                      placeholder="0.0"
                      value={rightEye.pd}
                      onChange={(e) => setRightEye({...rightEye, pd: e.target.value})}
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
                      onChange={(e) => setLeftEye({...leftEye, sph: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="left-cyl" className="text-xs">CYL</Label>
                    <Input
                      id="left-cyl"
                      placeholder="0.00"
                      value={leftEye.cyl}
                      onChange={(e) => setLeftEye({...leftEye, cyl: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="left-axis" className="text-xs">AXIS</Label>
                    <Input
                      id="left-axis"
                      placeholder="0"
                      value={leftEye.axis}
                      onChange={(e) => setLeftEye({...leftEye, axis: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="left-add" className="text-xs">ADD</Label>
                    <Input
                      id="left-add"
                      placeholder="0.00"
                      value={leftEye.add}
                      onChange={(e) => setLeftEye({...leftEye, add: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="left-pd" className="text-xs">PD</Label>
                    <Input
                      id="left-pd"
                      placeholder="0.0"
                      value={leftEye.pd}
                      onChange={(e) => setLeftEye({...leftEye, pd: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default LensSelector;
