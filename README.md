# 🩺 DermScan AI - Skin Disease Detection using CNN

![Skin Cancer Detection](https://img.shields.io/badge/AI-Deep--Learning-00f2fe?style=for-the-badge&logo=tensorflow)
![Python](https://img.shields.io/badge/Python-3.9+-7c3aed?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)

DermScan AI is a state-of-the-art medical imaging tool designed to assist in the early detection and classification of various skin diseases. Built with **TensorFlow/Keras** and a **FastAPI** backend, it leverages Convolutional Neural Networks (CNN) to achieve high-precision results.

### 🌐 Live Demo
- **Frontend (Vercel)**: [https://skin-disease-detection-sigma.vercel.app/](https://skin-disease-detection-sigma.vercel.app/)
- **Backend (Render)**: [https://skin-disease-detection-c79p.onrender.com](https://skin-disease-detection-c79p.onrender.com)

## ✨ Key Features

- **High Precision Classification**: Achieve up to **97.6% precision** in identifying skin lesions.
- **Real-time Analysis**: Instant scanning and result generation with a sleek React interface.
- **Multiple Class Support**: Detects Melanoma, Basal cell carcinoma, Actinic keratoses, and more.
- **Glassmorphism UI**: A premium, futuristic dashboard for medical professionals.
- **Transfer Learning**: Built upon industry-standard pre-trained models for maximum accuracy.

## 🚀 Tech Stack

- **Frontend**: React.js, Vite, Framer Motion, Lucide Icons
- **Backend**: FastAPI, Python, Uvicorn
- **AI/ML**: TensorFlow, Keras, NumPy, OpenCV, PIL
- **Deployment**: GitHub Actions, Docker (Optional)

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js & npm

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the server:
   ```bash
   python main.py
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## 📊 Model Performance
The model was trained on the HAM10000 dataset, utilizing data augmentation techniques to ensure robustness.

| Metric | Score |
|--------|-------|
| Precision | 97.6% |
| F1-Score | 94.3% |
| Accuracy | 96.8% |

## 👤 Author
**Shivangi Manna**  
[LinkedIn](https://linkedin.com/in/shivangimanna) | [GitHub](https://github.com/shivangi-manna)

---
*Disclaimer: This project is for educational and research purposes only. Always consult a medical professional for diagnosis.*
