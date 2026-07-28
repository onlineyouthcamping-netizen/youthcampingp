import { useEffect } from "react";

interface StaticWorkspacePageProps {
  src: string;
  title: string;
}

export default function StaticWorkspacePage({ src, title }: StaticWorkspacePageProps) {
  useEffect(() => {
    document.title = `${title} - YouthCamping Admin`;
  }, [title]);

  return (
    <div className="w-full h-[calc(100vh-140px)] min-h-[600px] border-0 rounded-2xl overflow-hidden bg-white shadow-sm">
      <iframe
        src={src}
        title={title}
        className="w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
    </div>
  );
}
