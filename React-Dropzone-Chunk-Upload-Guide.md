# React Large File Chunk Upload Guide

This guide explains how to upload large video files in chunks from a React frontend to your Laravel backend. 

## 1. Understanding the Backend Requirements

Based on your `routes/api.php` and `VideoUploadController.php`, the backend requires the following configuration:

- **Endpoint:** `POST /api/dashboard/lesson/upload-chunk` *(assuming your API routes are prefixed with `/api`)*
- **Authentication:** Requires Sanctum (`Bearer [Token]`).
- **Expected Payload Parameters:**
  - `file`: The actual binary video chunk.
  - `lesson_id`: The ID of the lesson this video belongs to.
  - `dzuuid`: A unique identifier for the entire file upload process.
  - `dzchunkindex`: The current index of the chunk being uploaded (starts at 0).
  - `dztotalchunkcount`: The total number of chunks.

---

## 2. Approach A: Using Vanilla Dropzone.js in React (Easiest)

The parameters `dzuuid`, `dzchunkindex`, and `dztotalchunkcount` are native to the [Dropzone.js](https://docs.dropzone.dev/) library. If you use the core Dropzone library wrapped in a React component, it will automatically handle generating the UUID, splitting the chunks, and sending those parameters.

### Installation
```bash
npm install dropzone
```

### React Component Approach A
```jsx
import React, { useEffect, useRef } from 'react';
import Dropzone from 'dropzone';
import 'dropzone/dist/dropzone.css';

const VideoChunkUploader = ({ lessonId, bearerToken }) => {
    const dropzoneNode = useRef(null);

    useEffect(() => {
        // Prevent Dropzone from automatically discovering all elements
        Dropzone.autoDiscover = false;

        const myDropzone = new Dropzone(dropzoneNode.current, {
            url: "http://your-app-domain.com/api/dashboard/lesson/upload-chunk", // Adjust your base URL
            chunking: true,                  // Enable chunking
            forceChunking: true,             // Force chunking even for smaller files
            chunkSize: 2000000,              // 2MB chunks (adjust as needed)
            parallelChunkUploads: false,     // Disable parallel chunks to avoid server race conditions
            retryChunks: true,               // Retry failed chunks automatically
            retryChunksLimit: 3,
            maxFilesize: 5000,               // Max file size in MB (e.g., 5GB)
            acceptedFiles: "video/*",
            headers: {
                "Authorization": `Bearer ${bearerToken}`,
                "Accept": "application/json"
            },
            init: function () {
                // Append the required `lesson_id` on every chunk request
                this.on("sending", function (file, xhr, formData) {
                    formData.append("lesson_id", lessonId);
                });

                // Listen for overall success
                this.on("success", function (file, response) {
                    console.log("Upload completed successfully!", response);
                });

                // Listen for chunk errors
                this.on("error", function (file, response) {
                    console.error("Upload failed", response);
                });
            }
        });

        // Cleanup on unmount
        return () => {
            myDropzone.destroy();
        };
    }, [lessonId, bearerToken]);

    return (
        <div 
            ref={dropzoneNode} 
            className="dropzone" 
            style={{ border: "2px dashed #007bff", padding: "50px", textAlign: "center", cursor: "pointer" }}
        >
            <p>Drag & Drop a video file here, or click to browse</p>
        </div>
    );
};

export default VideoChunkUploader;
```

---

## 3. Approach B: Using `react-dropzone` with Axios (Custom Chunking)

If you are using the popular UI library [`react-dropzone`](https://react-dropzone.js.org/) (which does not do chunking out of the box), you will need to slice the file manually using Javascript's `Blob.slice()` and send it out via Axios.

### Installation
```bash
npm install react-dropzone axios uuid
```

### React Component Approach B
```jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const CustomVideoUploader = ({ lessonId, bearerToken }) => {
    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        setProgress(0);

        const chunkSize = 2 * 1024 * 1024; // 2MB
        const totalChunks = Math.ceil(file.size / chunkSize);
        const dzuuid = uuidv4(); // Generate unique Dropzone-style UUID

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);

            const formData = new FormData();
            formData.append('file', chunk, file.name); // The video chunk itself
            formData.append('lesson_id', lessonId);
            formData.append('dzuuid', dzuuid);
            formData.append('dzchunkindex', chunkIndex);
            formData.append('dztotalchunkcount', totalChunks);

            try {
                const response = await axios.post(
                    'http://your-app-domain.com/api/dashboard/lesson/upload-chunk', 
                    formData, 
                    {
                        headers: {
                            'Authorization': `Bearer ${bearerToken}`,
                            'Content-Type': 'multipart/form-data',
                            'Accept': 'application/json'
                        }
                    }
                );
                
                // Update Progress State
                const currentProgress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
                setProgress(currentProgress);

                // Check final completion output
                if (response.status === 201) {
                    console.log('Final path created on Server:', response.data.path);
                    alert("Upload Complete!");
                }

            } catch (error) {
                console.error(`Error uploading chunk ${chunkIndex + 1}`, error);
                alert("Upload failed. Check console.");
                setIsUploading(false);
                return; // Stop the loop on error
            }
        }
        
        setIsUploading(false);
    }, [lessonId, bearerToken]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.avi', '.mov', '.mkv'] },
        maxFiles: 1
    });

    return (
        <div>
            <div 
                {...getRootProps()} 
                style={{
                    border: '2px dashed #cccccc',
                    backgroundColor: isDragActive ? '#f0f8ff' : '#fafafa',
                    padding: '40px',
                    textAlign: 'center',
                    cursor: 'pointer'
                }}
            >   
                <input {...getInputProps()} />
                <p>Drag & drop some video files here, or click to select files</p>
            </div>

            {isUploading && (
                <div style={{ marginTop: '20px' }}>
                    <p>Uploading... {progress}%</p>
                    <div style={{ width: '100%', background: '#eee', height: '10px' }}>
                        <div style={{ width: `${progress}%`, background: '#28a745', height: '100%' }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomVideoUploader;
```

## Summary of How Backend Evaluates These

Once the correct payload mapping is fulfilled via either approach:
1. `UploadService->handleChunk()` evaluates the `dzchunkindex`.
2. As chunks get successfully processed, the server yields `200 Chunk received`.
3. Upon fetching the last chunk (where `dzchunkindex + 1 == dztotalchunkcount`), the controller finishes reconstructing the final file, updates the `video_url` metric in `Lesson::update()`, and yields a `201 Upload complete` structure.
