import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Eye,
  FileText,
  File,
  Image,
  Archive,
  Music,
  Video,
  Code,
} from "lucide-react";
import * as mammoth from "mammoth";
import "./FilePreviewModal.css";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  title?: string;
  allowTxt?: boolean; // new prop
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  title = "File Preview",
  allowTxt = true, // default true for job description, false for resume
}) => {
  const [previewContent, setPreviewContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [previewType, setPreviewType] = useState<
    "pdf" | "text" | "html" | "image" | "unsupported"
  >("unsupported");

  useEffect(() => {
    if (isOpen && file) {
      generatePreview();
    }
    return () => {
      // Cleanup blob URLs
      if (
        previewContent &&
        (previewType === "pdf" || previewType === "image")
      ) {
        URL.revokeObjectURL(previewContent);
      }
    };
  }, [isOpen, file]);

  const generatePreview = async () => {
    if (!file) return;

    setIsLoading(true);
    setError("");
    setPreviewContent("");

    try {
      const fileType = file.type;
      const fileName = file.name.toLowerCase();

      if (fileType === "application/pdf") {
        // PDF files
        const blobUrl = URL.createObjectURL(file);
        setPreviewContent(blobUrl);
        setPreviewType("pdf");
      } else if ((fileType === "text/plain" || fileName.endsWith(".txt")) && allowTxt) {
        // TXT files (only if allowed)
        const text = await file.text();
        setPreviewContent(text);
        setPreviewType("text");
      } else if ((fileType === "text/plain" || fileName.endsWith(".txt")) && !allowTxt) {
        setError("TXT files are not allowed for resume preview.");
        setPreviewType("unsupported");
      } else if (
        fileType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileName.endsWith(".docx")
      ) {
        // DOCX files using mammoth.js
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setPreviewContent(result.value);
          setPreviewType("html");

          // Log any messages from mammoth
          if (result.messages && result.messages.length > 0) {
            console.log("Mammoth conversion messages:", result.messages);
          }
        } catch (docxError) {
          console.error("DOCX conversion error:", docxError);
          setError(
            "Failed to convert DOCX file. The file may be corrupted or use unsupported features."
          );
        }
      } else if (fileType.startsWith("image/")) {
        // Image files
        const blobUrl = URL.createObjectURL(file);
        setPreviewContent(blobUrl);
        setPreviewType("image");
      } else if (
        fileType.startsWith("text/") ||
        fileName.endsWith(".js") ||
        fileName.endsWith(".ts") ||
        fileName.endsWith(".tsx") ||
        fileName.endsWith(".jsx") ||
        fileName.endsWith(".css") ||
        fileName.endsWith(".scss") ||
        fileName.endsWith(".html") ||
        fileName.endsWith(".xml") ||
        fileName.endsWith(".json") ||
        fileName.endsWith(".md") ||
        fileName.endsWith(".py") ||
        fileName.endsWith(".java") ||
        fileName.endsWith(".cpp") ||
        fileName.endsWith(".c") ||
        fileName.endsWith(".php") ||
        fileName.endsWith(".rb") ||
        fileName.endsWith(".go") ||
        fileName.endsWith(".rs") ||
        fileName.endsWith(".sql")
      ) {
        // Text-based files (code, markup, etc.)
        const text = await file.text();
        setPreviewContent(text);
        setPreviewType("text");
      } else {
        setError(
          `${
            fileType || "Unknown file type"
          } files cannot be previewed directly. Please download the file to view its contents.`
        );
        setPreviewType("unsupported");
      }
    } catch (err) {
      setError("Failed to load file preview.");
      console.error("Preview error:", err);
      setPreviewType("unsupported");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getFileIcon = () => {
    if (!file) return <File className="w-8 h-8 text-gray-500" />;

    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (fileType === "application/pdf") {
      return <FileText className="w-8 h-8 text-red-500" />;
    } else if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      return <FileText className="w-8 h-8 text-blue-600" />;
    } else if (fileType === "text/plain" || fileName.endsWith(".txt")) {
      return <FileText className="w-8 h-8 text-green-600" />;
    } else if (fileType.startsWith("image/")) {
      return <Image className="w-8 h-8 text-purple-500" />;
    } else if (
      fileName.endsWith(".js") ||
      fileName.endsWith(".ts") ||
      fileName.endsWith(".tsx") ||
      fileName.endsWith(".jsx") ||
      fileName.endsWith(".css") ||
      fileName.endsWith(".html") ||
      fileName.endsWith(".json") ||
      fileName.endsWith(".xml") ||
      fileName.endsWith(".py") ||
      fileName.endsWith(".java") ||
      fileName.endsWith(".cpp") ||
      fileName.endsWith(".c") ||
      fileName.endsWith(".php") ||
      fileName.endsWith(".rb") ||
      fileName.endsWith(".go") ||
      fileName.endsWith(".rs") ||
      fileName.endsWith(".sql")
    ) {
      return <Code className="w-8 h-8 text-orange-500" />;
    } else if (
      fileName.endsWith(".zip") ||
      fileName.endsWith(".rar") ||
      fileName.endsWith(".7z") ||
      fileName.endsWith(".tar") ||
      fileName.endsWith(".gz")
    ) {
      return <Archive className="w-8 h-8 text-yellow-600" />;
    } else if (fileType.startsWith("audio/")) {
      return <Music className="w-8 h-8 text-pink-500" />;
    } else if (fileType.startsWith("video/")) {
      return <Video className="w-8 h-8 text-indigo-500" />;
    } else {
      return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      php: "php",
      rb: "ruby",
      go: "go",
      rs: "rust",
      sql: "sql",
      css: "css",
      scss: "scss",
      html: "html",
      xml: "xml",
      json: "json",
      md: "markdown",
      txt: "text",
    };
    return languageMap[ext || ""] || "text";
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="file-preview-loading">
          <div className="loading-spinner2"></div>
          <p className="loading-text">Loading preview...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="file-preview-error">
          <div className="error-icon-container">
            <Eye className="w-12 h-12 text-red-600" />
          </div>
          <p>{error}</p>
          {file && (
            <button
              onClick={handleDownload}
              className="file-preview-download-btn-large"
            >
              <Download className="w-4 h-4" />
              Download File
            </button>
          )}
        </div>
      );
    }

    switch (previewType) {
      case "pdf":
        return (
          <div className="file-preview-pdf-container">
            <iframe
              src={previewContent}
              title="PDF Preview"
              className="file-preview-pdf"
            />
          </div>
        );

      case "image":
        return (
          <div className="file-preview-image-container">
            <img
              src={previewContent}
              alt="Preview"
              className="file-preview-image"
            />
          </div>
        );

      case "html":
        return (
          <div className="file-preview-html-container">
            <div className="file-preview-html-content">
              <div dangerouslySetInnerHTML={{ __html: previewContent }} />
            </div>
          </div>
        );

      case "text":
        return (
          <div className="file-preview-text-container">
            <div className="file-preview-text-wrapper">
              <div className="file-preview-text-header">
                <span className="file-preview-text-filename">
                  {file?.name || "Unknown file"}
                </span>
                <span className="file-preview-text-language">
                  {getLanguageFromFileName(file?.name || "")}
                </span>
              </div>
              <pre className="file-preview-text">{previewContent}</pre>
            </div>
          </div>
        );

      default:
        return (
          <div className="file-preview-error">
            <div className="error-icon-container">
              <Eye className="w-12 h-12 text-red-600" />
            </div>
            <p>This file type is not supported for preview.</p>
            {file && (
              <button
                onClick={handleDownload}
                className="file-preview-download-btn-large"
              >
                <Download className="w-4 h-4" />
                Download File
              </button>
            )}
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="file-preview-overlay" onClick={handleOverlayClick}>
      <div className="file-preview-modal">
        {/* Header */}
        <div className="file-preview-header">
          <div className="file-preview-title">
            <div className="file-preview-icon-container">{getFileIcon()}</div>
            <div className="file-preview-info">
              <h3>{title}</h3>
              {file && (
                <div className="file-preview-details">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="file-preview-actions">
            {file && (
              <button
                onClick={handleDownload}
                className="file-preview-download-btn"
                title="Download file"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="file-preview-close-btn"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="file-preview-content">{renderContent()}</div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
