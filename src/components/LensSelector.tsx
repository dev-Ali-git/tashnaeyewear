import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload } from "lucide-react";

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
  const [hasEyesight, setHasEyesight] = useState<boolean>(false);
  const [selectedLensType, setSelectedLensType] = useState<string>("");
  const [prescriptionType, setPrescriptionType] = useState<'upload' | 'manual'>('upload');
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
      prescriptionType: hasEye ? prescriptionType : undefined
    });
  };

  const handleLensTypeChange = (lensTypeId: string) => {
    setSelectedLensType(lensTypeId);
    onLensConfigChange({
      hasEyesight,
      lensTypeId,
      prescriptionType
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
          
          <RadioGroup value={prescriptionType} onValueChange={(v) => setPrescriptionType(v as 'upload' | 'manual')}>
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
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload your prescription (JPG, PNG, or PDF)
              </p>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
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
