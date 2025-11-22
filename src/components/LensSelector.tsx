import { useState, useRef } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
    rightPrism?: PrismData;
    leftPrism?: PrismData;
    twoPDNumbers?: boolean;
    addPrism?: boolean;
  };
}

interface EyeData {
  sph: string;
  cyl: string;
  axis: string;
  add: string;
  pd: string;
}

interface PrismData {
  verticalPrism: string;
  verticalBase: string;
  horizontalPrism: string;
  horizontalBase: string;
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
    sph: '0.00', cyl: '0.00', axis: '0', add: '0.00', pd: ''
  });
  const [leftEye, setLeftEye] = useState<EyeData>({
    sph: '0.00', cyl: '0.00', axis: '0', add: '0.00', pd: ''
  });
  const [rightPrism, setRightPrism] = useState<PrismData>({
    verticalPrism: '0.00', verticalBase: 'n/a', horizontalPrism: '0.00', horizontalBase: 'n/a'
  });
  const [leftPrism, setLeftPrism] = useState<PrismData>({
    verticalPrism: '0.00', verticalBase: 'n/a', horizontalPrism: '0.00', horizontalBase: 'n/a'
  });
  const [twoPDNumbers, setTwoPDNumbers] = useState(false);
  const [addPrism, setAddPrism] = useState(false);

  // Generate number ranges
  const generateSphCylRange = () => {
    const values = [];
    for (let i = -16; i <= 16; i += 0.25) {
      const formatted = i > 0 ? `+${i.toFixed(2)}` : i.toFixed(2);
      values.push(formatted);
    }
    return values;
  };

  const generateAddRange = () => {
    const values = [];
    for (let i = 0; i <= 6; i += 0.25) {
      values.push(i === 0 ? i.toFixed(2) : `+${i.toFixed(2)}`);
    }
    return values;
  };

  const generatePrismRange = () => {
    const values = [];
    for (let i = 0; i <= 5; i += 0.5) {
      values.push(i.toFixed(2));
    }
    return values;
  };

  const generateAxisRange = () => {
    const values = [];
    for (let i = 0; i <= 180; i++) {
      values.push(i.toString());
    }
    return values;
  };

  const generateSinglePDRange = () => {
    const values = [];
    for (let i = 50; i <= 80; i++) {
      values.push(i.toString());
    }
    return values;
  };

  const generateDoublePDRange = () => {
    const values = [];
    for (let i = 25; i <= 40; i++) {
      values.push(i.toString());
    }
    return values;
  };

  const sphCylOptions = generateSphCylRange();
  const addOptions = generateAddRange();
  const prismOptions = generatePrismRange();
  const axisOptions = generateAxisRange();
  const singlePDOptions = generateSinglePDRange();
  const doublePDOptions = generateDoublePDRange();

  // Helper to get complete prescription data
  const getCompletePrescriptionData = (
    customRightEye?: EyeData, 
    customLeftEye?: EyeData,
    customRightPrism?: PrismData,
    customLeftPrism?: PrismData
  ) => ({
    rightEye: customRightEye || rightEye,
    leftEye: customLeftEye || leftEye,
    rightPrism: addPrism ? (customRightPrism || rightPrism) : undefined,
    leftPrism: addPrism ? (customLeftPrism || leftPrism) : undefined,
    twoPDNumbers,
    addPrism
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
      prescriptionData: hasEyesight && prescriptionType === 'manual' ? getCompletePrescriptionData() : undefined
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
      prescriptionData: type === 'manual' ? getCompletePrescriptionData() : undefined
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
              {/* Header Row */}
              <div className="bg-gray-800 text-white p-3 rounded-t-lg">
                <div className="grid grid-cols-4 gap-3 text-center font-medium text-sm">
                  <div>Sphere (SPH)</div>
                  <div>Cylinder (CYL)</div>
                  <div>Axis</div>
                  <div>Addition (near) ADD</div>
                </div>
              </div>

              {/* Right Eye */}
              <div>
                <h4 className="font-medium mb-3">Right Eye (OD)</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Select
                      value={rightEye.sph}
                      onValueChange={(value) => {
                        const newRightEye = { ...rightEye, sph: value };
                        setHasEyesight(true);
                        setRightEye(newRightEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: getCompletePrescriptionData()
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="0.00" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {sphCylOptions.map((val) => (
                          <SelectItem key={`right-sph-${val}`} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={rightEye.cyl}
                      onValueChange={(value) => {
                        const newRightEye = { ...rightEye, cyl: value };
                        setHasEyesight(true);
                        setRightEye(newRightEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: getCompletePrescriptionData(newRightEye, leftEye)
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="0.00" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {sphCylOptions.map((val) => (
                          <SelectItem key={`right-cyl-${val}`} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={rightEye.axis}
                      onValueChange={(value) => {
                        const newRightEye = { ...rightEye, axis: value };
                        setHasEyesight(true);
                        setRightEye(newRightEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: getCompletePrescriptionData(newRightEye, leftEye)
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="0" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {axisOptions.map((val) => (
                          <SelectItem key={`right-axis-${val}`} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={rightEye.add}
                      onValueChange={(value) => {
                        const newRightEye = { ...rightEye, add: value };
                        setHasEyesight(true);
                        setRightEye(newRightEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: getCompletePrescriptionData(newRightEye, leftEye)
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="0.00" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {addOptions.map((val) => (
                          <SelectItem key={`right-add-${val}`} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Left Eye */}
              <div>
                <h4 className="font-medium mb-3">Left Eye (OS)</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Select
                      value={leftEye.sph}
                      onValueChange={(value) => {
                        const newLeftEye = { ...leftEye, sph: value };
                        setHasEyesight(true);
                        setLeftEye(newLeftEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: getCompletePrescriptionData(rightEye, newLeftEye)
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="0.00" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {sphCylOptions.map((val) => (
                          <SelectItem key={`left-sph-${val}`} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={leftEye.cyl}
                      onValueChange={(value) => {
                        const newLeftEye = { ...leftEye, cyl: value };
                        setHasEyesight(true);
                        setLeftEye(newLeftEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: getCompletePrescriptionData(rightEye, newLeftEye)
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="0.00" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {sphCylOptions.map((val) => (
                          <SelectItem key={`left-cyl-${val}`} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={leftEye.axis}
                      onValueChange={(value) => {
                        const newLeftEye = { ...leftEye, axis: value };
                        setHasEyesight(true);
                        setLeftEye(newLeftEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: getCompletePrescriptionData(rightEye, newLeftEye)
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="0" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {axisOptions.map((val) => (
                          <SelectItem key={`left-axis-${val}`} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={leftEye.add}
                      onValueChange={(value) => {
                        const newLeftEye = { ...leftEye, add: value };
                        setHasEyesight(true);
                        setLeftEye(newLeftEye);
                        onLensConfigChange({
                          hasEyesight: true,
                          lensTypeId: selectedLensType,
                          prescriptionType: 'manual',
                          prescriptionData: getCompletePrescriptionData(rightEye, newLeftEye)
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="0.00" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {addOptions.map((val) => (
                          <SelectItem key={`left-add-${val}`} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Pupillary Distance (PD) Section */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-4 mb-4">
                  <h4 className="font-semibold">Pupillary Distance (PD):</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="twoPD"
                      checked={twoPDNumbers}
                      onCheckedChange={(checked) => {
                        setTwoPDNumbers(checked as boolean);
                        if (!checked) {
                          const newRightEye = { ...rightEye, pd: '' };
                          const newLeftEye = { ...leftEye, pd: '' };
                          setRightEye(newRightEye);
                          setLeftEye(newLeftEye);
                          onLensConfigChange({
                            hasEyesight: true,
                            lensTypeId: selectedLensType,
                            prescriptionType: 'manual',
                            prescriptionData: getCompletePrescriptionData(newRightEye, newLeftEye)
                          });
                        }
                      }}
                    />
                    <Label htmlFor="twoPD" className="cursor-pointer">
                      Two PD numbers
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="addPrism"
                      checked={addPrism}
                      onCheckedChange={(checked) => setAddPrism(checked as boolean)}
                    />
                    <Label htmlFor="addPrism" className="cursor-pointer">
                      Add prism
                    </Label>
                  </div>
                </div>

                {/* PD Input Fields */}
                <div className={twoPDNumbers ? "grid grid-cols-2 gap-4 max-w-md" : "max-w-xs"}>
                  {twoPDNumbers ? (
                    <>
                      <div>
                        <Select
                          value={rightEye.pd}
                          onValueChange={(value) => {
                            const newRightEye = { ...rightEye, pd: value };
                            setHasEyesight(true);
                            setRightEye(newRightEye);
                            onLensConfigChange({
                              hasEyesight: true,
                              lensTypeId: selectedLensType,
                              prescriptionType: 'manual',
                              prescriptionData: getCompletePrescriptionData(newRightEye, leftEye)
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Right PD" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {doublePDOptions.map((val) => (
                              <SelectItem key={`right-pd-two-${val}`} value={val}>
                                {val}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Select
                          value={leftEye.pd}
                          onValueChange={(value) => {
                            const newLeftEye = { ...leftEye, pd: value };
                            setHasEyesight(true);
                            setLeftEye(newLeftEye);
                            onLensConfigChange({
                              hasEyesight: true,
                              lensTypeId: selectedLensType,
                              prescriptionType: 'manual',
                              prescriptionData: getCompletePrescriptionData(rightEye, newLeftEye)
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Left PD" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {doublePDOptions.map((val) => (
                              <SelectItem key={`left-pd-two-${val}`} value={val}>
                                {val}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <div>
                      <Select
                        value={rightEye.pd}
                        onValueChange={(value) => {
                          const newRightEye = { ...rightEye, pd: value };
                          const newLeftEye = { ...leftEye, pd: value };
                          setHasEyesight(true);
                          setRightEye(newRightEye);
                          setLeftEye(newLeftEye);
                          onLensConfigChange({
                            hasEyesight: true,
                            lensTypeId: selectedLensType,
                            prescriptionType: 'manual',
                            prescriptionData: getCompletePrescriptionData(newRightEye, newLeftEye)
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="PD" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {singlePDOptions.map((val) => (
                            <SelectItem key={`single-pd-${val}`} value={val}>
                              {val}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Prism Section */}
              {addPrism && (
                <div className="border-t pt-4">
                  {/* Prism Header Row */}
                  <div className="bg-gray-800 text-white p-3 rounded-t-lg mb-4">
                    <div className="grid grid-cols-5 gap-3 text-center font-medium text-sm">
                      <div>Add Prism</div>
                      <div>Vertical Prism</div>
                      <div>Base Direction</div>
                      <div>Horizontal Prism</div>
                      <div>Base Direction</div>
                    </div>
                  </div>

                  {/* Right Eye Prism */}
                  <div>
                    <h4 className="font-medium mb-3">Right Eye (OD)</h4>
                    <div className="grid grid-cols-5 gap-3">
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-medium">Add Prism</span>
                      </div>
                      <div>
                        <Select
                          value={rightPrism.verticalPrism}
                          onValueChange={(value) => {
                            const newRightPrism = { ...rightPrism, verticalPrism: value };
                            setRightPrism(newRightPrism);
                            onLensConfigChange({
                              hasEyesight: true,
                              lensTypeId: selectedLensType,
                              prescriptionType: 'manual',
                              prescriptionData: getCompletePrescriptionData(undefined, undefined, newRightPrism, undefined)
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="0.00" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {prismOptions.map((val) => (
                              <SelectItem key={`right-v-prism-${val}`} value={val}>
                                {val}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Select
                          value={rightPrism.verticalBase}
                          onValueChange={(value) => {
                            const newRightPrism = { ...rightPrism, verticalBase: value };
                            setRightPrism(newRightPrism);
                            onLensConfigChange({
                              hasEyesight: true,
                              lensTypeId: selectedLensType,
                              prescriptionType: 'manual',
                              prescriptionData: getCompletePrescriptionData(undefined, undefined, newRightPrism, undefined)
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="n/a" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="n/a">n/a</SelectItem>
                            <SelectItem value="Up">Up</SelectItem>
                            <SelectItem value="Down">Down</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Select
                          value={rightPrism.horizontalPrism}
                          onValueChange={(value) => {
                            const newRightPrism = { ...rightPrism, horizontalPrism: value };
                            setRightPrism(newRightPrism);
                            onLensConfigChange({
                              hasEyesight: true,
                              lensTypeId: selectedLensType,
                              prescriptionType: 'manual',
                              prescriptionData: getCompletePrescriptionData(undefined, undefined, newRightPrism, undefined)
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="0.00" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {prismOptions.map((val) => (
                              <SelectItem key={`right-h-prism-${val}`} value={val}>
                                {val}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Select
                          value={rightPrism.horizontalBase}
                          onValueChange={(value) => {
                            const newRightPrism = { ...rightPrism, horizontalBase: value };
                            setRightPrism(newRightPrism);
                            onLensConfigChange({
                              hasEyesight: true,
                              lensTypeId: selectedLensType,
                              prescriptionType: 'manual',
                              prescriptionData: getCompletePrescriptionData(undefined, undefined, newRightPrism, undefined)
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="n/a" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="n/a">n/a</SelectItem>
                            <SelectItem value="In">In</SelectItem>
                            <SelectItem value="Out">Out</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Left Eye Prism */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Left Eye (OS)</h4>
                    <div className="grid grid-cols-5 gap-3">
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-medium">Add Prism</span>
                      </div>
                      <div>
                        <Select
                          value={leftPrism.verticalPrism}
                          onValueChange={(value) => {
                            const newLeftPrism = { ...leftPrism, verticalPrism: value };
                            setLeftPrism(newLeftPrism);
                            onLensConfigChange({
                              hasEyesight: true,
                              lensTypeId: selectedLensType,
                              prescriptionType: 'manual',
                              prescriptionData: getCompletePrescriptionData(undefined, undefined, undefined, newLeftPrism)
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="0.00" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {prismOptions.map((val) => (
                              <SelectItem key={`left-v-prism-${val}`} value={val}>
                                {val}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Select
                          value={leftPrism.verticalBase}
                          onValueChange={(value) => {
                            const newLeftPrism = { ...leftPrism, verticalBase: value };
                            setLeftPrism(newLeftPrism);
                            onLensConfigChange({
                              hasEyesight: true,
                              lensTypeId: selectedLensType,
                              prescriptionType: 'manual',
                              prescriptionData: getCompletePrescriptionData(undefined, undefined, undefined, newLeftPrism)
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="n/a" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="n/a">n/a</SelectItem>
                            <SelectItem value="Up">Up</SelectItem>
                            <SelectItem value="Down">Down</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Select
                          value={leftPrism.horizontalPrism}
                          onValueChange={(value) => {
                            const newLeftPrism = { ...leftPrism, horizontalPrism: value };
                            setLeftPrism(newLeftPrism);
                            onLensConfigChange({
                              hasEyesight: true,
                              lensTypeId: selectedLensType,
                              prescriptionType: 'manual',
                              prescriptionData: getCompletePrescriptionData(undefined, undefined, undefined, newLeftPrism)
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="0.00" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {prismOptions.map((val) => (
                              <SelectItem key={`left-h-prism-${val}`} value={val}>
                                {val}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Select
                          value={leftPrism.horizontalBase}
                          onValueChange={(value) => {
                            const newLeftPrism = { ...leftPrism, horizontalBase: value };
                            setLeftPrism(newLeftPrism);
                            onLensConfigChange({
                              hasEyesight: true,
                              lensTypeId: selectedLensType,
                              prescriptionType: 'manual',
                              prescriptionData: getCompletePrescriptionData(undefined, undefined, undefined, newLeftPrism)
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="n/a" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="n/a">n/a</SelectItem>
                            <SelectItem value="In">In</SelectItem>
                            <SelectItem value="Out">Out</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LensSelector;
