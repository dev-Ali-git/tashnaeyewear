import { Helmet } from "react-helmet-async";
import { useSiteSettings } from "@/hooks/use-site-settings";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  type?: string;
  name?: string;
  image?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema?: Record<string, any>;
}

export const SEO = ({
  title,
  description,
  canonical,
  type = "website",
  name = "Tashna Eyewear",
  image,
  schema,
}: SEOProps) => {
  const { seoLogo } = useSiteSettings();
  const siteUrl = "https://tashnaeyewear.com";
  const fullCanonical = canonical ? `${siteUrl}${canonical}` : siteUrl;
  const finalImage = image || seoLogo;

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:site_name" content={name} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={finalImage} />

      {/* Structured Data */}
      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
    </Helmet>
  );
};
