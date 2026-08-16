import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogImage?: string;
  schema?: object | object[];
}

export default function Seo({ 
  title, 
  description, 
  canonicalPath = '', 
  ogImage = 'https://res.cloudinary.com/akmvlt3d/image/upload/v1786879810/Fitkode_icon_75_by_75.png',
  schema 
}: SeoProps) {
  const url = `https://fitkode.com${canonicalPath}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <link rel="icon" href="https://res.cloudinary.com/akmvlt3d/image/upload/v1786879810/Fitkode_icon_75_by_75.png" type="image/png" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
