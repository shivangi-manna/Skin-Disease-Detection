# DermScan AI - Skin Disease Detection using Hybrid Ensemble CNN

DermScan AI is a sophisticated computer-aided diagnosis (CAD) system designed to detect skin cancer with high accuracy. This project leverages a novel **Hybrid Convolutional Neural Network (H-CNN) framework**, utilizing transfer learning and adaptive feature fusion across eight state-of-the-art pre-trained architectures.

## Motivation
Skin cancer is the most prevalent type of cancer worldwide. While early detection can increase the five-year survival rate for conditions like melanoma to 99%, traditional diagnostic methods (visual inspection, dermoscopy) suffer from subjectivity, and biopsy is invasive and time-consuming. Deep learning offers a powerful alternative, but single CNN models often struggle with complex dermoscopic variations. This project introduces a hybrid ensemble approach to overcome these limitations.

## Key Contributions
- **Hybrid Ensemble Architecture**: Synergistic combination of 8 pre-trained CNN models: VGG16, VGG19, ResNet101V2, ResNet152V2, DenseNet201, Xception, InceptionV3, and MobileNetV3.
- **Feature Concatenation**: Extracts features using global average pooling from each backbone and concatenates them to form a highly rich, comprehensive feature representation.
- **Shared Classification Head**: A custom dense neural network head with batch normalization and dropout to prevent overfitting and ensure robust, multi-class skin lesion categorization.

## Model Architecture Details
The system utilizes the collective intelligence of diverse architectures:
- **VGG16 & VGG19**: Excellent for capturing fine-grained hierarchical details.
- **ResNet101V2 & ResNet152V2**: Captures highly intricate features through deep residual learning.
- **DenseNet201**: Ensures strong feature reuse and parameter efficiency.
- **Xception & InceptionV3**: Provide computationally efficient extraction at multiple scales simultaneously.
- **MobileNetV3**: Lightweight optimization.

*The Hybrid Ensemble Model achieves high accuracy (up to ~89% combined), balancing precision (~92%) and recall (~87%) effectively across challenging datasets.*

## Frontend Interface
The web application is built using React and modern CSS, offering a consumer-friendly, step-by-step diagnostic wizard.
- **Top-Nav Layout**: Clean navigation for Home, Scanner, History, and Settings.
- **Diagnostic Wizard**: Guides users through uploading, reviewing, and analyzing skin lesion images in real-time.
- **History Tracking**: Saves previous scans locally for easy reference and monitoring over time.

## Backend API
Built with FastAPI, the backend processes images and passes them through the AI model for inference. 
*(Note: To run locally, ensure you place the fully trained ensemble `.h5` model file in the root directory).*

## Setup & Installation

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
pip install fastapi uvicorn tensorflow pillow numpy
uvicorn main:app --reload
```
