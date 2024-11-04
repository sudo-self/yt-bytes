"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, AlertCircle } from "lucide-react";

interface FileInfo {
  name: string;
  size: number;
  type: string;
  file: File;
}

const Home: React.FC = () => {
  const [file, setFile] = useState<FileInfo | null>(null);
  const [format, setFormat] = useState("");
  const [url, setUrl] = useState("");
  const [downloadLinks, setDownloadLinks] = useState<{ mp3: string; m4r: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        file: selectedFile,
      });
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile({
        name: droppedFile.name,
        size: droppedFile.size,
        type: droppedFile.type,
        file: droppedFile,
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / 1048576).toFixed(2) + " MB";
  };

  const handleConvert = async () => {
    if (!file || !format) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file.file);
      formData.append("format", format);

      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name.replace(/\.[^/.]+$/, `.${format}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsConverted(true);
      } else {
        console.error("Error converting file:", await response.text());
      }
    } catch (error) {
      console.error("Error converting file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isValidYouTubeUrl = (url: string): boolean => {
    // Add your validation logic here
    return true; // Placeholder return
  };

  const fetchDownloadLinks = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isValidYouTubeUrl(url)) {
      setError("Please enter a valid YouTube URL.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/byte", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch download links");
      }
      const data = await response.json();
      setDownloadLinks(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConverted) {
      setTimeout(() => {
        setIsConverted(false);
      }, 3000);
    }
  }, [isConverted]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-6 bg-black" style={{ minHeight: "100vh" }}>
      <div className="flex flex-col items-center justify-center w-full max-w-lg h-auto bg-black rounded-lg shadow-md relative p-6">
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-500 to-gray-500 bg-clip-text text-transparent">
          YT Byte
        </h1>

        {/* URL Input for Download Links */}
        <form onSubmit={fetchDownloadLinks} className="w-full mb-4">
          <input
            type="text"
            id="url"
            name="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/"
            required
            className="bg-gray-700 w-full border-2 border-dashed border-red-600  p-2 rounded mb-4 text-white"
          />
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigator.clipboard.readText().then((text) => setUrl(text))}
              className="font-semibold py-2 px-4 rounded text-white hover:bg-gradient-to-r from-red-500 to-gray-500"
            >
              Paste
            </button>
            <button
              type="submit"
              className="font-semibold py-2 px-4 rounded text-white hover:bg-gradient-to-r from-red-500 to-gray-500"
            >
              Byte
            </button>
          </div>
        </form>

        {/* File Upload Section */}
        <div
          className="border-2 border-dashed border-red-600 rounded-lg p-8 text-center cursor-pointer bg-gray-700"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Upload className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-300">drop or tap to upload</p>
          <p className="text-sm text-gray-400 mt-2">
            <AlertCircle className="inline-block mr-1" size={16} /> Max file size: 50 MB
          </p>
        </div>

        {/* File Details */}
        {file && (
          <div className="mt-4 p-4 bg-gray-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <Upload className="text-red-500" size={24} />
              </div>
              <div>
                <p className="font-semibold">{file.name}</p>
                <p className="text-sm text-gray-400">
                  {file.type} - {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                className="p-2 rounded-full hover:bg-gray-600"
                onClick={() => setFile(null)} // Assuming removeFile function resets file state
              >
                <Trash2 className="text-gray-300" size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Format Selection */}
        <div className="flex flex-col items-center justify-center my-4 bg-black rounded-lg p-4">
          <select
            name="format"
            className="w-64 border rounded-md p-2 mb-2 bg-gray-700 text-white"
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="">Select a Format</option>
            <option value="wav">High Quality .wav</option>
            <option value="mp3">Android .mp3</option>
            <option value="m4r">iPhone .m4r</option>
          </select>
          <button
            onClick={handleConvert}
            className="font-semibold py-2 px-4 rounded hover:bg-gradient-to-r from-red-500 to-gray-500"
            disabled={isLoading || !file || !format}
          >
            {isLoading ? "Converting..." : "Convert"}
          </button>
        </div>

        {/* Download Links */}
        {downloadLinks && (
          <div className="mt-4 p-4 bg-black rounded-lg">
            <h3 className="text-lg font-semibold">YT Ringtones</h3>
            <ul className="mt-2">
              <li>
                <a href={downloadLinks.mp3} download className="text-red-600 hover:underline">
                  ANDROID MP3
                </a>
              </li>
              <li>
                <a href={downloadLinks.m4r} download className="text-red-600 hover:underline">
                  iPHONE MP4
                </a>
              </li>
            </ul>
          </div>
        )}

        {/* Error Messages */}
        {error && <p className="mt-4 text-red-500">{error}</p>}
        {isConverted && <p className="mt-4 text-green-500">File converted and downloaded successfully!</p>}
      </div>
    </div>
  );
};

export default Home;





