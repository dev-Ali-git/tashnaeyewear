import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import PagesManagement from "./Pages";

interface LogoSetting {
  type: 'text' | 'image';
  text?: string;
  url?: string;
}

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  
  const [headerLogo, setHeaderLogo] = useState<LogoSetting>({ type: 'text', text: 'Tashna Eyewear' });
  const [footerLogo, setFooterLogo] = useState<LogoSetting>({ type: 'text', text: 'Tashna Eyewear' });
  const [seoLogo, setSeoLogo] = useState<string>('/tashna-logo.png');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('site_settings')
        .select('*')
        .in('setting_key', ['header_logo', 'footer_logo', 'seo_logo']);

      if (error) {
        console.error('Error fetching settings:', error);
        // Don't show error if table doesn't exist yet - just use defaults
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        data.forEach((setting: { setting_key: string; setting_value: LogoSetting | { url: string } }) => {
          if (setting.setting_key === 'header_logo') {
            setHeaderLogo(setting.setting_value as LogoSetting);
          } else if (setting.setting_key === 'footer_logo') {
            setFooterLogo(setting.setting_value as LogoSetting);
          } else if (setting.setting_key === 'seo_logo') {
            setSeoLogo((setting.setting_value as { url: string }).url);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Use defaults on error
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, settingType: 'header' | 'footer' | 'seo') => {
    setUploading(settingType);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${settingType}-logo-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Try uploading to 'logos' bucket first
      let publicUrl = '';
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        // Fallback: convert to base64 data URL for local testing
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          if (settingType === 'seo') {
            setSeoLogo(base64String);
          } else {
            const setter = settingType === 'header' ? setHeaderLogo : setFooterLogo;
            setter({ type: 'image', url: base64String });
          }
          toast({
            title: "Success",
            description: "Logo uploaded successfully (using fallback method)"
          });
          setUploading(null);
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      publicUrl = data.publicUrl;

      if (settingType === 'seo') {
        setSeoLogo(publicUrl);
      } else {
        const setter = settingType === 'header' ? setHeaderLogo : setFooterLogo;
        setter({ type: 'image', url: publicUrl });
      }

      toast({
        title: "Success",
        description: "Logo uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(null);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updates = [
        { setting_key: 'header_logo', setting_value: headerLogo },
        { setting_key: 'footer_logo', setting_value: footerLogo },
        { setting_key: 'seo_logo', setting_value: { url: seoLogo } }
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('site_settings')
        .upsert(updates, { onConflict: 'setting_key' });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Site Settings</h1>

      <Tabs defaultValue="logos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logos">Logo Settings</TabsTrigger>
          <TabsTrigger value="pages">Pages Management</TabsTrigger>
        </TabsList>

        <TabsContent value="logos" className="space-y-6">
          {/* Header Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Header Logo</CardTitle>
              <CardDescription>Choose between text or image logo for the header</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={headerLogo.type} onValueChange={(value) => setHeaderLogo({ ...headerLogo, type: value as 'text' | 'image' })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="header-text" />
                  <Label htmlFor="header-text">Text Logo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="image" id="header-image" />
                  <Label htmlFor="header-image">Image Logo</Label>
                </div>
              </RadioGroup>

              {headerLogo.type === 'text' && (
                <div>
                  <Label htmlFor="header-text-input">Logo Text</Label>
                  <Input
                    id="header-text-input"
                    value={headerLogo.text || ''}
                    onChange={(e) => setHeaderLogo({ ...headerLogo, text: e.target.value })}
                    placeholder="Tashna Eyewear"
                  />
                </div>
              )}

              {headerLogo.type === 'image' && (
                <div>
                  <Label htmlFor="header-image-upload">Logo Image</Label>
                  <div className="flex items-center gap-4 mt-2">
                    {headerLogo.url && (
                      <img src={headerLogo.url} alt="Header Logo" className="h-12 w-auto border rounded" />
                    )}
                    <Input
                      id="header-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'header')}
                      disabled={uploading === 'header'}
                    />
                    {uploading === 'header' && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Footer Logo</CardTitle>
              <CardDescription>Choose between text or image logo for the footer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={footerLogo.type} onValueChange={(value) => setFooterLogo({ ...footerLogo, type: value as 'text' | 'image' })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="footer-text" />
                  <Label htmlFor="footer-text">Text Logo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="image" id="footer-image" />
                  <Label htmlFor="footer-image">Image Logo</Label>
                </div>
              </RadioGroup>

              {footerLogo.type === 'text' && (
                <div>
                  <Label htmlFor="footer-text-input">Logo Text</Label>
                  <Input
                    id="footer-text-input"
                    value={footerLogo.text || ''}
                    onChange={(e) => setFooterLogo({ ...footerLogo, text: e.target.value })}
                    placeholder="Tashna Eyewear"
                  />
                </div>
              )}

              {footerLogo.type === 'image' && (
                <div>
                  <Label htmlFor="footer-image-upload">Logo Image</Label>
                  <div className="flex items-center gap-4 mt-2">
                    {footerLogo.url && (
                      <img src={footerLogo.url} alt="Footer Logo" className="h-10 w-auto border rounded" />
                    )}
                    <Input
                      id="footer-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'footer')}
                      disabled={uploading === 'footer'}
                    />
                    {uploading === 'footer' && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Logo */}
          <Card>
            <CardHeader>
              <CardTitle>SEO & Social Sharing Logo</CardTitle>
              <CardDescription>Logo used for Open Graph, Twitter cards, and structured data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="seo-logo-upload">Logo Image</Label>
              <div className="flex items-center gap-4">
                {seoLogo && (
                  <img src={seoLogo} alt="SEO Logo" className="h-16 w-auto border rounded" />
                )}
                <Input
                  id="seo-logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'seo')}
                  disabled={uploading === 'seo'}
                />
                {uploading === 'seo' && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </CardContent>
          </Card>

          <Button onClick={saveSettings} disabled={saving} size="lg" className="w-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Logo Settings
          </Button>
        </TabsContent>

        <TabsContent value="pages">
          <PagesManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
