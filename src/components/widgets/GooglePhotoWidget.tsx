import { useRef, useState } from "react";
import Card from "./Card";

interface GooglePhotoWidgetProps {
  albumUrl: string; // Google Photos album URL
}

export default function GooglePhotoWidget({
  albumUrl
}: GooglePhotoWidgetProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert short URL to embed URL
  const getEmbedUrl = (url: string) => {
    // For Google Photos albums, we can use the album URL directly in an iframe
    // The URL format is: https://photos.google.com/share/[ALBUM_ID]?key=[KEY]
    return url;
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <Card centered={false}>
      <div style={{ 
        position: "relative", 
        width: "100%", 
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "#000"
      }}>
        {isLoading && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#fff",
            fontSize: "14px",
            zIndex: 10
          }}>
            Loading album...
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={getEmbedUrl(albumUrl)}
          onLoad={handleIframeLoad}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: isLoading ? "none" : "block"
          }}
          title="Google Photos Album"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          allow="fullscreen"
        />
      </div>
    </Card>
  );
}

