import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LogoSetting {
  type: 'text' | 'image';
  text?: string;
  url?: string;
}

export const useSiteSettings = () => {
  const [headerLogo, setHeaderLogo] = useState<LogoSetting>({ type: 'text', text: 'Tashna Eyewear' });
  const [footerLogo, setFooterLogo] = useState<LogoSetting>({ type: 'text', text: 'Tashna Eyewear' });
  const [seoLogo, setSeoLogo] = useState<string>('/tashna-logo.png');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();

    // Subscribe to changes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (supabase as any)
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        // Use defaults if table doesn't exist
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

  return { headerLogo, footerLogo, seoLogo, loading };
};
