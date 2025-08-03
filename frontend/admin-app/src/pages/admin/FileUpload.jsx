import React, { useState } from 'react';
import { Upload, File, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import httpClient from '../../services/httpClient';
import { API_CONFIG } from '../../utils/config';
import { useNotifications } from '../../context/NotificationContext';

const FileUpload = () => {
  const { addTaskNotification } = useNotifications();
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null
  const [uploadResult, setUploadResult] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [draftTasks, setDraftTasks] = useState(null); // Store draft tasks for confirmation

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    // Validate file type
    const allowedTypes = ['.csv', '.xls', '.xlsx'];
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      setUploadStatus('error');
      setUploadResult({
        message: 'Invalid file type. Please upload CSV, XLS, or XLSX files only.',
        details: null
      });
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadStatus('error');
      setUploadResult({
        message: 'File size too large. Please upload files smaller than 10MB.',
        details: null
      });
      return;
    }

    setFile(selectedFile);
    setUploadStatus(null);
    setUploadResult(null);
  };

  const handleFileInput = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await httpClient.post(API_CONFIG.ENDPOINTS.TASKS.DRAFT_UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadStatus('success');
      setUploadResult({
        message: 'File uploaded and processed successfully!',
        details: {
          totalRecords: response.data.total || 0,
          validRecords: response.data.total || 0,
          errors: [],
          preview: response.data.draft || []
        }
      });
      
      // Store the draft tasks for confirmation
      setDraftTasks(response.data.draft || []);
      
      if (response.data.draft && response.data.draft.length > 0) {
        setPreviewData(response.data.draft.slice(0, 5)); // Show first 5 records
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadResult({
        message: error.response?.data?.message || 'Upload failed. Please try again.',
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          errorData: error.response?.data,
          fullError: error.message
        }
      });
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadStatus(null);
    setUploadResult(null);
    setPreviewData([]);
    setDraftTasks(null); // Clear draft tasks as well
  };

  const confirmAssignment = async () => {
    if (!draftTasks || draftTasks.length === 0) {
      setUploadStatus('error');
      setUploadResult({
        message: 'No draft tasks to confirm. Please upload a file first.',
        details: null
      });
      return;
    }

    try {
      setUploading(true);
      const response = await httpClient.post(API_CONFIG.ENDPOINTS.TASKS.CONFIRM_DRAFT, {
        tasks: draftTasks
      });
      
      setUploadStatus('success');
      setUploadResult({
        message: 'Tasks have been successfully assigned to agents!',
        details: {
          assignedTasks: response.data.count || draftTasks.length,
          agentsInvolved: new Set(draftTasks.map(task => task.agentId)).size
        }
      });
      
      // Add success notification
      addTaskNotification('bulk_upload', {
        count: response.data.count || draftTasks.length,
        agents: new Set(draftTasks.map(task => task.agentId)).size
      });
      
      // Clear draft tasks after successful confirmation
      setDraftTasks(null);
      
    } catch (error) {
      console.error('Confirm assignment error:', error);
      setUploadStatus('error');
      setUploadResult({
        message: error.response?.data?.message || 'Assignment failed. Please try again.',
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          errorData: error.response?.data,
          fullError: error.message
        }
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Tasks</h1>
        <p className="mt-2 text-gray-600">
          Upload CSV, XLS, or XLSX files to distribute tasks to agents
        </p>
      </div>

      {/* File Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">File Upload</h3>
        
        {!file ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary-400 bg-primary-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Drop your file here, or click to browse
            </h4>
            <p className="text-gray-600 mb-4">
              Supports CSV, XLS, and XLSX files up to 10MB
            </p>
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 cursor-pointer"
            >
              Select File
            </label>
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <File className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={clearFile}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-4 flex space-x-3">
              <button
                onClick={uploadFile}
                disabled={uploading}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Processing...' : 'Upload & Process'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Results */}
      {uploadStatus && (
        <div className={`rounded-lg p-4 ${
          uploadStatus === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start space-x-3">
            {uploadStatus === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-medium ${
                uploadStatus === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {uploadResult?.message}
              </h4>
              
              {uploadResult?.details && (
                <div className="mt-2 text-sm">
                  {uploadResult.details.totalRecords && (
                    <p className="text-gray-600">
                      Total Records: {uploadResult.details.totalRecords} | 
                      Valid Records: {uploadResult.details.validRecords}
                    </p>
                  )}
                  
                  {uploadResult.details.assignedTasks && (
                    <p className="text-gray-600">
                      Assigned Tasks: {uploadResult.details.assignedTasks} | 
                      Agents Involved: {uploadResult.details.agentsInvolved}
                    </p>
                  )}
                  
                  {uploadResult.details.errors && uploadResult.details.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-red-600 font-medium">Errors:</p>
                      <ul className="list-disc list-inside text-red-600">
                        {uploadResult.details.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {uploadResult.details.status && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                      <p><strong>Status:</strong> {uploadResult.details.status} {uploadResult.details.statusText}</p>
                      {uploadResult.details.fullError && (
                        <p><strong>Error:</strong> {uploadResult.details.fullError}</p>
                      )}
                      {uploadResult.details.errorData && (
                        <p><strong>Details:</strong> {JSON.stringify(uploadResult.details.errorData, null, 2)}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {uploadStatus === 'success' && draftTasks && draftTasks.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={confirmAssignment}
                    disabled={uploading}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Assigning...' : 'Confirm & Assign Tasks'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Preview */}
      {previewData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Preview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Agent
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((task, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.firstName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.notes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.draftAssignedTo?.name || 'Not assigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Upload Instructions</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Supported formats: CSV, XLS, XLSX</li>
          <li>• Maximum file size: 10MB</li>
          <li>• Required columns: name, email, phone (optional: address, company)</li>
          <li>• Tasks will be automatically distributed among available agents</li>
          <li>• Review the preview before confirming task assignment</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;
