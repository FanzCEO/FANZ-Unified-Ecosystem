"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectUploader = ObjectUploader;
const react_1 = require("react");
const core_1 = __importDefault(require("@uppy/core"));
const react_2 = require("@uppy/react");
const aws_s3_1 = __importDefault(require("@uppy/aws-s3"));
const button_1 = require("@/components/ui/button");
/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 *
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 *
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 *
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
function ObjectUploader({ maxNumberOfFiles = 1, maxFileSize = 10485760, // 10MB default
onGetUploadParameters, onComplete, buttonClassName, children, }) {
    const [showModal, setShowModal] = (0, react_1.useState)(false);
    const [uppy] = (0, react_1.useState)(() => new core_1.default({
        restrictions: {
            maxNumberOfFiles,
            maxFileSize,
        },
        autoProceed: false,
    })
        .use(aws_s3_1.default, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
    })
        .on("complete", (result) => {
        onComplete === null || onComplete === void 0 ? void 0 : onComplete(result);
    }));
    return (React.createElement("div", null,
        React.createElement(button_1.Button, { onClick: () => setShowModal(true), className: buttonClassName }, children),
        React.createElement(react_2.DashboardModal, { uppy: uppy, open: showModal, onRequestClose: () => setShowModal(false), proudlyDisplayPoweredByUppy: false })));
}
