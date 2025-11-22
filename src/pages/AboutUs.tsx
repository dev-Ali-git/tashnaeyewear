import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";

const AboutUs = () => {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPageContent();
  }, []);

  const fetchPageContent = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('pages')
        .select('content')
        .eq('slug', 'about-us')
        .single();

      if (error) throw error;
      if (data) setContent(data.content || "");
    } catch (error) {
      console.error('Error fetching page content:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="About Us - Tashna Eyewear"
        description="Learn about Tashna Eyewear's mission to provide premium eyewear in Pakistan."
        canonical="/about-us"
      />
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">About Us</h1>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : content ? (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <div className="prose max-w-none">
              <p>About us content will be available soon.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
